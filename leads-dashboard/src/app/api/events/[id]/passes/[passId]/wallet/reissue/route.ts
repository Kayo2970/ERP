import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { getAppBaseUrl } from '@/lib/app-url';
import { readCollection } from '@/lib/server-db';
import { reissueWalletPass, WalletUnavailableError } from '@/lib/wallet/pass-cache';
import type { EventPassItem } from '@/lib/local-data';

export const dynamic = 'force-dynamic';

/** Designer action: build a brand-new wallet pass from the current design (the copy on a guest's phone is revoked). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; passId: string }> }) {
  try {
    await requireSession(request);
    const { passId } = await params;
    const pass = (await readCollection<EventPassItem>('event_passes')).find((p) => p.id === passId || p.serialNumber === passId);
    if (!pass) return NextResponse.json({ error: 'Pass not found' }, { status: 404 });
    const wallet = await reissueWalletPass(pass.id, getAppBaseUrl(request));
    return NextResponse.json({ ok: true, apple: Boolean(wallet.appleUrl), google: Boolean(wallet.googleSaveUrl) });
  } catch (err: any) {
    const status = err?.status === 401 ? 401 : err instanceof WalletUnavailableError ? 503 : 500;
    return NextResponse.json({ error: err?.message || 'Could not re-issue the wallet pass.' }, { status });
  }
}
