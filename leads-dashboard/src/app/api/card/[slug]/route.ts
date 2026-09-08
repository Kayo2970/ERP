import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { isWalletWalletConfigured } from '@/lib/wallet/walletwallet-config';
import { effectiveCardDesignation } from '@/lib/member-guard';

// Public, no-auth endpoint — same pattern as /api/forms/[slug]: anyone with
// the link can view a published card. Only ever returns the safe public
// subset of a Member record (never email, id, tier, bank details, etc.).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const members = await readCollection<any>('members');
  const member = members.find((m) => m.cardSlug === slug);

  if (!member || !member.cardEnabled || member.status === 'Terminated') {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  // Fire-and-forget view counter — never block the response on it.
  mutateCollection('members', (current: any[]) => {
    const idx = current.findIndex((m) => m.id === member.id);
    if (idx === -1) return current;
    const next = [...current];
    next[idx] = { ...next[idx], cardViews: (next[idx].cardViews || 0) + 1 };
    return next;
  }).catch(() => {});

  // One WalletWallet API key issues both Apple and Google passes together
  // (see src/lib/wallet/walletwallet-client.ts), so a single check gates both.
  const walletWalletAvailable = await isWalletWalletConfigured();

  return NextResponse.json({
    slug: member.cardSlug,
    name: member.name,
    designation: effectiveCardDesignation(member),
    phone: member.cardPhone || '',
    email: member.email,
    socials: member.cardSocials || {},
    photoUrl: member.cardPhotoUrl || member.avatarUrl || '',
    appleWalletAvailable: walletWalletAvailable,
    googleWalletAvailable: walletWalletAvailable,
  });
}
