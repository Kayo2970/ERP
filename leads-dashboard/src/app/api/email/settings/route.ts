import { NextResponse } from 'next/server';
import { getEmailSettings, updateEmailSettings } from '@/lib/email-service';
import { readCollection } from '@/lib/server-db';

export async function GET() {
  try {
    const settings = await getEmailSettings();
    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch email settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { settings, actorName, actorEmail } = body;

    if (!settings) {
      return NextResponse.json({ error: 'Settings payload is required' }, { status: 400 });
    }

    // Minimal server-side gate — this route previously trusted the client
    // entirely. There's no session/cookie layer in this app to check
    // against, so — consistent with every other admin action here (see
    // members/[id]'s DELETE route) — re-verify the acting member's stored
    // tier by looking them up fresh rather than trusting a client-sent role
    // string. Only Super User (tier 1) or Centre Head/Advisor (tier 1.5) may
    // change SMTP settings, matching permissions.ts's canManageEmailSettings.
    if (!actorEmail) {
      return NextResponse.json({ error: 'Missing actor identity' }, { status: 400 });
    }
    const members = await readCollection<any>('members');
    const actor = members.find((m: any) => m.email?.toLowerCase() === String(actorEmail).toLowerCase());
    const isAuthorized = !!actor && (actor.tier === 1 || actor.tier === 1.5);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Not authorized to modify email settings.' }, { status: 403 });
    }

    const updated = await updateEmailSettings(settings, actorName || 'Super User');
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update email settings' }, { status: 500 });
  }
}
