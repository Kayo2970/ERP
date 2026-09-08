import { NextResponse } from 'next/server';
import { readCollection } from '@/lib/server-db';
import { getAppleWalletCredentials } from '@/lib/wallet/apple-config';
import { generateApplePkpass } from '@/lib/wallet/apple-pkpass';
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

  const creds = await getAppleWalletCredentials();
  if (!creds) {
    // 501 (Not Implemented), not 404 — the card is real, Apple Wallet just
    // isn't set up on this deployment yet. See docs/wallet-setup.md.
    return NextResponse.json({ error: 'Apple Wallet is not configured on this server yet.' }, { status: 501 });
  }

  const cardUrl = `${getAppBaseUrl(request)}/card/${slug}`;
  const pkpass = await generateApplePkpass(
    {
      cardSlug: member.cardSlug,
      name: member.name,
      designation: member.cardDesignation || member.role,
      phone: member.cardPhone,
      email: member.email,
      bio: member.cardBio,
      socials: member.cardSocials,
    },
    creds,
    cardUrl
  );

  return new NextResponse(new Uint8Array(pkpass), {
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename="${slug}.pkpass"`,
    },
  });
}
