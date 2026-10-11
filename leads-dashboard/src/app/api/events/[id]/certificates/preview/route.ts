import { NextResponse } from 'next/server';
import { readCollection } from '@/lib/server-db';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/api-error';
import { gateEventPassAction } from '@/lib/approval-gate';
import { getAppBaseUrl } from '@/lib/app-url';
import { EventItem, EventPassItem } from '@/lib/local-data';
import { renderPassPreview, pngToPdf } from '@/lib/certificate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** ?passId=…[&format=pdf] — the certificate exactly as that attendee will get it (PNG data URL as JSON, or the PDF itself). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession(request);
    const gate = await gateEventPassAction(user, 'dispatch');
    if (!gate.allowed || gate.requiresApproval) return NextResponse.json({ error: "You don't have permission to preview certificates." }, { status: 403 });
    const { id } = await params;
    const url = new URL(request.url);
    const passId = url.searchParams.get('passId') || '';
    const event = (await readCollection<EventItem>('events')).find((e) => e.id === id);
    const pass = (await readCollection<EventPassItem>('event_passes')).find((p) => p.id === passId && p.eventId === id);
    if (!event || !pass) return NextResponse.json({ error: 'Attendee not found.' }, { status: 404 });
    const png = await renderPassPreview(pass, event, getAppBaseUrl(request));
    if (url.searchParams.get('format') === 'pdf') {
      return new NextResponse(new Uint8Array(pngToPdf(png)), {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="Certificate-${pass.attendeeName.replace(/[^\w]+/g, '_')}.pdf"` },
      });
    }
    return NextResponse.json({ preview: `data:image/png;base64,${png.toString('base64')}` });
  } catch (err) {
    return apiError(err, 'certificates:preview');
  }
}
