import { NextResponse } from 'next/server';
import { readCollection } from '@/lib/server-db';
import { EmailLog } from '@/lib/email-service';
import { requireSession, sessionErrorStatus } from '@/lib/session';
import { getAccessLevelSettingsServer, canManageEmailSettings } from '@/lib/permissions-server';

export async function GET(request: Request) {
  try {
    const actor = await requireSession(request);
    const settings = await getAccessLevelSettingsServer();
    if (!canManageEmailSettings(actor, settings)) {
      return NextResponse.json({ error: 'You do not have permission to view email logs.' }, { status: 403 });
    }
    const logs = await readCollection<EmailLog>('emails');
    return NextResponse.json(logs || []);
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    if (status) return NextResponse.json({ error: err.message }, { status });
    return NextResponse.json({ error: err?.message || 'Failed to fetch email logs' }, { status: 500 });
  }
}
