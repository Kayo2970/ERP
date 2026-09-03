import { NextResponse } from 'next/server';
import { mutateCollection } from '@/lib/server-db';
import { enqueueTaskEmailNotification } from '@/lib/task-email-queue';
import { deleteStoredFilesForRecord } from '@/lib/file-storage';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    // Upsert: if this id isn't in the server's collection yet (e.g. client-bundled
    // sample/seed data never POSTed), create it instead of 404ing and silently
    // dropping the edit.
    let previous: any = null;
    const updated = await mutateCollection('tasks', (current) => {
      const idx = current.findIndex((item: any) => item.id === id);
      if (idx === -1) return [...current, { id, ...updates }];
      previous = current[idx];
      const next = [...current];
      next[idx] = { ...next[idx], ...updates };
      return next;
    });
    const result = updated.find((t: any) => t.id === id);

    // A pending edit (e.g. a delegated task — see delegateAutoTask in
    // local-data.ts) just got approved and changed who it's assigned to —
    // let the new assignee know, mirroring the notification a brand-new
    // task gets on creation (see the tasks POST route).
    if (
      result &&
      previous?.approvalStatus === 'pending_edit' &&
      result.approvalStatus === 'approved' &&
      result.assigneeEmail &&
      result.assigneeEmail !== previous.assigneeEmail
    ) {
      try {
        await enqueueTaskEmailNotification({
          id: result.id,
          title: result.title,
          event: result.event || result.eventName,
          dueDate: result.dueDate,
          creatorName: result.creatorName || result.assignerName,
          assigneeEmail: result.assigneeEmail,
          assigneeName: result.assignee || 'Member',
        });
      } catch (emailErr) {
        console.error('[tasks-api] Failed to enqueue reassignment notification:', emailErr);
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// Scheduler-generated workflows (see holiday-scheduler.ts / event-social-scheduler.ts)
// that recreate a deterministic-id task for an event on every boot/weekly/daily
// catch-up run as long as the event still exists and no such task is present.
const AUTO_RECREATED_WORKFLOWS = new Set(['holiday_social_approval', 'event_social_post']);

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let found = false;
    let deleted: any = null;
    await mutateCollection('tasks', (current) => {
      const filtered = current.filter((t: any) => t.id !== id);
      found = filtered.length < current.length;
      if (found) deleted = current.find((t: any) => t.id === id);
      return filtered;
    });
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (deleted?.attachments?.length) {
      await deleteStoredFilesForRecord('tasks', id);
    }

    // Deleting a scheduler-generated task is a deliberate "no, don't ask about
    // this one" — without this, the next scheduler run sees the event still
    // there and no task for it, and recreates the exact task the user just
    // deleted (it comes back like a zombie). Flag the event so the scheduler
    // skips it going forward; a manual "Request Social Post" action elsewhere
    // in the app is unaffected since it doesn't consult this flag.
    if (deleted?.eventId && AUTO_RECREATED_WORKFLOWS.has(deleted.workflowType)) {
      await mutateCollection('events', (current) => {
        const idx = current.findIndex((e: any) => e.id === deleted.eventId);
        if (idx === -1) return current;
        const next = [...current];
        next[idx] = { ...next[idx], socialTaskDismissed: true };
        return next;
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
