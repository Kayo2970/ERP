import { NextRequest, NextResponse } from 'next/server';
import { readCollection } from '@/lib/server-db';
import { EventPassItem } from '@/lib/local-data';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serial: string }> }
) {
  try {
    const { serial } = await params;
    if (!serial) {
      return NextResponse.json({ error: 'Serial is required' }, { status: 400 });
    }

    const passes = await readCollection<EventPassItem>('event_passes');
    const matched = passes.find(
      (p) =>
        p.serialNumber.toLowerCase() === serial.toLowerCase() ||
        p.id.toLowerCase() === serial.toLowerCase()
    );

    if (!matched) {
      return NextResponse.json({ error: 'Event pass not found' }, { status: 404 });
    }

    return NextResponse.json({
      pass: matched,
      status: matched.status,
      valid: matched.status !== 'Cancelled',
    });
  } catch (err: any) {
    console.error('Error fetching public pass:', err);
    return NextResponse.json({ error: 'Internal error loading pass' }, { status: 500 });
  }
}
