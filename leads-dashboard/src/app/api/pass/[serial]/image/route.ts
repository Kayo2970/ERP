import { NextRequest, NextResponse } from 'next/server';
import { readCollection } from '@/lib/server-db';
import { EventPassItem } from '@/lib/local-data';
import { getPassTheme } from '@/lib/pass-theme';
import { renderBoardingPassPng } from '@/lib/pass-image';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Public boarding-pass image for a pass (inline in emails / shareable). Like /pass/[serial] itself it
 * is addressed by the unguessable serial. Cancelled passes render a 404 so a revoked pass stops working.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ serial: string }> }) {
  try {
    const { serial } = await params;
    const passes = await readCollection<EventPassItem>('event_passes');
    const pass = passes.find((p) => p.serialNumber.toLowerCase() === serial.toLowerCase());
    if (!pass || pass.status === 'Cancelled') {
      return NextResponse.json({ error: 'Pass not found' }, { status: 404 });
    }
    const origin = request.nextUrl.origin;
    const png = await renderBoardingPassPng(pass, `${origin}/pass/${pass.serialNumber}`, await getPassTheme(pass.eventId));
    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300',
        'Content-Disposition': `inline; filename="${pass.serialNumber}.png"`,
      },
    });
  } catch (err) {
    console.error('[pass-image] render failed:', err);
    return NextResponse.json({ error: 'Failed to render pass image' }, { status: 500 });
  }
}
