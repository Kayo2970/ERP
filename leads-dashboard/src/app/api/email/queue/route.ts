import { NextResponse } from 'next/server';
import {
  getPendingTaskQueues,
  flushTaskEmailDigest,
  cancelTaskEmailQueue,
  cancelAllTaskEmailQueues
} from '@/lib/task-email-queue';
import { requireSession, sessionErrorStatus } from '@/lib/session';
import { getAccessLevelSettingsServer, canManageEmailSettings } from '@/lib/permissions-server';

export async function GET(request: Request) {
  try {
    const actor = await requireSession(request);
    const settings = await getAccessLevelSettingsServer();
    if (!canManageEmailSettings(actor, settings)) {
      return NextResponse.json({ error: 'You do not have permission to view the email queue.' }, { status: 403 });
    }
    const queues = getPendingTaskQueues();
    return NextResponse.json({ count: queues.length, queues });
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    if (status) return NextResponse.json({ error: err.message }, { status });
    return NextResponse.json({ error: err?.message || 'Failed to fetch pending queues' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSession(request);
    const settings = await getAccessLevelSettingsServer();
    if (!canManageEmailSettings(actor, settings)) {
      return NextResponse.json({ error: 'You do not have permission to manage the email queue.' }, { status: 403 });
    }
    const body = await request.json();
    const { email } = body;
    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }
    await flushTaskEmailDigest(email);
    return NextResponse.json({ success: true, message: `Successfully flushed task queue for ${email}` });
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    if (status) return NextResponse.json({ error: err.message }, { status });
    return NextResponse.json({ error: err?.message || 'Failed to flush queue' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requireSession(request);
    const settings = await getAccessLevelSettingsServer();
    if (!canManageEmailSettings(actor, settings)) {
      return NextResponse.json({ error: 'You do not have permission to manage the email queue.' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const all = searchParams.get('all');

    if (all === 'true') {
      const count = cancelAllTaskEmailQueues();
      return NextResponse.json({ success: true, count, message: `Cancelled all ${count} queued email buffers` });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email parameter or all=true is required' }, { status: 400 });
    }

    const cancelled = cancelTaskEmailQueue(email);
    if (cancelled) {
      return NextResponse.json({ success: true, message: `Cancelled queued email buffer for ${email}` });
    } else {
      return NextResponse.json({ error: `No active queue found for ${email}` }, { status: 404 });
    }
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    if (status) return NextResponse.json({ error: err.message }, { status });
    return NextResponse.json({ error: err?.message || 'Failed to cancel queue' }, { status: 500 });
  }
}
