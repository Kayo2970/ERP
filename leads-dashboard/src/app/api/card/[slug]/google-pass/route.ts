import { NextResponse } from 'next/server';
import { readCollection } from '@/lib/server-db';
import { getWalletWalletApiKey } from '@/lib/wallet/walletwallet-config';
import { getOrCreateWalletPass } from '@/lib/wallet/card-wallet-pass';
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
    return NextResponse.json({ error: 'Google Wallet is not configured on this server yet.' }, { status: 501 });
  }

  const cardUrl = `${getAppBaseUrl(request)}/card/${slug}`;
  const { googleSaveUrl } = await getOrCreateWalletPass(apiKey, member, cardUrl);

  return NextResponse.json({ saveUrl: googleSaveUrl });
}
