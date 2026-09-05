import { NextResponse } from 'next/server';
import { readDb } from '@/lib/server-db';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/api-error';

// This route is the one every signed-in client polls every ~7s for live
// cross-session sync — it's the prime suspect for a "single dependency
// bottleneck" (one slow step dominating round-trip time), but that's not
// something to guess at from reading the code. A `Server-Timing` header
// breaks the request down into its real phases (auth check vs. the actual
// file reads) — open DevTools → Network → click a /api/data request →
// Timing tab to see it per-request, no extra tooling needed. Slow requests
// (>500ms) also get logged server-side so `pm2 logs` shows it happening
// under real traffic without flooding the log on every ordinary poll.
export async function GET(request: Request) {
  const t0 = performance.now();
  try {
    await requireSession(request);
    const tAuth = performance.now();
    const db: any = await readDb();
    const tRead = performance.now();
    // Strip fields that must never leave the server, regardless of caller:
    // password hashes on every member record, and the sessions collection
    // itself (token hashes — not sensitive individually, but no legitimate
    // client use for them either).
    db.members = (db.members || []).map((m: any) => {
      const { passwordHash, ...safe } = m;
      // Activation/reset badges on the client need to know whether a
      // password is set without ever seeing the hash itself.
      return { ...safe, hasPassword: !!passwordHash };
    });
    delete db.sessions;

    const authMs = tAuth - t0;
    const readMs = tRead - tAuth;
    const totalMs = performance.now() - t0;
    if (totalMs > 500) {
      console.warn(`[api/data] Slow poll: auth=${authMs.toFixed(0)}ms read=${readMs.toFixed(0)}ms total=${totalMs.toFixed(0)}ms`);
    }

    return NextResponse.json(db, {
      headers: {
        'Server-Timing': `auth;dur=${authMs.toFixed(1)}, dbread;dur=${readMs.toFixed(1)}, total;dur=${totalMs.toFixed(1)}`,
      },
    });
  } catch (err: any) {
    return apiError(err, 'data-api-get');
  }
}
