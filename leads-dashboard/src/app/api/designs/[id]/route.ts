import { NextResponse } from 'next/server';
import { mutateCollection, readCollection } from '@/lib/server-db';
import { deleteStoredFile, deleteStoredFilesForRecord, saveBase64File, readStoredFile } from '@/lib/file-storage';
import { cascadeCloseAutoApprovals } from '@/lib/approval-sync';
import { requireSession, sessionErrorStatus, ForbiddenError } from '@/lib/session';
import { getAccessLevelSettingsServer, canReviewDesignProofread, canViewAllDesigns } from '@/lib/permissions-server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireSession(request);
    const { id } = await params;
    const body = await request.json();

    // Two branches share this one merge-patch handler: a style-approve/reject
    // or proofread-review decision (identified by the presence of these
    // fields), vs a plain edit by the design's own submitter. Gate each
    // separately rather than one blanket check.
    const settings = await getAccessLevelSettingsServer();
    const isReviewAction = Object.prototype.hasOwnProperty.call(body, 'styleStatus')
      || Object.prototype.hasOwnProperty.call(body, 'review');
    if (isReviewAction) {
      if (!canReviewDesignProofread(actor, settings)) throw new ForbiddenError();
    } else {
      const existingDesigns = await readCollection<any>('designs');
      const existing = existingDesigns.find((d: any) => d.id === id);
      const isOwner = !!existing && actor.id === existing.designerId;
      if (!isOwner && !canViewAllDesigns(actor, settings)) throw new ForbiddenError();
    }

    // A replaced file arrives the same way a brand-new submission's does —
    // a base64 data URL — so it needs the same on-disk treatment POST gives
    // it, not a blind merge that would poison designs.json with raw bytes.
    let previousStorageKey: string | undefined;
    if (typeof body.fileData === 'string' && body.fileData.startsWith('data:')) {
      const stored = await saveBase64File('designs', id, 0, body.fileName || 'file', body.fileData);
      body.fileUrl = stored.url;
      body.storageKey = stored.storageKey;
      body.fileSize = stored.size;
      delete body.fileData;
    }

    let justStyleApproved = false;
    let justStyleRejected = false;
    let justProofreadApproved = false;
    let justProofreadRejected = false;
    let mergedRecord: any = null;

    // Upsert: if this id isn't in the server's collection yet (e.g. client-bundled
    // sample/seed data never POSTed), create it instead of silently dropping the
    // edit — same fix already applied to every other collection's [id] route.
    const updated = await mutateCollection('designs', (current) => {
      const idx = current.findIndex((d: any) => d.id === id);
      if (idx === -1) return [...current, { id, ...body }];
      const next = [...current];
      if (body.storageKey && next[idx].storageKey && next[idx].storageKey !== body.storageKey) {
        previousStorageKey = next[idx].storageKey;
      }
      const previousStyleStatus = next[idx].styleStatus;
      const wasStyleApproved = previousStyleStatus === 'Style Approved';
      const wasStyleRejected = previousStyleStatus === 'Style Rejected';
      const previousReviewStatus = next[idx].review?.status;
      const wasProofreadApproved = previousReviewStatus === 'Proofread Approved';
      const wasProofreadRejected = previousReviewStatus === 'Changes Requested';
      const merged = { ...next[idx], ...body };
      if (!wasStyleApproved && merged.styleStatus === 'Style Approved') {
        justStyleApproved = true;
      }
      if (!wasStyleRejected && merged.styleStatus === 'Style Rejected') {
        justStyleRejected = true;
      }
      if (!wasProofreadApproved && merged.review?.status === 'Proofread Approved') {
        justProofreadApproved = true;
      }
      if (!wasProofreadRejected && merged.review?.status === 'Changes Requested') {
        justProofreadRejected = true;
      }
      next[idx] = merged;
      mergedRecord = merged;
      return next;
    });

    // Best-effort cleanup of the file just replaced, so old assets don't
    // accumulate on disk under a different filename than the new one.
    if (previousStorageKey) {
      await deleteStoredFile(previousStorageKey);
    }

    // Resolve any still-pending fan-out rows this design's submission raised
    // in the Approvals module — whichever of the Centre Head/Advisor/GG
    // Campus Events Head made this style decision resolves it everywhere.
    if (justStyleApproved || justStyleRejected) {
      try {
        await cascadeCloseAutoApprovals('design', id, justStyleApproved ? 'approved' : 'rejected', mergedRecord?.styleDecidedBy);
      } catch (approvalErr) {
        console.error('[designs-api] Approval cascade-close failed:', approvalErr);
      }
    }

    // Same cascade-close for the proofread decision — whichever of the Centre
    // Head/Advisor/GG Campus Events Head approved or requested changes resolves
    // the pending fan-out for the other two panel members as well.
    if (justProofreadApproved || justProofreadRejected) {
      try {
        await cascadeCloseAutoApprovals('design', id, justProofreadApproved ? 'approved' : 'rejected', mergedRecord?.review?.proofreaderName);
      } catch (approvalErr) {
        console.error('[designs-api] Proofread approval cascade-close failed:', approvalErr);
      }
    }

    // Once Style Approved — by the Centre Head, Advisor, or GG Campus Head of
    // Events (see the isCentreHead(user)/isDesignHead(user) gate in
    // dashboard/designs/page.tsx, which already treats Advisor as Centre
    // Head) — email the design asset as an attachment to all three, using
    // each member's own registered email address (Member.email, collected at
    // account activation/registration — see findApprovalRecipients).
    if (justStyleApproved && mergedRecord?.storageKey) {
      try {
        const [members, { dispatchEmail, generateDesignApprovedEmailTemplate, findApprovalRecipients }] = await Promise.all([
          readCollection('members'),
          import('@/lib/email-service'),
        ]);
        const recipients = findApprovalRecipients(members as any[]);
        const to = [recipients.centreHead?.email, recipients.advisor?.email, recipients.eventsHeadGg?.email].filter(Boolean) as string[];

        if (to.length > 0) {
          const fileBuffer = await readStoredFile(mergedRecord.storageKey);
          const template = generateDesignApprovedEmailTemplate(mergedRecord.title || 'Design', mergedRecord.designerName || 'Designer');

          const log = await dispatchEmail({
            to: to.join(','),
            subject: template.subject,
            bodyText: template.bodyText,
            bodyHtml: template.bodyHtml,
            category: 'DESIGN_APPROVAL',
            attachments: [{ filename: mergedRecord.fileName || 'design-asset', content: fileBuffer }],
          });

          await mutateCollection('designs', (current) => (current || []).map((d: any) =>
            d.id === id ? { ...d, styleApprovalEmailSent: log.status === 'SENT', styleApprovalEmailError: log.errorMessage } : d
          ));
          mergedRecord = { ...mergedRecord, styleApprovalEmailSent: log.status === 'SENT', styleApprovalEmailError: log.errorMessage };
        } else {
          const noRecipientsMsg = 'No Centre Head, Advisor, or GG Campus Head of Events found in the Directory to send the approved design to.';
          await mutateCollection('designs', (current) => (current || []).map((d: any) =>
            d.id === id ? { ...d, styleApprovalEmailSent: false, styleApprovalEmailError: noRecipientsMsg } : d
          ));
          mergedRecord = { ...mergedRecord, styleApprovalEmailSent: false, styleApprovalEmailError: noRecipientsMsg };
        }
      } catch (emailErr: any) {
        console.error('[designs-api] Style-approval email dispatch failed:', emailErr);
        const message = emailErr?.message || 'Failed to send the approved design email.';
        await mutateCollection('designs', (current) => (current || []).map((d: any) =>
          d.id === id ? { ...d, styleApprovalEmailSent: false, styleApprovalEmailError: message } : d
        ));
        mergedRecord = { ...mergedRecord, styleApprovalEmailSent: false, styleApprovalEmailError: message };
      }
    }

    return NextResponse.json(mergedRecord || updated.find((d: any) => d.id === id));
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    return NextResponse.json({ error: err.message }, { status: status || 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireSession(request);
    const { id } = await params;
    const settings = await getAccessLevelSettingsServer();
    const existingDesigns = await readCollection<any>('designs');
    const existing = existingDesigns.find((d: any) => d.id === id);
    const isOwner = !!existing && actor.id === existing.designerId;
    if (!isOwner && !canViewAllDesigns(actor, settings) && actor.tier !== 1) {
      throw new ForbiddenError();
    }
    const updated = await mutateCollection('designs', (current) =>
      current.filter((d: any) => d.id !== id)
    );
    await deleteStoredFilesForRecord('designs', id);
    return NextResponse.json({ success: true, count: updated.length });
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    return NextResponse.json({ error: err.message }, { status: status || 500 });
  }
}
