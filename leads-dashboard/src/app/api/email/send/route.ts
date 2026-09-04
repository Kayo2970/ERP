import { NextResponse } from 'next/server';
import { dispatchEmail } from '@/lib/email-service';
import { readCollection } from '@/lib/server-db';
import { Member } from '@/lib/local-data';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/api-error';

// This route is used by real app features beyond the admin Email Management
// panel (e.g. member-termination notices from Directory, guest-invite
// mail-merge sends), so it is gated with requireSession only — any signed-in
// member may dispatch mail through it. The specific workflows that call it
// each already enforce their own permission check before reaching here
// (e.g. canTerminateMember, canManageGuestInvites); the admin Email
// Management page itself is a normal authenticated feature too.
export async function POST(request: Request) {
  try {
    await requireSession(request);
    const body = await request.json();
    const { scope, recipientEmail, subject, bodyText, bodyHtml, category, badgeText, badgeColor } = body;

    if (!subject || !bodyText) {
      return NextResponse.json({ error: 'Subject and email content are required' }, { status: 400 });
    }

    // 1. Single recipient dispatch
    if (scope === 'SINGLE') {
      if (!recipientEmail) {
        return NextResponse.json({ error: 'Recipient email address is required' }, { status: 400 });
      }
      const log = await dispatchEmail({
        to: recipientEmail,
        subject,
        bodyText,
        bodyHtml,
        badgeText,
        badgeColor,
        category: category || 'DIRECT_MESSAGE',
      });
      return NextResponse.json({ count: 1, dispatched: [log] });
    }

    // 2. Scope broadcast dispatch
    const members = await readCollection<Member>('members');
    let targetMembers = members || [];

    if (scope !== 'ALL' && scope !== 'All Members') {
      targetMembers = targetMembers.filter(m => m.division === scope || m.role === scope);
    }

    const recipientEmails = Array.from(new Set(targetMembers.map(m => m.email).filter(Boolean)));
    if (recipientEmails.length === 0) {
      return NextResponse.json({ error: 'No members found matching the selected target scope' }, { status: 404 });
    }

    const dispatchedLogs = [];
    for (const email of recipientEmails) {
      const log = await dispatchEmail({
        to: email,
        subject,
        bodyText,
        bodyHtml,
        badgeText,
        badgeColor,
        category: category || 'ANNOUNCEMENT',
      });
      dispatchedLogs.push(log);
    }

    return NextResponse.json({ count: dispatchedLogs.length, dispatched: dispatchedLogs });
  } catch (err: any) {
    return apiError(err, 'email-send-api-post', 500);
  }
}
