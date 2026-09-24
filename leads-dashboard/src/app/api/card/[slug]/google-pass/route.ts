import { NextResponse } from 'next/server';
import { readCollection } from '@/lib/server-db';
import { getWalletWalletApiKey } from '@/lib/wallet/walletwallet-config';
import { getOrCreateWalletPass, getCachedWalletPass, WalletPassRateLimitError } from '@/lib/wallet/card-wallet-pass';
import { getAppBaseUrl } from '@/lib/app-url';
import { getSessionMember } from '@/lib/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug || '').trim().toLowerCase();
  const members = await readCollection<any>('members');
  const actor = await getSessionMember(request);

  let member = members.find((m) => m.cardSlug && m.cardSlug.toLowerCase() === cleanSlug);
  if (!member && cleanSlug === 'preview' && actor) {
    member = actor;
  }

  const isOwnerOrAdmin = actor && member && (actor.id === member.id || actor.role === 'SUPER_USER' || actor.tier === 1);

  if (!member || member.status === 'Terminated' || (!member.cardEnabled && !isOwnerOrAdmin)) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  const apiKey = await getWalletWalletApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: 'Google Wallet is not configured on this server yet.' }, { status: 501 });
  }

  // The Visiting Card page's own Live Preview asks for this — reads
  // whatever's already cached on disk and never calls WalletWallet's API
  // itself. See docs/wallet-setup.md.
  const cacheOnly = new URL(request.url).searchParams.get('cacheOnly') === '1';
  if (cacheOnly) {
    const cached = getCachedWalletPass(member);
    if (!cached) {
      return NextResponse.json({ error: 'Pass not generated yet — save & publish your card to generate it.' }, { status: 404 });
    }
    return NextResponse.json({ saveUrl: cached.googleSaveUrl });
  }

  const cardUrl = `${getAppBaseUrl(request)}/card/${member.cardSlug || cleanSlug}`;
  try {
    const { googleSaveUrl } = await getOrCreateWalletPass(apiKey, member, cardUrl);
    return NextResponse.json({ saveUrl: googleSaveUrl });
  } catch (err: any) {
    if (err instanceof WalletPassRateLimitError) {
      return NextResponse.json({ error: err.message, retryAt: err.retryAt }, { status: 429 });
    }
    console.error('Google Wallet pass fetch error:', err);
    return NextResponse.json({ error: err?.message || 'Could not fetch the Google Wallet pass.' }, { status: 500 });
  }
}
