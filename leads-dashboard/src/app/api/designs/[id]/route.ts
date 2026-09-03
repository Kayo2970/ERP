import { NextResponse } from 'next/server';
import { mutateCollection, readCollection } from '@/lib/server-db';
import { deleteStoredFile, deleteStoredFilesForRecord, saveBase64File, readStoredFile } from '@/lib/file-storage';
import { cascadeCloseAutoApprovals } from '@/lib/approval-sync';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

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
      const merged = { ...next[idx], ...body };
      if (!wasStyleApproved && merged.styleStatus === 'Style Approved') {
        justStyleApproved = true;
      }
      if (!wasStyleRejected && merged.styleStatus === 'Style Rejected') {
        justStyleRejected = true;
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updated = await mutateCollection('designs', (current) =>
      current.filter((d: any) => d.id !== id)
    );
    await deleteStoredFilesForRecord('designs', id);
    return NextResponse.json({ success: true, count: updated.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
