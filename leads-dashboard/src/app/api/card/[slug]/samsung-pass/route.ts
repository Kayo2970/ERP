import { NextResponse } from 'next/server';
import { isSamsungWalletConfigured } from '@/lib/wallet/samsung-config';

// Placeholder — see src/lib/wallet/samsung-config.ts for why this always
// 501s today. Structured identically to the Apple/Google routes so a real
// Samsung Partner Portal integration is a drop-in once access is granted.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const configured = await isSamsungWalletConfigured();
  if (!configured) {
    return NextResponse.json(
      { error: 'Samsung Wallet is not available yet — this deployment has no Samsung Partner Portal credentials. Use Save Contact or the QR code instead.' },
      { status: 501 }
    );
  }
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
