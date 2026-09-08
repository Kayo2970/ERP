import { NextResponse } from 'next/server';
import { readCollection } from '@/lib/server-db';
import { readStoredFile } from '@/lib/file-storage';
import { getWalletWalletApiKey } from '@/lib/wallet/walletwallet-config';
import { getOrCreateWalletPass, WalletPassRateLimitError } from '@/lib/wallet/card-wallet-pass';
import { getAppBaseUrl } from '@/lib/app-url';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const members = await readCollection<any>('members');
  const member = members.find((m) => m.cardSlug === slug);

  if (!member || !member.cardEnabled || member.status === 'Terminated') {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  const apiKey = await getWalletWalletApiKey();
  if (!apiKey) {
    // 501 (Not Implemented), not 404 — the card is real, Apple Wallet just
    // isn't set up on this deployment yet. See docs/wallet-setup.md.
    return NextResponse.json({ error: 'Apple Wallet is not configured on this server yet.' }, { status: 501 });
  }

  const cardUrl = `${getAppBaseUrl(request)}/card/${slug}`;
  try {
    const { appleUrl } = await getOrCreateWalletPass(apiKey, member, cardUrl);
    const pkpass = await readStoredFile(appleUrl.replace('/api/files/', ''));

    return new NextResponse(new Uint8Array(pkpass), {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="${slug}.pkpass"`,
      },
    });
  } catch (err) {
    if (err instanceof WalletPassRateLimitError) {
      return NextResponse.json({ error: err.message, retryAt: err.retryAt }, { status: 429 });
    }
    throw err;
  }
}
