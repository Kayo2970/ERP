import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { dispatchEmail, generateTaskEmailTemplate } from '@/lib/email-service';

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

    // Automated Email Dispatch for Task Assignment
    if (created) {
      try {
        const members = await readCollection('members');
        let recipientEmails: { email: string; name: string }[] = [];

        if (created.assigneeEmail) {
          const match = members.find((m: any) => m.email.toLowerCase() === created.assigneeEmail.toLowerCase());
          recipientEmails.push({
            email: created.assigneeEmail,
            name: match ? match.name : created.assignee || 'Member',
          });
        } else if (created.assigneeId) {
          const match = members.find((m: any) => m.id === created.assigneeId);
          if (match) {
            recipientEmails.push({ email: match.email, name: match.name });
          }
        } else if (created.assignee) {
          const match = members.find((m: any) => m.name.toLowerCase() === created.assignee.toLowerCase());
          if (match) {
            recipientEmails.push({ email: match.email, name: match.name });
          }
        }

        for (const recipient of recipientEmails) {
          if (recipient.email) {
            const template = generateTaskEmailTemplate(
              recipient.name,
              created.title,
              created.event || created.eventName || 'LEADS Operations',
              created.dueDate,
              created.creatorName || 'Committee Lead'
            );
            await dispatchEmail({
              to: recipient.email,
              subject: template.subject,
              bodyText: template.bodyText,
              bodyHtml: template.bodyHtml,
              category: 'TASK_ASSIGNMENT',
            });
          }
        }
      } catch (emailErr) {
        console.error('[tasks-api] Email dispatch failed:', emailErr);
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
