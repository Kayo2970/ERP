import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/api-error';
import { EventPassItem } from '@/lib/local-data';
import { getWalletWalletApiKey } from '@/lib/wallet/walletwallet-config';
import { updateEventWalletPass } from '@/lib/wallet/walletwallet-client';

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
    const body = await request.json();
    const { passId, id, serialNumber, ...updates } = body;
    const targetId = passId || id || serialNumber;

    if (!targetId) {
      return NextResponse.json({ error: 'passId is required' }, { status: 400 });
    }

    let updatedPass: EventPassItem | null = null;
    await mutateCollection<EventPassItem>('event_passes', (current = []) => {
      const idx = current.findIndex((p) => p.id === targetId || p.serialNumber === targetId);
      if (idx === -1) return current;
      const copy = [...current];
      const existing = copy[idx];

      const newStatus = updates.status || existing.status;
      const now = new Date().toISOString();

      const merged: EventPassItem = {
        ...existing,
        ...updates,
        status: newStatus,
        ...(newStatus === 'Checked In' && existing.status !== 'Checked In'
          ? {
              checkedInAt: updates.checkedInAt || now,
              checkedInBy: updates.checkedInBy || sessionUser.name,
            }
          : {}),
      };

      // Re-generate QR verification payload if key attributes changed
      if (
        updates.attendeeName !== undefined ||
        updates.passType !== undefined ||
        updates.eventId !== undefined
      ) {
        merged.qrPayload = JSON.stringify({
          passId: merged.id,
          serial: merged.serialNumber,
          eventId: merged.eventId,
          attendee: merged.attendeeName,
          type: merged.passType,
          issuedAt: merged.issuedAt,
        });
      }

      copy[idx] = merged;
      updatedPass = merged;
      return copy;
    });

    if (!updatedPass) {
      return NextResponse.json({ error: 'Pass not found' }, { status: 404 });
    }

    // Check if Apple/Google Wallet API is configured and update wallet pass if present
    let walletUpdated = false;
    let walletNotice: string | undefined;

    try {
      const apiKey = await getWalletWalletApiKey();
      if (apiKey && updatedPass) {
        const origin = request.headers.get('origin') || 'https://leadsnextgencentre.online';
        const passUrl = `${origin}/pass/${(updatedPass as EventPassItem).serialNumber}`;

        await updateEventWalletPass(
          apiKey,
          {
            serialNumber: (updatedPass as EventPassItem).serialNumber,
            eventName: (updatedPass as EventPassItem).eventName,
            eventDate: (updatedPass as EventPassItem).eventDate,
            eventVenue: (updatedPass as EventPassItem).eventVenue,
            attendeeName: (updatedPass as EventPassItem).attendeeName,
            guestCategory: (updatedPass as EventPassItem).guestCategory,
            roomOrVenue: (updatedPass as EventPassItem).roomOrVenue,
            passType: (updatedPass as EventPassItem).passType,
            validityDate: (updatedPass as EventPassItem).validityDate,
            passColor: (updatedPass as EventPassItem).passColor,
          },
          passUrl
        );
        walletUpdated = true;
      }
    } catch (walletErr: any) {
      console.warn('[event-pass-patch] Wallet API update notice:', walletErr?.message);
      walletNotice = walletErr?.message;
    }

    return NextResponse.json({
      ...(updatedPass as any),
      walletUpdated,
      walletNotice,
    });
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
