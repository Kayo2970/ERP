import { NextRequest, NextResponse } from 'next/server';
import { getWalletWalletApiKey } from '@/lib/wallet/walletwallet-config';
import { createEventWalletPass } from '@/lib/wallet/walletwallet-client';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { EventPassItem } from '@/lib/local-data';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; passId: string }> }
) {
  try {
    const { id: eventId, passId } = await params;
    const passes = await readCollection<EventPassItem>('event_passes');
    const pass = passes.find((p) => p.id === passId || p.serialNumber === passId);

    if (!pass) {
      return NextResponse.json({ error: 'Pass not found' }, { status: 404 });
    }

    const apiKey = await getWalletWalletApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'WalletWallet API key not configured on this server.' },
        { status: 503 }
      );
    }

    const origin = request.headers.get('origin') || 'https://leadsnextgencentre.online';
    const passUrl = `${origin}/dashboard/events?pass=${pass.serialNumber}`;

    const walletPass = await createEventWalletPass(
      apiKey,
      {
        serialNumber: pass.serialNumber,
        eventName: pass.eventName,
        eventDate: pass.eventDate,
        eventVenue: pass.eventVenue,
        attendeeName: pass.attendeeName,
        guestCategory: pass.guestCategory,
        roomOrVenue: pass.roomOrVenue,
        passType: pass.passType,
        validityDate: pass.validityDate,
        passColor: pass.passColor,
      },
      passUrl
    );

    return NextResponse.json(walletPass);
  } catch (error: any) {
    console.error('Error generating event wallet pass:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate wallet pass.' },
      { status: 500 }
    );
  }
}
