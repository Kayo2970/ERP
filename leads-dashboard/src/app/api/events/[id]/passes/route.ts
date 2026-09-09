import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/api-error';
import { EventPassItem } from '@/lib/local-data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(request);
    const { id } = await params;
    const passes = await readCollection<EventPassItem>('event_passes');
    if (id && id !== 'all') {
      return NextResponse.json(passes.filter((p) => p.eventId === id));
    }
    return NextResponse.json(passes);
  } catch (err: any) {
    return apiError(err, 'event-passes-get', 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireSession(request);
    const { id: eventId } = await params;
    const item: EventPassItem = await request.json();

    if (!item.attendeeName || !item.passType) {
      return NextResponse.json({ error: 'Attendee name and pass type are required' }, { status: 400 });
    }

    const updated = await mutateCollection<EventPassItem>('event_passes', (current = []) => {
      const idx = current.findIndex((p) => p.id === item.id || p.serialNumber === item.serialNumber);
      if (idx >= 0) {
        const copy = [...current];
        copy[idx] = item;
        return copy;
      }
      return [item, ...current];
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err: any) {
    return apiError(err, 'event-passes-post', 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireSession(request);
    const { passId, status, checkedInBy, checkedInAt } = await request.json();

    if (!passId || !status) {
      return NextResponse.json({ error: 'passId and status are required' }, { status: 400 });
    }

    let updatedPass: EventPassItem | null = null;
    await mutateCollection<EventPassItem>('event_passes', (current = []) => {
      const idx = current.findIndex((p) => p.id === passId || p.serialNumber === passId);
      if (idx === -1) return current;
      const copy = [...current];
      copy[idx] = {
        ...copy[idx],
        status,
        ...(status === 'Checked In'
          ? {
              checkedInAt: checkedInAt || new Date().toISOString(),
              checkedInBy: checkedInBy || sessionUser.name,
            }
          : {}),
      };
      updatedPass = copy[idx];
      return copy;
    });

    if (!updatedPass) {
      return NextResponse.json({ error: 'Pass not found' }, { status: 404 });
    }

    return NextResponse.json(updatedPass);
  } catch (err: any) {
    return apiError(err, 'event-passes-patch', 500);
  }
}

/** Verify QR Token / Serial lookup */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(request);
    const { query } = await request.json(); // query can be raw QR payload string or serialNumber
    if (!query) {
      return NextResponse.json({ error: 'Verification query is required' }, { status: 400 });
    }

    let parsedPayload: any = null;
    try {
      parsedPayload = JSON.parse(query);
    } catch {
      // not json, treat as plain serial string
    }

    const targetSerial = parsedPayload?.serial || query.trim();
    const targetPassId = parsedPayload?.passId;

    const passes = await readCollection<EventPassItem>('event_passes');
    const matched = passes.find(
      (p) =>
        (targetPassId && p.id === targetPassId) ||
        p.serialNumber.toLowerCase() === targetSerial.toLowerCase() ||
        (parsedPayload?.attendee &&
          p.attendeeName.toLowerCase() === parsedPayload.attendee.toLowerCase() &&
          p.eventId === parsedPayload.eventId)
    );

    if (!matched) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'Pass not found or invalid QR signature.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      pass: matched,
      status: matched.status,
      isAlreadyCheckedIn: matched.status === 'Checked In',
    });
  } catch (err: any) {
    return apiError(err, 'event-passes-verify', 500);
  }
}
