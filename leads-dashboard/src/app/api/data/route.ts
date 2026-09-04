import { NextResponse } from 'next/server';
import { readDb } from '@/lib/server-db';
import { requireSession, sessionErrorStatus } from '@/lib/session';

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const db: any = await readDb();
    // Strip fields that must never leave the server, regardless of caller:
    // password hashes on every member record, and the sessions collection
    // itself (token hashes — not sensitive individually, but no legitimate
    // client use for them either).
    db.members = (db.members || []).map((m: any) => {
      const { passwordHash, ...safe } = m;
      return safe;
    });
    delete db.sessions;
    return NextResponse.json(db);
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    if (status) return NextResponse.json({ error: err.message }, { status });
    return NextResponse.json({ error: err.message || 'Failed to read database' }, { status: 500 });
  }
}
