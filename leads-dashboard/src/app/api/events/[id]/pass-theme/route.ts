import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/api-error';
import { getPassTheme, updatePassTheme, walletDataForPass, PassThemeUpdate } from '@/lib/pass-theme';
import { readCollection } from '@/lib/server-db';
import { EventPassItem } from '@/lib/local-data';
import { getWalletWalletApiKey } from '@/lib/wallet/walletwallet-config';
import { updateEventWalletPass } from '@/lib/wallet/walletwallet-client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession(request);
    const { id } = await params;
    return NextResponse.json(await getPassTheme(id));
  } catch (err: any) {
    return apiError(err, 'pass-theme-get', 500);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession(request);
    const { id } = await params;
    if (!id || id === 'all' || /[\\/.]/.test(id)) {
      return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
    }
    const body = (await request.json()) as PassThemeUpdate;
    for (const f of [body.background, body.logo]) {
      if (f && (typeof f.dataUrl !== 'string' || !f.dataUrl.startsWith('data:image/'))) {
        return NextResponse.json({ error: 'Images must be sent as image data URLs.' }, { status: 400 });
      }
    }
    const theme = await updatePassTheme(id, body);

    // Push the new look to every pass already added to a wallet (best effort, never fails the save)
    let walletUpdated = 0;
    try {
      const apiKey = await getWalletWalletApiKey();
      if (apiKey) {
        const origin = request.headers.get('origin') || 'https://portal-leads.msruas.ac.in';
        const passes = (await readCollection<EventPassItem>('event_passes')).filter(
          (p) => p.eventId === id && p.walletSerialNumber && p.status !== 'Cancelled'
        );
        for (const pass of passes.slice(0, 300)) {
          try {
            await updateEventWalletPass(apiKey, await walletDataForPass(pass), `${origin}/pass/${pass.serialNumber}`);
            walletUpdated += 1;
          } catch (e: any) {
            console.warn('[pass-theme] wallet update failed for', pass.serialNumber, e?.message);
          }
        }
      }
    } catch (e: any) {
      console.warn('[pass-theme] wallet sync skipped:', e?.message);
    }
    return NextResponse.json({ ...theme, walletUpdated });
  } catch (err: any) {
    return apiError(err, 'pass-theme-put', 500);
  }
}
