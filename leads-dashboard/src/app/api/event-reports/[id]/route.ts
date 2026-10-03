import { NextResponse } from 'next/server';
import { mutateCollection, readCollection } from '@/lib/server-db';
import { saveBase64File, deleteStoredFile, deleteStoredFilesForRecord, readStoredFile } from '@/lib/file-storage';
import { cascadeCloseAutoApprovals, deleteLinkedApprovalRequests } from '@/lib/approval-sync';
import { requireSession, ForbiddenError } from '@/lib/session';
import { getAccessLevelSettingsServer, canReviewEventReports, hasCapabilityServer } from '@/lib/permissions-server';
import { apiError } from '@/lib/api-error';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

function isEventReportAuthor(existing: any, actor: any): boolean {
  if (!existing || !actor) return false;
  if (existing.submittedBy && actor.id === existing.submittedBy) return true;
  if (existing.submittedByEmail && actor.email && actor.email.toLowerCase() === existing.submittedByEmail.toLowerCase()) return true;
  if (existing.submittedBy && actor.name && actor.name === existing.submittedBy) return true;
  return false;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireSession(request);
    const { id } = await params;
    const body = await request.json();

    if (typeof body.fileSize === 'number' && body.fileSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File size exceeds the maximum limit of 25 MB.' }, { status: 400 });
    }

    // The centre_head/gg_events_head approve-or-reject branch is identified
    // by these approval fields; anything else is treated as a resubmit by
    // the report's own author.
    const settings = await getAccessLevelSettingsServer();
    const isApprovalAction = Object.prototype.hasOwnProperty.call(body, 'centreHeadApproved')
      || Object.prototype.hasOwnProperty.call(body, 'eventsHeadGgApproved')
      || Object.prototype.hasOwnProperty.call(body, 'reportScores')
      || Object.prototype.hasOwnProperty.call(body, 'reportScore')
      || body.status === 'approved'
      || body.status === 'rejected';
    if (isApprovalAction) {
      if (!canReviewEventReports(actor, settings)) throw new ForbiddenError();
    } else {
      const existingReports = await readCollection<any>('eventReports');
      const existing = existingReports.find((r: any) => r.id === id);
      if (!isEventReportAuthor(existing, actor) && !canReviewEventReports(actor, settings)) {
        throw new ForbiddenError();
      }
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
    // Head, Advisor, Super User, GG Campus Head of Events, and President, and separately
    // let the submitter know their report was accepted.
    if (justFullyApproved) {
      try {
        const [members, { dispatchEmail, generateEventReportApprovedEmailTemplate, findApprovalRecipients }] = await Promise.all([
          readCollection('members'),
          import('@/lib/email-service'),
        ]);
        const recipients = findApprovalRecipients(members as any[]);
        const superUserEmails = (recipients.superUsers || []).map(s => s.email).filter(Boolean);
        const to = Array.from(new Set([
          recipients.centreHead?.email,
          recipients.advisor?.email,
          ...superUserEmails,
          recipients.eventsHeadGg?.email,
          recipients.president?.email,
        ].filter(Boolean) as string[]));

        if (to.length > 0) {
          let attachments: Array<{ filename: string; content: Buffer }> | undefined = undefined;
          if (mergedRecord?.storageKey) {
            try {
              const fileBuffer = await readStoredFile(mergedRecord.storageKey);
              attachments = [{ filename: mergedRecord.fileName || 'event-report', content: fileBuffer }];
            } catch (fileErr) {
              console.warn('[event-reports-api] Failed to read report file for email attachment:', fileErr);
            }
          }
          const reviewerName = mergedRecord?.centreHeadApprovedBy || mergedRecord?.eventsHeadGgApprovedBy || actor.name || 'Reviewer';
          const reviewerRole = mergedRecord?.centreHeadApproved ? 'Centre Head' : 'GG Campus Events Head';
          const comments = mergedRecord?.reviewerComments || mergedRecord?.centreHeadComments || mergedRecord?.eventsHeadGgComments || body.reviewerComments || body.centreHeadComments || body.eventsHeadGgComments;
          const template = generateEventReportApprovedEmailTemplate(
            mergedRecord?.eventTitle || 'Event',
            mergedRecord?.submittedBy || 'General Secretary',
            reviewerName,
            reviewerRole,
            comments
          );

          const log = await dispatchEmail({
            to: to.join(','),
            subject: template.subject,
            bodyText: template.bodyText,
            bodyHtml: template.bodyHtml,
            category: 'EVENT_REPORT_APPROVAL',
            attachments,
          });

          await mutateCollection('eventReports', (current) => (current || []).map((r: any) =>
            r.id === id ? { ...r, emailSent: log.status === 'SENT' || log.status === 'BUFFERED', emailError: log.errorMessage } : r
          ));
          mergedRecord = { ...mergedRecord, emailSent: log.status === 'SENT' || log.status === 'BUFFERED', emailError: log.errorMessage };
        } else {
          await mutateCollection('eventReports', (current) => (current || []).map((r: any) =>
            r.id === id ? { ...r, emailSent: false, emailError: 'No Centre Head, Advisor, Super User, GG Campus Head of Events, or President found in the Directory to send the approved report to.' } : r
          ));
          mergedRecord = { ...mergedRecord, emailSent: false, emailError: 'No Centre Head, Advisor, Super User, GG Campus Head of Events, or President found in the Directory to send the approved report to.' };
        }

        if (mergedRecord?.submittedByEmail) {
          const { generateEventReportDecisionEmailTemplate } = await import('@/lib/email-service');
          const reviewerName = mergedRecord.centreHeadApprovedBy || mergedRecord.eventsHeadGgApprovedBy || actor.name || 'Reviewer';
          const reviewerRole = mergedRecord.centreHeadApproved ? 'Centre Head' : 'GG Campus Events Head';
          const comments = mergedRecord.reviewerComments || mergedRecord.centreHeadComments || mergedRecord.eventsHeadGgComments || body.reviewerComments || body.centreHeadComments || body.eventsHeadGgComments;
          const template = generateEventReportDecisionEmailTemplate(
            mergedRecord.eventTitle || 'Event',
            mergedRecord.submittedBy || 'General Secretary',
            true,
            reviewerName,
            reviewerRole,
            comments
          );
          await dispatchEmail({
            to: mergedRecord.submittedByEmail,
            subject: template.subject,
            bodyText: template.bodyText,
            bodyHtml: template.bodyHtml,
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

    if (justRejected && mergedRecord?.submittedByEmail) {
      try {
        const { dispatchEmail, generateEventReportDecisionEmailTemplate } = await import('@/lib/email-service');
        const decidedByName = mergedRecord.rejectedBy || actor.name || 'Reviewer';
        const comments = mergedRecord.rejectionReason || body.rejectionReason;
        const template = generateEventReportDecisionEmailTemplate(
          mergedRecord.eventTitle || 'Event',
          mergedRecord.submittedBy || 'General Secretary',
          false,
          decidedByName,
          'Reviewer',
          comments
        );
        await dispatchEmail({
          to: mergedRecord.submittedByEmail,
          subject: template.subject,
          bodyText: template.bodyText,
          bodyHtml: template.bodyHtml,
          category: 'EVENT_REPORT_APPROVAL',
        });
      } catch (rejectEmailErr) {
        console.error('[event-reports-api] Submitter rejection email failed:', rejectEmailErr);
      }
    }

    return NextResponse.json(mergedRecord || updated.find((r: any) => r.id === id));
  } catch (err: any) {
    return apiError(err, 'event-reports-id-api-patch', 500);
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
    const existingReports = await readCollection<any>('eventReports');
    const existing = existingReports.find((r: any) => r.id === id);
    if (
      !isEventReportAuthor(existing, actor) &&
      !canReviewEventReports(actor, settings) &&
      actor.tier !== 1 &&
      !(await hasCapabilityServer(actor, 'EVENT_REPORTS_DELETE'))
    ) {
      throw new ForbiddenError();
    }
    let found = false;
    await mutateCollection('eventReports', (current) => {
      const filtered = (current || []).filter((r: any) => r.id !== id);
      found = filtered.length < (current || []).length;
      return filtered;
    });
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await deleteStoredFilesForRecord('event-reports', id);
    await deleteLinkedApprovalRequests('event-report', id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return apiError(err, 'event-reports-id-api-delete', 500);
  }
}
