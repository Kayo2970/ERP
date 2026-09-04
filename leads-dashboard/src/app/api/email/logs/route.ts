import { NextResponse } from 'next/server';
import { readCollection } from '@/lib/server-db';
import { EmailLog } from '@/lib/email-service';
import { requireSession } from '@/lib/session';
import { getAccessLevelSettingsServer, canManageEmailSettings } from '@/lib/permissions-server';
import { apiError } from '@/lib/api-error';

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
    return apiError(err, 'email-logs-api-get', 500);
  }
}
