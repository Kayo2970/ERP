import { NextResponse } from 'next/server';
import { readCollection } from '@/lib/server-db';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/api-error';
import { gateCertificateAction } from '@/lib/approval-gate';
import { getAppBaseUrl } from '@/lib/app-url';
import { EventItem, EventPassItem } from '@/lib/local-data';
import { CertificateRecord, cleanTypeId, getCertificateStatuses, getCertificateTypes, isCertificateEligible, isEventOver, sendCertificatesBatch } from '@/lib/certificate';
import { cleanCertEmail } from '@/lib/certificate-layout';
import { CertificateSchedule } from '@/lib/certificate-scheduler';
import { mutateCollection } from '@/lib/server-db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function authorise(request: Request, action: 'send' | 'view' = 'send') {
  const user = await requireSession(request);
  const gate = await gateCertificateAction(user, action);
  if (!gate.allowed) return { error: NextResponse.json({ error: "You don't have permission to send event certificates." }, { status: 403 }) };
  if (gate.requiresApproval) {
    return { error: NextResponse.json({ error: 'Sending certificates needs an approver for your role — ask a Head or the Centre leadership to send them.' }, { status: 403 }) };
  }
  return { user };
}

/** Attendees who qualify for a certificate, with whether theirs was already sent. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Read-only list: also open to design-only holders so they can preview the design on real attendees.
    const auth = await authorise(request, 'view');
    if (auth.error) return auth.error;
    const { id } = await params;
    const event = (await readCollection<EventItem>('events')).find((e) => e.id === id);
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    const passes = (await readCollection<EventPassItem>('event_passes')).filter((p) => p.eventId === id);
    const typeId = cleanTypeId(new URL(request.url).searchParams.get('typeId'));
    const types = await getCertificateTypes(id);
    const statuses = await getCertificateStatuses(id, typeId);
    const manual = (await readCollection<CertificateRecord>('certificates')).filter((c) => c.eventId === id && c.manual && cleanTypeId(c.typeId) === typeId);
    const attendees = passes.filter(isCertificateEligible).map((p) => {
      const info = statuses[p.id];
      return { passId: p.id, name: p.attendeeName, email: p.attendeeEmail, serial: p.serialNumber, organisation: p.attendeeOrg || '', category: String(p.guestCategory || ''), status: info?.status || 'Not issued', code: info?.code, issuedAt: info?.issuedAt, sentAt: info?.sentAt, sentBy: info?.sentBy, error: info?.error };
    });
    for (const m of manual) {
      const info = statuses[m.passId];
      attendees.push({ passId: m.passId, name: m.attendeeName, email: m.attendeeEmail, serial: '', organisation: m.organisation || '', category: m.category || '', manual: true, status: info?.status || 'Issued', code: info?.code, issuedAt: info?.issuedAt, sentAt: info?.sentAt, sentBy: info?.sentBy, error: info?.error } as any);
    }
    const schedules = (await readCollection<CertificateSchedule>('certificateSchedules')).filter((x) => x.eventId === id && cleanTypeId(x.typeId) === typeId).sort((a, b) => b.sendAt.localeCompare(a.sendAt)).slice(0, 10);
    return NextResponse.json({ eventOver: isEventOver(event), eventName: event.title, attendees, schedules, types, typeId });
  } catch (err) {
    return apiError(err, 'certificates:list');
  }
}

/** Body: { passIds, emails?, sendAt?, message?: { subject, bodyText } } — sends one PDF certificate per attendee now, or (with a future `sendAt` ISO time) schedules the batch. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorise(request);
    if (auth.error) return auth.error;
    const { id } = await params;
    const body = (await request.json()) as { passIds?: string[]; emails?: Record<string, string>; sendAt?: string; message?: unknown; typeId?: string };
    const { passIds, emails, sendAt } = body;
    const typeId = cleanTypeId(body.typeId);
    const message = cleanCertEmail(body.message);
    if (!Array.isArray(passIds) || passIds.length === 0) return NextResponse.json({ error: 'Choose at least one attendee.' }, { status: 400 });
    if (passIds.length > 500) return NextResponse.json({ error: 'Send at most 500 certificates at a time.' }, { status: 400 });
    const event = (await readCollection<EventItem>('events')).find((e) => e.id === id);
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    const origin = getAppBaseUrl(request);

    if (sendAt) {
      const when = new Date(sendAt);
      if (Number.isNaN(when.getTime()) || when.getTime() < Date.now() + 30_000) return NextResponse.json({ error: 'Pick a send time in the future.' }, { status: 400 });
      const schedule: CertificateSchedule = {
        id: `certsch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        eventId: id,
        passIds,
        ...(typeId !== 'default' ? { typeId } : {}),
        sendAt: when.toISOString(),
        origin,
        message,
        createdBy: auth.user?.name || 'Staff',
        createdAt: new Date().toISOString(),
        status: 'Scheduled',
      };
      await mutateCollection<CertificateSchedule>('certificateSchedules', (cur = []) => [...cur, schedule]);
      return NextResponse.json({ scheduled: true, schedule });
    }

    if (!isEventOver(event)) return NextResponse.json({ error: "Certificates can be sent from the event's last day." }, { status: 400 });
    const results = await sendCertificatesBatch(event, passIds, origin, emails, message, auth.user?.name || 'Staff', typeId);
    return NextResponse.json({ sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results });
  } catch (err) {
    return apiError(err, 'certificates:send');
  }
}

/** ?scheduleId=… cancels a scheduled send that has not started. */
export async function DELETE(request: Request) {
  try {
    const auth = await authorise(request);
    if (auth.error) return auth.error;
    const scheduleId = new URL(request.url).searchParams.get('scheduleId') || '';
    let cancelled = false;
    await mutateCollection<CertificateSchedule>('certificateSchedules', (cur = []) =>
      cur.map((x) => {
        if (x.id === scheduleId && x.status === 'Scheduled') {
          cancelled = true;
          return { ...x, status: 'Cancelled' as const };
        }
        return x;
      })
    );
    return cancelled ? NextResponse.json({ cancelled: true }) : NextResponse.json({ error: 'That send already started or does not exist.' }, { status: 409 });
  } catch (err) {
    return apiError(err, 'certificates:cancel-schedule');
  }
}
