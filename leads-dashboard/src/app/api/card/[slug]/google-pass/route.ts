import { NextResponse } from 'next/server';
import { readCollection } from '@/lib/server-db';
import { getGoogleWalletCredentials } from '@/lib/wallet/google-config';
import { buildGoogleWalletSaveUrl } from '@/lib/wallet/google-pass';
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

  const creds = await getGoogleWalletCredentials();
  if (!creds) {
    return NextResponse.json({ error: 'Google Wallet is not configured on this server yet.' }, { status: 501 });
  }

  const cardUrl = `${getAppBaseUrl(request)}/card/${slug}`;
  const saveUrl = buildGoogleWalletSaveUrl(
    creds,
    {
      cardSlug: member.cardSlug,
      name: member.name,
      designation: member.cardDesignation || member.role,
      phone: member.cardPhone,
      email: member.email,
      bio: member.cardBio,
      socials: member.cardSocials,
    },
    cardUrl
  );

  return NextResponse.json({ saveUrl });
}
