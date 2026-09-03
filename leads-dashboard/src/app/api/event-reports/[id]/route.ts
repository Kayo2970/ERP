import { NextResponse } from 'next/server';
import { mutateCollection, readCollection } from '@/lib/server-db';
import { saveBase64File, deleteStoredFile, deleteStoredFilesForRecord, readStoredFile } from '@/lib/file-storage';
import { cascadeCloseAutoApprovals } from '@/lib/approval-sync';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (typeof body.fileSize === 'number' && body.fileSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File size exceeds the maximum limit of 25 MB.' }, { status: 400 });
    }

    // A resubmission's replaced file arrives as a base64 data URL, same as
    // a brand-new submission's — give it the same on-disk treatment.
    let previousStorageKey: string | undefined;
    if (typeof body.fileData === 'string' && body.fileData.startsWith('data:')) {
      const stored = await saveBase64File('event-reports', id, 0, body.fileName || 'file', body.fileData);
      body.fileUrl = stored.url;
      body.storageKey = stored.storageKey;
      body.fileSize = stored.size;
      delete body.fileData;
    }

    let justFullyApproved = false;
    let justRejected = false;
    let mergedRecord: any = null;

    const updated = await mutateCollection('eventReports', (current) => {
      const idx = (current || []).findIndex((r: any) => r.id === id);
      if (idx === -1) return [...(current || []), { id, ...body }];

      const next = [...current];
      if (body.storageKey && next[idx].storageKey && next[idx].storageKey !== body.storageKey) {
        previousStorageKey = next[idx].storageKey;
      }

      const wasFullyApproved = next[idx].status === 'approved';
      const wasRejected = next[idx].status === 'rejected';
      const merged = { ...next[idx], ...body };

      // Any ONE of the Centre Head, Advisor, or GG Campus Head of Events
      // ticking it off is enough to finalize approval — Advisor's sign-off
      // lands in centreHeadApproved too (isCentreHead already folds Advisor
      // in, see permissions.ts), it isn't a fourth required signature.
      if (!wasFullyApproved && (merged.centreHeadApproved || merged.eventsHeadGgApproved)) {
        merged.status = 'approved';
        justFullyApproved = true;
      }
      if (!wasFullyApproved && !wasRejected && merged.status === 'rejected') {
        justRejected = true;
      }

      next[idx] = merged;
      mergedRecord = merged;
      return next;
    });

    if (previousStorageKey) {
      await deleteStoredFile(previousStorageKey);
    }

    if (justFullyApproved || justRejected) {
      try {
        await cascadeCloseAutoApprovals('event-report', id, justFullyApproved ? 'approved' : 'rejected', mergedRecord?.centreHeadApprovedBy || mergedRecord?.eventsHeadGgApprovedBy || mergedRecord?.rejectedBy);
      } catch (approvalErr) {
        console.error('[event-reports-api] Approval cascade-close failed:', approvalErr);
      }
    }

    // Once approved, email the report file as an attachment to the Centre
    // Head, Advisor, GG Campus Head of Events, and President, and separately
    // let the submitter know their report was accepted.
    if (justFullyApproved && mergedRecord?.storageKey) {
      try {
        const [members, { dispatchEmail, generateEventReportApprovedEmailTemplate, findApprovalRecipients }] = await Promise.all([
          readCollection('members'),
          import('@/lib/email-service'),
        ]);
        const recipients = findApprovalRecipients(members as any[]);
        const to = [recipients.centreHead?.email, recipients.advisor?.email, recipients.eventsHeadGg?.email, recipients.president?.email].filter(Boolean) as string[];

        if (to.length > 0) {
          const fileBuffer = await readStoredFile(mergedRecord.storageKey);
          const template = generateEventReportApprovedEmailTemplate(mergedRecord.eventTitle || 'Event', mergedRecord.submittedBy || 'General Secretary');

          const log = await dispatchEmail({
            to: to.join(','),
            subject: template.subject,
            bodyText: template.bodyText,
            bodyHtml: template.bodyHtml,
            category: 'EVENT_REPORT_APPROVAL',
            attachments: [{ filename: mergedRecord.fileName || 'event-report', content: fileBuffer }],
          });

          await mutateCollection('eventReports', (current) => (current || []).map((r: any) =>
            r.id === id ? { ...r, emailSent: log.status === 'SENT', emailError: log.errorMessage } : r
          ));
          mergedRecord = { ...mergedRecord, emailSent: log.status === 'SENT', emailError: log.errorMessage };
        } else {
          await mutateCollection('eventReports', (current) => (current || []).map((r: any) =>
            r.id === id ? { ...r, emailSent: false, emailError: 'No Centre Head, Advisor, GG Campus Head of Events, or President found in the Directory to send the approved report to.' } : r
          ));
          mergedRecord = { ...mergedRecord, emailSent: false, emailError: 'No Centre Head, Advisor, GG Campus Head of Events, or President found in the Directory to send the approved report to.' };
        }

        if (mergedRecord?.submittedByEmail) {
          const { wrapInMasterEmailTemplate } = await import('@/lib/email-service');
          await dispatchEmail({
            to: mergedRecord.submittedByEmail,
            subject: `Event Report Accepted: ${mergedRecord.eventTitle || 'Event'}`,
            bodyText: `Hello ${mergedRecord.submittedBy || ''},\n\nThe report has been successfully submitted and accepted.\n\nRegards,\nLEADS Next Gen Centre, MSRUAS`,
            bodyHtml: wrapInMasterEmailTemplate({
              pageTitle: `Event Report Accepted`,
              headerTitle: 'Report Accepted',
              headerSubtitle: mergedRecord.eventTitle || 'Event',
              badgeText: 'ACCEPTED',
              badgeColor: '#15803d',
              bodyContentHtml: `<p style="margin-top:0;color:#0f172a;font-size:14px;">Hello ${mergedRecord.submittedBy || ''},</p><p style="color:#334155;font-size:14px;line-height:1.6;">The report has been successfully submitted and accepted.</p>`,
            }),
            category: 'EVENT_REPORT_APPROVAL',
          });
        }
      } catch (emailErr: any) {
        console.error('[event-reports-api] Approval email dispatch failed:', emailErr);
        const message = emailErr?.message || 'Failed to send the approved report email.';
        await mutateCollection('eventReports', (current) => (current || []).map((r: any) =>
          r.id === id ? { ...r, emailSent: false, emailError: message } : r
        ));
        mergedRecord = { ...mergedRecord, emailSent: false, emailError: message };
      }
    }

    return NextResponse.json(mergedRecord || updated.find((r: any) => r.id === id));
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
    let found = false;
    await mutateCollection('eventReports', (current) => {
      const filtered = (current || []).filter((r: any) => r.id !== id);
      found = filtered.length < (current || []).length;
      return filtered;
    });
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await deleteStoredFilesForRecord('event-reports', id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
