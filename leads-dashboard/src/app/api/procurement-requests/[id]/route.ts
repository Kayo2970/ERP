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
    const isDecision = body.status === 'Approved' || body.status === 'Rejected' || body.status === 'Completed';
    const canDecide = canDecideProcurementRequest(actor, settings);

    if (isDecision) {
      requirePermission(canDecide, 'Only the Centre Head or Advisor can decide or complete a procurement request.');
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

      // If approved, create the task for the Centre Head to procure the items
      if (justApproved) {
        try {
          const taskId = `task_procurement_${id}`;
          const [members, events, tasks] = await Promise.all([
            readCollection<any>('members'),
            readCollection<any>('events'),
            readCollection<any>('tasks'),
          ]);

          const active = (members || []).filter((m: any) => m.status !== 'Terminated' && m.email);
          const centreHead = active.find((m: any) => {
            const role = (m.role || '').toLowerCase();
            return role.includes('centre head') || role.includes('center head');
          }) || active.find((m: any) => m.tier === 1) || active[0];

          const itemsSummary = summarizeItems(mergedRecord?.items || []);
          const title = `Procure items for ${mergedRecord?.eventName || mergedRecord?.taskTitle || 'Centre'}: ${itemsSummary}`;

          let dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          if (mergedRecord?.eventId) {
            const ev = events.find((e: any) => e.id === mergedRecord.eventId);
            if (ev?.startDate && !ev.datesTBD) dueDate = ev.startDate;
          } else if (mergedRecord?.taskId) {
            const t = tasks.find((tk: any) => tk.id === mergedRecord.taskId);
            if (t?.dueDate) dueDate = t.dueDate;
          }

          const itemsDetail = (mergedRecord?.items || [])
            .map((i: any) => `• ${i.quantity} ${i.unit || ''} ${i.name}${i.notes ? ` (${i.notes})` : ''}`)
            .join('\n');

          const briefDescription = `This is for the Centre Head to procure:\n${itemsDetail}\n\nRequested by: ${mergedRecord?.requesterName || 'A member'}${mergedRecord?.justification ? `\nJustification: ${mergedRecord.justification}` : ''}\n\nNote: Procurement tasks are administrative operations and not subject to ratings or reviews.`;

          const procurementTask = {
            id: taskId,
            title,
            event: mergedRecord?.eventName,
            eventId: mergedRecord?.eventId,
            assignee: centreHead ? centreHead.name : 'Centre Head',
            assigneeId: centreHead?.id,
            assigneeEmail: centreHead?.email,
            assigneeType: 'individual',
            dueDate,
            status: 'Assigned',
            creatorName: mergedRecord?.requesterName || actor.name,
            workflowType: 'procurement',
            isProcurement: true,
            procurementId: id,
            briefDescription,
          };

          await mutateCollection('tasks', (current) => {
            const idx = current.findIndex((t: any) => t.id === taskId);
            if (idx >= 0) return current;
            return [procurementTask, ...current];
          });

          const withTask = await mutateCollection('procurementRequests', (current) =>
            (current || []).map((r: any) => (r.id === id ? { ...r, procurementTaskId: taskId } : r))
          );
          mergedRecord = withTask.find((r: any) => r.id === id) || mergedRecord;

          if (centreHead?.email) {
            const { enqueueTaskEmailNotification } = await import('@/lib/task-email-queue');
            await enqueueTaskEmailNotification({
              id: taskId,
              title,
              event: mergedRecord?.eventName || 'LEADS Operations',
              dueDate,
              creatorName: mergedRecord?.requesterName || actor.name,
              assigneeEmail: centreHead.email,
              assigneeName: centreHead.name,
            });
          }
        } catch (taskErr) {
          console.error('[procurement-requests-api] Failed to create procurement task on approval:', taskErr);
        }
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

    if (body.status === 'Completed') {
      try {
        await mutateCollection('tasks', (current) =>
          (current || []).map((t: any) => {
            if (t.id === `task_procurement_${id}` || t.procurementId === id || t.id === mergedRecord?.procurementTaskId) {
              return { ...t, status: 'Completed', decidedBy: actor.name, decidedAt: new Date().toISOString() };
            }
            return t;
          })
        );
      } catch (completeErr) {
        console.error('[procurement-requests-api] Failed to sync task completion:', completeErr);
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
    await mutateCollection('tasks', (current) =>
      current.filter((t: any) => t.id !== `task_procurement_${id}` && t.procurementId !== id && t.id !== existing?.procurementTaskId)
    );
    await deleteLinkedApprovalRequests('procurement', id);
    return NextResponse.json({ success: true, count: updated.length });
  } catch (err: any) {
    return apiError(err, 'procurement-requests-id-api-delete', 500);
  }
}
