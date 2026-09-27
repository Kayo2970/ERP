import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { fanOutAutoApproval, resolveCentreHeadAdvisorPanel } from '@/lib/approval-sync';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/api-error';

import { canDecideProcurementRequest, getAccessLevelSettingsServer } from '@/lib/permissions-server';
import { enqueueTaskEmailNotification } from '@/lib/task-email-queue';

function summarizeItems(items: any[]): string {
  if (!Array.isArray(items) || items.length === 0) return 'materials';
  const summary = items.map(i => `${i.quantity} ${i.unit || ''} ${i.name}`.replace(/\s+/g, ' ').trim()).join(', ');
  return summary.length > 200 ? `${summary.slice(0, 197)}...` : summary;
}

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const items = await readCollection('procurementRequests');
    return NextResponse.json(items);
  } catch (err: any) {
    return apiError(err, 'procurement-requests-api-get', 500);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSession(request); // any signed-in member may submit a request
    const settings = await getAccessLevelSettingsServer();
    const item = await request.json();

    if (!Array.isArray(item.items) || item.items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required.' }, { status: 400 });
    }
    for (const line of item.items) {
      if (!line.name || typeof line.quantity !== 'number' || line.quantity <= 0) {
        return NextResponse.json({ error: 'Each item needs a name and a positive quantity.' }, { status: 400 });
      }
    }

    const isAutoApprover = canDecideProcurementRequest(actor, settings) || actor.tier === 1;
    const id = item.id || 'proc_' + Date.now();
    const taskId = `task_procurement_${id}`;

    const newRequest = {
      ...item,
      id,
      status: isAutoApprover ? 'Approved' : 'Pending',
      decidedBy: isAutoApprover ? actor.name : undefined,
      decidedAt: isAutoApprover ? new Date().toISOString() : undefined,
      decisionNotes: isAutoApprover ? 'Auto-approved (created by Centre Head / Advisor / Super User)' : undefined,
      procurementTaskId: isAutoApprover ? taskId : undefined,
      submittedAt: item.submittedAt || new Date().toISOString(),
    };

    const updated = await mutateCollection('procurementRequests', (current) => {
      const idx = current.findIndex((r: any) => r.id === newRequest.id);
      if (idx >= 0) {
        current[idx] = newRequest;
        return [...current];
      }
      return [newRequest, ...current];
    });

    let created = updated.find((r: any) => r.id === newRequest.id);

    // If created by Centre Head / Advisor / Super User: auto-approved, no permission needed!
    // Directly add to tasks collection and notify the Centre Head/Professor to procure.
    if (isAutoApprover) {
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

      const itemsSummary = summarizeItems(newRequest.items);
      const title = `Procure items for ${newRequest.eventName || newRequest.taskTitle || 'Centre'}: ${itemsSummary}`;

      let dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      if (newRequest.eventId) {
        const ev = events.find((e: any) => e.id === newRequest.eventId);
        if (ev?.startDate && !ev.datesTBD) dueDate = ev.startDate;
      } else if (newRequest.taskId) {
        const t = tasks.find((tk: any) => tk.id === newRequest.taskId);
        if (t?.dueDate) dueDate = t.dueDate;
      }

      const itemsDetail = (newRequest.items || [])
        .map((i: any) => `• ${i.quantity} ${i.unit || ''} ${i.name}${i.notes ? ` (${i.notes})` : ''}`)
        .join('\n');

      const briefDescription = `This is for the Centre Head to procure:\n${itemsDetail}\n\nRequested by: ${newRequest.requesterName || actor.name}${newRequest.justification ? `\nJustification: ${newRequest.justification}` : ''}\n\nNote: Procurement tasks are administrative operations and not subject to ratings or reviews.`;

      const procurementTask = {
        id: taskId,
        title,
        event: newRequest.eventName,
        eventId: newRequest.eventId,
        assignee: centreHead ? centreHead.name : 'Centre Head',
        assigneeId: centreHead?.id,
        assigneeEmail: centreHead?.email,
        assigneeType: 'individual',
        dueDate,
        status: 'Assigned',
        creatorName: actor.name,
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

      if (centreHead?.email) {
        try {
          await enqueueTaskEmailNotification({
            id: taskId,
            title,
            event: newRequest.eventName || 'LEADS Operations',
            dueDate,
            creatorName: actor.name,
            assigneeEmail: centreHead.email,
            assigneeName: centreHead.name,
          });
        } catch (emailErr) {
          console.error('[procurement-requests-api] Failed to enqueue task notification:', emailErr);
        }
      }
    } else {
      // Fan out the approval email + Approvals-inbox rows to the Centre Head
      // and Advisor only — never the wider default panel — per the module's
      // own design (see permissions.ts's canDecideProcurementRequest).
      let approvalEmailSent = false;
      let approvalEmailError: string | undefined;
      try {
        const panel = await resolveCentreHeadAdvisorPanel();
        if (panel.length === 0) {
          approvalEmailError = 'No Centre Head or Advisor found in the Directory to send the approval request to.';
        } else {
          await fanOutAutoApproval({
            entityType: 'procurement',
            entityId: created.id,
            entityTitle: summarizeItems(created.items),
            eventId: created.eventId,
            requesterId: created.requesterId || actor.id || '',
            requesterName: created.requesterName || actor.name || 'A member',
            requesterEmail: created.requesterEmail || actor.email,
            message: created.justification,
            customPanel: panel,
          });
          approvalEmailSent = true;
        }
      } catch (approvalErr: any) {
        console.error('[procurement-requests-api] Approval fan-out failed:', approvalErr);
        approvalEmailError = approvalErr?.message || 'Failed to send the approval request email.';
      }

      const finalUpdated = await mutateCollection('procurementRequests', (current) => (current || []).map((r: any) =>
        r.id === id ? { ...r, approvalEmailSent, approvalEmailError } : r
      ));
      created = finalUpdated.find((r: any) => r.id === id);
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return apiError(err, 'procurement-requests-api-post', 500);
  }
}
