import { NextResponse } from 'next/server';
import { getEmailSettings, updateEmailSettings } from '@/lib/email-service';
import { requireSession, sessionErrorStatus } from '@/lib/session';
import { getAccessLevelSettingsServer, canManageEmailSettings } from '@/lib/permissions-server';

export async function GET(request: Request) {
  try {
    const actor = await requireSession(request);
    const settings = await getAccessLevelSettingsServer();
    if (!canManageEmailSettings(actor, settings)) {
      return NextResponse.json({ error: 'You do not have permission to view email settings.' }, { status: 403 });
    }
    const emailSettings = await getEmailSettings();
    return NextResponse.json(emailSettings);
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    if (status) return NextResponse.json({ error: err.message }, { status });
    return NextResponse.json({ error: err?.message || 'Failed to fetch email settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSession(request);
    const settings = await getAccessLevelSettingsServer();
    if (!canManageEmailSettings(actor, settings)) {
      return NextResponse.json({ error: 'You do not have permission to update email settings.' }, { status: 403 });
    }
    const body = await request.json();
    const { settings: newSettings, actorName } = body;

    if (!newSettings) {
      return NextResponse.json({ error: 'Settings payload is required' }, { status: 400 });
    }

    const updated = await updateEmailSettings(newSettings, actorName || 'Super User');
    return NextResponse.json(updated);
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    if (status) return NextResponse.json({ error: err.message }, { status });
    return NextResponse.json({ error: err?.message || 'Failed to update email settings' }, { status: 500 });
  }
}
