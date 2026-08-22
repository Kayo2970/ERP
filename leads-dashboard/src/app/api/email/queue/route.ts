import { NextResponse } from 'next/server';
import { getPendingTaskQueues, flushTaskEmailDigest } from '@/lib/task-email-queue';

export async function GET() {
  try {
    const queues = getPendingTaskQueues();
    return NextResponse.json({ count: queues.length, queues });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch pending queues' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;
    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }
    await flushTaskEmailDigest(email);
    return NextResponse.json({ success: true, message: `Successfully flushed task queue for ${email}` });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to flush queue' }, { status: 500 });
  }
}
