import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/api-error';
import { gateCertificateAction } from '@/lib/approval-gate';
import { listIssuedCertificates } from '@/lib/certificate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Read-only list of every issued certificate (one row each) with delivery status. Optional ?eventId=. */
export async function GET(request: Request) {
  try {
    const user = await requireSession(request);
    const gate = await gateCertificateAction(user, 'ledger');
    if (!gate.allowed || gate.requiresApproval) return NextResponse.json({ allowed: false, certificates: [] });
    const eventId = new URL(request.url).searchParams.get('eventId') || undefined;
    return NextResponse.json({ allowed: true, certificates: await listIssuedCertificates(eventId) });
  } catch (err) {
    return apiError(err, 'certificates:issued');
  }
}
