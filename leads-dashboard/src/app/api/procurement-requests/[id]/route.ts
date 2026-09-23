import { NextResponse } from 'next/server';
import { mutateCollection, readCollection } from '@/lib/server-db';
import { cascadeCloseAutoApprovals, deleteLinkedApprovalRequests, fanOutAutoApproval, resolveCentreHeadAdvisorPanel } from '@/lib/approval-sync';
import { requireSession, requirePermission, ForbiddenError } from '@/lib/session';
import { getAccessLevelSettingsServer, canDecideProcurementRequest } from '@/lib/permissions-server';
import { apiError } from '@/lib/api-error';

function summarizeItems(items: any[]): string {
  if (!Array.isArray(items) || items.length === 0) return 'materials';
  const summary = items.map(i => `${i.quantity} ${i.unit || ''} ${i.name}`.replace(/\s+/g, ' ').trim()).join(', ');
  return summary.length > 200 ? `${summary.slice(0, 197)}...` : summary;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireSession(request);
    const { id } = await params;
    const body = await request.json();

    const settings = await getAccessLevelSettingsServer();
    const existingRequests = await readCollection<any>('procurementRequests');
    const existing = existingRequests.find((r: any) => r.id === id);
    const isOwner = !!existing && (actor.id === existing.requesterId || (existing.requesterEmail && actor.email === existing.requesterEmail));
    const isDecision = body.status === 'Approved' || body.status === 'Rejected';
    const canDecide = canDecideProcurementRequest(actor, settings);

    if (isDecision) {
      requirePermission(canDecide, 'Only the Centre Head or Advisor can approve or reject a procurement request.');
    } else if (!isOwner && !canDecide) {
      throw new ForbiddenError("You don't have permission to edit this procurement request.");
    }

    let justApproved = false;
    let justRejected = false;
    let justResubmitted = false;
    let mergedRecord: any = null;

    const updated = await mutateCollection('procurementRequests', (current) => {
      const idx = current.findIndex((r: any) => r.id === id);
      if (idx === -1) return [...current, { id, ...body }];
      const next = [...current];
      const previousStatus = next[idx].status;
      const merged = { ...next[idx], ...body };
      if (previousStatus !== 'Approved' && merged.status === 'Approved') justApproved = true;
      if (previousStatus !== 'Rejected' && merged.status === 'Rejected') justRejected = true;
      if (previousStatus === 'Rejected' && merged.status === 'Pending') justResubmitted = true;
      next[idx] = merged;
      mergedRecord = merged;
      return next;
    });

    if (justApproved || justRejected) {
      try {
        await cascadeCloseAutoApprovals('procurement', id, justApproved ? 'approved' : 'rejected', mergedRecord?.decidedBy);
      } catch (approvalErr) {
        console.error('[procurement-requests-api] Approval cascade-close failed:', approvalErr);
      }

      if (mergedRecord?.requesterEmail) {
        try {
          const { dispatchEmail, generateProcurementDecisionEmailTemplate } = await import('@/lib/email-service');
          const template = generateProcurementDecisionEmailTemplate(
            mergedRecord.requesterName || 'there',
            summarizeItems(mergedRecord.items),
            justApproved,
            mergedRecord.decidedBy || 'the Centre Head',
            mergedRecord.decisionNotes
          );
          const log = await dispatchEmail({
            to: mergedRecord.requesterEmail,
            subject: template.subject,
            bodyText: template.bodyText,
            bodyHtml: template.bodyHtml,
            category: 'PROCUREMENT_DECISION',
          });
          const withEmail = await mutateCollection('procurementRequests', (current) => (current || []).map((r: any) =>
            r.id === id ? { ...r, decisionEmailSent: log.status === 'SENT', decisionEmailError: log.errorMessage } : r
          ));
          mergedRecord = withEmail.find((r: any) => r.id === id) || mergedRecord;
        } catch (emailErr: any) {
          console.error('[procurement-requests-api] Decision email dispatch failed:', emailErr);
          const message = emailErr?.message || 'Failed to notify the requester of the decision.';
          const withEmail = await mutateCollection('procurementRequests', (current) => (current || []).map((r: any) =>
            r.id === id ? { ...r, decisionEmailSent: false, decisionEmailError: message } : r
          ));
          mergedRecord = withEmail.find((r: any) => r.id === id) || mergedRecord;
        }
      }
    }

    // Resubmission after rejection — re-fan-out to the Centre Head/Advisor
    // panel, same as a brand-new submission (fanOutAutoApproval's own
    // idempotency guard makes this safe even though the earlier rejected
    // rows are already closed).
    if (justResubmitted) {
      try {
        const panel = await resolveCentreHeadAdvisorPanel();
        if (panel.length > 0) {
          await fanOutAutoApproval({
            entityType: 'procurement',
            entityId: id,
            entityTitle: summarizeItems(mergedRecord?.items),
            eventId: mergedRecord?.eventId,
            requesterId: mergedRecord?.requesterId || '',
            requesterName: mergedRecord?.requesterName || 'A member',
            requesterEmail: mergedRecord?.requesterEmail,
            message: 'This procurement request was revised and resubmitted after being rejected — please take another look.',
            customPanel: panel,
          });
        }
      } catch (approvalErr) {
        console.error('[procurement-requests-api] Resubmission fan-out failed:', approvalErr);
      }
    }

    return NextResponse.json(mergedRecord || updated.find((r: any) => r.id === id));
  } catch (err: any) {
    return apiError(err, 'procurement-requests-id-api-patch', 500);
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
    const existingRequests = await readCollection<any>('procurementRequests');
    const existing = existingRequests.find((r: any) => r.id === id);
    const isOwner = !!existing && (actor.id === existing.requesterId || (existing.requesterEmail && actor.email === existing.requesterEmail));
    if (!isOwner && !canDecideProcurementRequest(actor, settings) && actor.tier !== 1) {
      throw new ForbiddenError("You don't have permission to delete this procurement request.");
    }
    const updated = await mutateCollection('procurementRequests', (current) =>
      current.filter((r: any) => r.id !== id)
    );
    await deleteLinkedApprovalRequests('procurement', id);
    return NextResponse.json({ success: true, count: updated.length });
  } catch (err: any) {
    return apiError(err, 'procurement-requests-id-api-delete', 500);
  }
}
