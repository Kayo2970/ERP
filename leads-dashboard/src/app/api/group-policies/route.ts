import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { requireSession, requirePermission, sessionErrorStatus } from '@/lib/session';
import { isSuperUser } from '@/lib/permissions-server';

export async function GET(request: Request) {
  try {
    const actor = await requireSession(request);
    requirePermission(isSuperUser(actor), 'Only a Super User can view Group Policies.');
    const items = await readCollection('groupPolicies');
    return NextResponse.json(items);
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    return NextResponse.json({ error: err.message }, { status: status || 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSession(request);
    requirePermission(isSuperUser(actor), 'Only a Super User can create Group Policies.');

    const item = await request.json();
    const updated = await mutateCollection('groupPolicies', (current) => {
      const idx = current.findIndex((p: any) => p.id === item.id);
      if (idx >= 0) {
        const copy = [...current];
        copy[idx] = item;
        return copy;
      }
      return [item, ...current];
    });
    const created = updated.find((p: any) => p.id === item.id);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    return NextResponse.json({ error: err.message }, { status: status || 400 });
  }
}
