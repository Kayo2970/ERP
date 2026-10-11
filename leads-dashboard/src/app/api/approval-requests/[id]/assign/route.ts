import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { requireSession, requirePermission } from '@/lib/session';
import { getAccessLevelSettingsServer, isCentreHead } from '@/lib/permissions-server';
import { apiError } from '@/lib/api-error';
import { enqueueTaskEmailNotification } from '@/lib/task-email-queue';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Festival rows in Approvals: the underlying task does not exist (and nobody is emailed) until a person assigns it here.
 * Body: { assigneeIds: string[] } creates the task from the row's payload, assigns it and emails the assignees;
 *       { skip: true } closes the row (the scheduler never re-raises a festival that has any row).
 * Either way, every sibling row for the same festival step is closed.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireSession(request);
    const { id } = await params;
    const body = (await request.json()) as { assigneeIds?: string[]; skip?: boolean };

    const row = (await readCollection<any>('approvalRequests')).find((r: any) => r.id === id);
    if (!row || row.entityType !== 'festival') return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (row.status !== 'pending') return NextResponse.json({ error: 'This festival has already been dealt with.' }, { status: 409 });

    const settings = await getAccessLevelSettingsServer();
    const isTarget = !!actor.id && actor.id === row.targetMemberId;
    requirePermission(isTarget || isCentreHead(actor, settings) || actor.tier === 1, 'Only the member this request was sent to can assign it.');

    const now = new Date().toISOString();
    const closeRows = (status: 'approved' | 'rejected', note: string) =>
      mutateCollection<any>('approvalRequests', (current = []) =>
        current.map((r: any) =>
          r.entityType === 'festival' && r.entityId === row.entityId && r.status === 'pending'
            ? { ...r, status, decidedBy: actor.name, decidedAt: now, decisionNote: note }
            : r
        )
      );

    if (body.skip) {
      await closeRows('rejected', `Skipped by ${actor.name}.`);
      return NextResponse.json({ skipped: true });
    }

    const ids = Array.isArray(body.assigneeIds) ? [...new Set(body.assigneeIds.map(String))] : [];
    if (ids.length === 0) return NextResponse.json({ error: 'Choose at least one person to assign.' }, { status: 400 });
    if (ids.length > 50) return NextResponse.json({ error: 'Assign to at most 50 people.' }, { status: 400 });
    const members = await readCollection<any>('members');
    const assignees = ids.map((i) => members.find((m: any) => m.id === i && m.status !== 'Terminated')).filter(Boolean);
    if (assignees.length === 0) return NextResponse.json({ error: 'None of the chosen members are active.' }, { status: 400 });

    const p = row.payload || {};
    if (!p.taskId || !p.title) return NextResponse.json({ error: 'This request has no task to create.' }, { status: 400 });
    const single = assignees.length === 1 ? assignees[0] : null;
    let createdTask = false;
    await mutateCollection<any>('tasks', (current = []) => {
      if (current.some((t: any) => t.id === p.taskId)) return current; // idempotent
      createdTask = true;
      return [
        {
          id: p.taskId,
          title: p.title,
          event: p.event,
          eventId: p.eventId,
          assignee: assignees.map((a: any) => a.name).join(', '),
          assigneeType: single ? 'individual' : 'group',
          assigneeId: single?.id,
          assigneeEmail: single?.email,
          assigneeIds: assignees.map((a: any) => a.id),
          dueDate: p.dueDate,
          status: 'Assigned',
          creatorName: actor.name,
          workflowType: p.workflowType,
          isSocialMediaPost: p.isSocialMediaPost,
          taskCategory: p.taskCategory,
          briefDescription: p.briefDescription,
        },
        ...current,
      ];
    });

    // The one and only place a festival task emails anyone — and only the people just chosen.
    if (createdTask) {
      for (const a of assignees) {
        if (!a.email) continue;
        await enqueueTaskEmailNotification({
          id: p.taskId,
          title: p.title,
          event: p.event,
          dueDate: p.dueDate,
          creatorName: actor.name,
          assigneeEmail: a.email,
          assigneeName: a.name,
        });
      }
    }

    await closeRows('approved', `Assigned to ${assignees.map((a: any) => a.name).join(', ')} by ${actor.name}.`);
    return NextResponse.json({ assigned: assignees.length, taskId: p.taskId, created: createdTask });
  } catch (err) {
    return apiError(err, 'approval-requests:assign');
  }
}
