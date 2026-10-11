import { NextResponse } from 'next/server';
import { findCertificateByCode, getCertificateTemplate, recordExtras, renderCertificatePng, verifyUrlFor } from '@/lib/certificate';
import { getAppBaseUrl } from '@/lib/app-url';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const rec = await findCertificateByCode(code);
  if (!rec || rec.status !== 'Sent') return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
  const png = await renderCertificatePng({ ...rec, ...recordExtras(rec) }, await getCertificateTemplate(rec.eventId, rec.typeId), verifyUrlFor(getAppBaseUrl(request), rec.code), 2);
  return new NextResponse(new Uint8Array(png), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' } });
}
