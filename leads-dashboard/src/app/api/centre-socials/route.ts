import { NextResponse } from 'next/server';
import { mutateCollection } from '@/lib/server-db';
import { requireSession } from '@/lib/session';
import { isSuperUser } from '@/lib/permissions-server';
import { apiError } from '@/lib/api-error';
import { readCentreSocials, sanitizeSocials } from '@/lib/centre-socials';

export const dynamic = 'force-dynamic';

/** Public read-only list of the centre's social URLs (shown on thank-you pages). */
export async function GET() {
  try {
    return NextResponse.json(await readCentreSocials());
  } catch (err: any) {
    return apiError(err, 'centre-socials-get', 500);
  }
}

/** Super User only. */
export async function PUT(request: Request) {
  try {
    const actor = await requireSession(request);
    if (!isSuperUser(actor)) {
      return NextResponse.json({ error: 'Only a Super User can change the centre social accounts.' }, { status: 403 });
    }
    const socials = sanitizeSocials(await request.json());
    await mutateCollection('walletSettings', (current: any[]) => {
      const idx = current.findIndex((r) => r.id === 'default');
      const next = { ...(idx === -1 ? { id: 'default' } : current[idx]), socials };
      if (idx === -1) return [...current, next];
      const copy = [...current];
      copy[idx] = next;
      return copy;
    });
    return NextResponse.json(socials);
  } catch (err: any) {
    return apiError(err, 'centre-socials-put', 400);
  }
}
