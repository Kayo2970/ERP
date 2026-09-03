import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { enqueueTaskEmailNotification, resolveTaskEmailRecipients } from '@/lib/task-email-queue';
import { fanOutAutoApproval } from '@/lib/approval-sync';

const PENDING_APPROVAL_MESSAGE: Record<string, string> = {
  pending_create: 'This task needs sign-off from the Centre Head, Advisor, or GG Campus Events Head before it is allotted.',
  pending_edit: 'An edit to this task needs sign-off from the Centre Head, Advisor, or GG Campus Events Head.',
};

export async function GET() {
  const items = await readCollection('tasks');
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  try {
    const item = await request.json();
    const updated = await mutateCollection('tasks', (current) => {
      const idx = current.findIndex((t: any) => t.id === item.id);
      if (idx >= 0) {
        const copy = [...current];
        copy[idx] = item;
        return copy;
      }
      return [item, ...current];
    });
    const created = updated.find((t: any) => t.id === item.id);

    // Route the built-in Group Policy approval gate on this task (see
    // getTaskApprovalRequirement in permissions.ts) into the Approvals
    // module, mirroring the same treatment given to Events.
    if (
      created &&
      (created.approverType === 'CENTER_HEAD' || !created.approverType) &&
      (created.approvalStatus === 'pending_create' || created.approvalStatus === 'pending_edit')
    ) {
      try {
        await fanOutAutoApproval({
          entityType: 'task',
          entityId: created.id,
          entityTitle: created.title,
          eventId: created.eventId,
          requesterId: created.submittedBy || '',
          requesterName: created.submittedBy || 'A member',
          requesterEmail: created.submittedByEmail,
          message: PENDING_APPROVAL_MESSAGE[created.approvalStatus],
        });
      } catch (approvalErr) {
        console.error('[tasks-api] Approval fan-out failed:', approvalErr);
      }
    }

    // Queue task email notification(s) with 10-minute quiet buffer — resolved
    // per assigneeType so committee/group tasks reach every member on them,
    // not just a single-assignee 'individual' task.
    if (created) {
      try {
        const members = await readCollection('members');
        const events = await readCollection('events');
        const recipients = resolveTaskEmailRecipients(created, members as any, events as any);

        for (const recipient of recipients) {
          await enqueueTaskEmailNotification({
            id: created.id,
            title: created.title,
            event: created.event || created.eventName,
            dueDate: created.dueDate,
            creatorName: created.creatorName || created.assignerName,
            assigneeEmail: recipient.email,
            assigneeName: recipient.name,
          });
        }
      } catch (emailErr) {
        console.error('[tasks-api] Failed to enqueue task notification:', emailErr);
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
