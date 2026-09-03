import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { enqueueTaskEmailNotification, resolveTaskEmailRecipients } from '@/lib/task-email-queue';

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
