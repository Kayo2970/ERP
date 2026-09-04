import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { requireSession, requirePermission, sessionErrorStatus } from '@/lib/session';
import { canEvaluateEventStudent, getAccessLevelSettingsServer } from '@/lib/permissions-server';

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const items = await readCollection('ratings');
    return NextResponse.json(items);
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    return NextResponse.json({ error: err.message }, { status: status || 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSession(request);
    const settings = await getAccessLevelSettingsServer();
    requirePermission(canEvaluateEventStudent(actor, settings), 'You do not have permission to submit ratings.');
    const item = await request.json();
    const updated = await mutateCollection('ratings', (current) => [item, ...current]);
    const created = updated.find((r: any) => r.id === item.id);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    return NextResponse.json({ error: err.message }, { status: status || 400 });
  }
}
