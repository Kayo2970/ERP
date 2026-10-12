import { NextResponse } from 'next/server';
import { readCollection } from '@/lib/server-db';
import { EmailLog, sweepExpiredBufferedEmails } from '@/lib/email-service';
import { requireSession } from '@/lib/session';
import { getAccessLevelSettingsServer, canManageEmailSettings } from '@/lib/permissions-server';
import { apiError } from '@/lib/api-error';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

// Paginated: returns one page of logs (newest first) with the filters applied
// server-side, so the browser never has to download or render the full history.
// Query: ?limit=50&offset=0&status=ALL|SENT|FAILED|BUFFERED|CANCELLED&category=ALL|<cat>&q=<text>
export async function GET(request: Request) {
  try {
    const actor = await requireSession(request);
    const settings = await getAccessLevelSettingsServer();
    if (!canManageEmailSettings(actor, settings)) {
      return NextResponse.json({ error: 'You do not have permission to view email logs.' }, { status: 403 });
    }
    await sweepExpiredBufferedEmails().catch(() => {});

    const params = new URL(request.url).searchParams;
    const limit = Math.min(Math.max(parseInt(params.get('limit') || '', 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const offset = Math.max(parseInt(params.get('offset') || '', 10) || 0, 0);
    const status = params.get('status') || 'ALL';
    const category = params.get('category') || 'ALL';
    const q = (params.get('q') || '').trim().toLowerCase();

    const all = (await readCollection<EmailLog>('emails')) || [];
    const sorted = [...all].sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || ''));

    const counts = { total: all.length, sent: 0, buffered: 0, failed: 0 };
    for (const l of all) {
      if (l.status === 'SENT') counts.sent++;
      else if (l.status === 'BUFFERED') counts.buffered++;
      else if (l.status === 'FAILED') counts.failed++;
    }

    const matched = sorted.filter(l => {
      if (status !== 'ALL' && l.status !== status) return false;
      if (category !== 'ALL' && l.category !== category) return false;
      return !q
        || (l.to || '').toLowerCase().includes(q)
        || (l.subject || '').toLowerCase().includes(q)
        || (l.category || '').toLowerCase().includes(q);
    });

    // bodyHtml is the heaviest field and the list/inspect UI only uses bodyText.
    const logs = matched.slice(offset, offset + limit).map(({ bodyHtml: _bodyHtml, ...rest }) => rest);

    return NextResponse.json({
      logs,
      total: matched.length,
      hasMore: offset + logs.length < matched.length,
      counts,
    });
  } catch (err: any) {
    return apiError(err, 'email-logs-api-get', 500);
  }
}
