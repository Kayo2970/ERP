import { NextResponse } from 'next/server';
import { readCollection } from '@/lib/server-db';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/api-error';
import { gateEventPassAction } from '@/lib/approval-gate';
import { getAppBaseUrl } from '@/lib/app-url';
import { EventItem, EventPassItem } from '@/lib/local-data';
import { CertificateRecord, isCertificateEligible, isEventOver, sendCertificate } from '@/lib/certificate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function authorise(request: Request) {
  const user = await requireSession(request);
  const gate = await gateEventPassAction(user, 'dispatch');
  if (!gate.allowed) return { error: NextResponse.json({ error: "You don't have permission to send event certificates." }, { status: 403 }) };
  if (gate.requiresApproval) {
    return { error: NextResponse.json({ error: 'Sending certificates needs an approver for your role — ask a Head or the Centre leadership to send them.' }, { status: 403 }) };
  }
  return { user };
}

/** Attendees who qualify for a certificate, with whether theirs was already sent. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorise(request);
    if (auth.error) return auth.error;
    const { id } = await params;
    const event = (await readCollection<EventItem>('events')).find((e) => e.id === id);
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    const passes = (await readCollection<EventPassItem>('event_passes')).filter((p) => p.eventId === id);
    const records = (await readCollection<CertificateRecord>('certificates')).filter((c) => c.eventId === id);
    const attendees = passes.filter(isCertificateEligible).map((p) => {
      const rec = records.find((c) => c.passId === p.id);
      return { passId: p.id, name: p.attendeeName, email: p.attendeeEmail, serial: p.serialNumber, status: rec?.status || 'Not sent', sentAt: rec?.sentAt, error: rec?.error };
    });
    return NextResponse.json({ eventOver: isEventOver(event), eventName: event.title, attendees });
  } catch (err) {
    return apiError(err, 'certificates:list');
  }
}

/** Body: { passIds: string[], emails?: Record<passId, string> } — sends one PDF certificate per attendee. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorise(request);
    if (auth.error) return auth.error;
    const { id } = await params;
    const { passIds, emails } = (await request.json()) as { passIds?: string[]; emails?: Record<string, string> };
    if (!Array.isArray(passIds) || passIds.length === 0) return NextResponse.json({ error: 'Choose at least one attendee.' }, { status: 400 });
    if (passIds.length > 500) return NextResponse.json({ error: 'Send at most 500 certificates at a time.' }, { status: 400 });
    const event = (await readCollection<EventItem>('events')).find((e) => e.id === id);
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (!isEventOver(event)) return NextResponse.json({ error: 'Certificates can be sent once the event has ended.' }, { status: 400 });

    const passes = await readCollection<EventPassItem>('event_passes');
    const origin = getAppBaseUrl(request);
    const results: Array<{ passId: string; ok: boolean; error?: string }> = [];
    for (const passId of passIds) {
      const pass = passes.find((p) => p.id === passId && p.eventId === id);
      if (!pass || !isCertificateEligible(pass)) {
        results.push({ passId, ok: false, error: 'Not eligible (no check-in or no email).' });
        continue;
      }
      const to = emails?.[passId];
      const r = await sendCertificate(pass, event, origin, typeof to === 'string' && /^\S+@\S+\.\S+$/.test(to.trim()) ? to : undefined);
      results.push({ passId, ok: r.ok, error: r.error });
    }
    return NextResponse.json({ sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results });
  } catch (err) {
    return apiError(err, 'certificates:send');
  }
}
