import { NextResponse } from 'next/server';
import { readCollection } from '@/lib/server-db';
import { requireSession } from '@/lib/session';
import { isSuperUser } from '@/lib/permissions-server';
import { getWalletWalletApiKey } from '@/lib/wallet/walletwallet-config';
import { getOrCreateWalletPass, WalletPassRateLimitError } from '@/lib/wallet/card-wallet-pass';
import { getAppBaseUrl } from '@/lib/app-url';
import { apiError } from '@/lib/api-error';

/**
 * Pre-warms the wallet pass cache the moment a member saves their card,
 * rather than waiting for the first "Add to Wallet" tap — so by the time
 * anyone views the published card, the .pkpass is already sitting on disk
 * and apple-pass/google-pass just replay it back, no live API call.
 * Self-service only (the card owner, or a Super User) since it's what
 * spends the member's rate-limited generation quota.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const actor = await requireSession(request);
    const { slug } = await params;
    const members = await readCollection<any>('members');
    const member = members.find((m) => m.cardSlug === slug);

    if (!member || !member.cardEnabled || member.status === 'Terminated') {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }
    if (actor.id !== member.id && !isSuperUser(actor)) {
      return NextResponse.json({ error: "You can only generate your own visiting card's wallet pass." }, { status: 403 });
    }

    const apiKey = await getWalletWalletApiKey();
    if (!apiKey) {
      // Not an error — wallet passes just aren't set up yet. The card
      // itself still saved fine.
      return NextResponse.json({ generated: false });
    }

    const cardUrl = `${getAppBaseUrl(request)}/card/${slug}`;
    await getOrCreateWalletPass(apiKey, member, cardUrl);
    return NextResponse.json({ generated: true });
  } catch (err) {
    if (err instanceof WalletPassRateLimitError) {
      return NextResponse.json({ error: err.message, retryAt: err.retryAt }, { status: 429 });
    }
    return apiError(err, 'card-wallet-pass-generate-post');
  }
}
