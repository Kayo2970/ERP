import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { dispatchEmail, generateAnnouncementEmailTemplate } from '@/lib/email-service';
import { resolveAnnouncementRecipients } from '@/lib/announcement-scope';
import type { Member, EventItem } from '@/lib/local-data';

export async function GET() {
  const items = await readCollection('announcements');
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  try {
    const item = await request.json();
    const updated = await mutateCollection('announcements', (current) => [item, ...current]);
    const created = updated.find((a: any) => a.id === item.id);

    // Automated Email Dispatch for Announcement — scoped to the actual targeted audience
    if (created) {
      try {
        const [members, events] = await Promise.all([
          readCollection<Member>('members'),
          readCollection<EventItem>('events'),
        ]);
        const authorName = created.authorName || 'LEADS Admin';
        const recipients = resolveAnnouncementRecipients(created.scope, members, events)
          .filter(m => !!m.email);

        await Promise.all(recipients.map(member => {
          const template = generateAnnouncementEmailTemplate(
            member.name,
            created.title,
            created.content,
            authorName
          );
          return dispatchEmail({
            to: member.email,
            subject: template.subject,
            bodyText: template.bodyText,
            bodyHtml: template.bodyHtml,
            category: 'ANNOUNCEMENT',
          });
        }));
      } catch (emailErr) {
        console.error('[announcements-api] Email dispatch failed:', emailErr);
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
