import { NextRequest, NextResponse } from 'next/server';
import { getWalletWalletApiKey } from '@/lib/wallet/walletwallet-config';
import { createEventWalletPass } from '@/lib/wallet/walletwallet-client';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { saveBase64File } from '@/lib/file-storage';
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

    // 1. VPS Server Cache Check — if already generated and saved for this pass on disk, return cached URLs instantly
    if ((pass as any).walletAppleUrl && (pass as any).walletGoogleSaveUrl) {
      return NextResponse.json({
        appleUrl: (pass as any).walletAppleUrl,
        googleSaveUrl: (pass as any).walletGoogleSaveUrl,
        cached: true,
      });
    }

    const apiKey = await getWalletWalletApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Wallet passes are temporarily unavailable (API key not configured).' },
        { status: 503 }
      );
    }

    const origin = request.headers.get('origin') || 'https://leadsnextgencentre.online';
    const passUrl = `${origin}/pass/${pass.serialNumber}`;

    // 2. Generate via WalletWallet API
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

    // 3. Save .pkpass file onto VPS server disk
    let appleUrl = '';
    if (walletPass.applePass) {
      const dataUrl = `data:application/vnd.apple.pkpass;base64,${walletPass.applePass}`;
      const stored = await saveBase64File('event-passes', pass.id, 0, `${pass.serialNumber}.pkpass`, dataUrl);
      appleUrl = stored.url;
    }

    const googleSaveUrl = walletPass.googleSaveUrl || '';

    // 4. Save to VPS server database collection so future requests take 0 API calls
    await mutateCollection<EventPassItem>('event_passes', (current = []) => {
      const idx = current.findIndex((p) => p.id === pass.id || p.serialNumber === pass.serialNumber);
      if (idx === -1) return current;
      const copy = [...current];
      copy[idx] = {
        ...copy[idx],
        walletAppleUrl: appleUrl,
        walletGoogleSaveUrl: googleSaveUrl,
      } as any;
      return copy;
    });

    return NextResponse.json({
      appleUrl,
      googleSaveUrl,
      shareUrl: walletPass.shareUrl,
      cached: false,
    });
  } catch (error: any) {
    console.error('Error generating event wallet pass:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate wallet pass.' },
      { status: 500 }
    );
  }
}
