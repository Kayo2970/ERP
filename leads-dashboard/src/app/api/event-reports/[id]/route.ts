import { NextResponse } from 'next/server';
import { mutateCollection, readCollection } from '@/lib/server-db';
import { saveBase64File, deleteStoredFile, deleteStoredFilesForRecord, readStoredFile } from '@/lib/file-storage';

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
    let mergedRecord: any = null;

    const updated = await mutateCollection('eventReports', (current) => {
      const idx = (current || []).findIndex((r: any) => r.id === id);
      if (idx === -1) return [...(current || []), { id, ...body }];

      const next = [...current];
      if (body.storageKey && next[idx].storageKey && next[idx].storageKey !== body.storageKey) {
        previousStorageKey = next[idx].storageKey;
      }

      const wasFullyApproved = next[idx].status === 'approved';
      const merged = { ...next[idx], ...body };

      // Dual sign-off: both the Centre Head and the GG Campus Head of Events
      // must independently approve before this counts as approved — neither
      // approval alone finalizes it.
      if (!wasFullyApproved && merged.centreHeadApproved && merged.eventsHeadGgApproved) {
        merged.status = 'approved';
        justFullyApproved = true;
      }

      next[idx] = merged;
      mergedRecord = merged;
      return next;
    });

    if (previousStorageKey) {
      await deleteStoredFile(previousStorageKey);
    }

    // Once fully approved, email the report file as an attachment to the
    // Centre Head, GG Campus Head of Events, and President.
    if (justFullyApproved && mergedRecord?.storageKey) {
      try {
        const [members, { dispatchEmail, generateEventReportApprovedEmailTemplate, findApprovalRecipients }] = await Promise.all([
          readCollection('members'),
          import('@/lib/email-service'),
        ]);
        const recipients = findApprovalRecipients(members as any[]);
        const to = [recipients.centreHead?.email, recipients.eventsHeadGg?.email, recipients.president?.email].filter(Boolean) as string[];

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
            r.id === id ? { ...r, emailSent: false, emailError: 'No Centre Head, GG Campus Head of Events, or President found in the Directory to send the approved report to.' } : r
          ));
          mergedRecord = { ...mergedRecord, emailSent: false, emailError: 'No Centre Head, GG Campus Head of Events, or President found in the Directory to send the approved report to.' };
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
