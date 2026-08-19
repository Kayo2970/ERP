import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { dispatchEmail, generateAnnouncementEmailTemplate } from '@/lib/email-service';

export async function GET() {
  const items = await readCollection('announcements');
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  try {
    const item = await request.json();
    const updated = await mutateCollection('announcements', (current) => [item, ...current]);
    const created = updated.find((a: any) => a.id === item.id);

    // Automated Email Dispatch for Announcement
    if (created) {
      try {
        const members = await readCollection('members');
        const authorName = created.author || 'LEADS Admin';

        // Dispatch email to all registered members
        for (const member of members) {
          if (member.email) {
            const template = generateAnnouncementEmailTemplate(
              member.name,
              created.title,
              created.content,
              authorName
            );
            await dispatchEmail({
              to: member.email,
              subject: template.subject,
              bodyText: template.bodyText,
              bodyHtml: template.bodyHtml,
              category: 'ANNOUNCEMENT',
            });
          }
        }
      } catch (emailErr) {
        console.error('[announcements-api] Email dispatch failed:', emailErr);
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
