import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { requireSession, requirePermission, sessionErrorStatus } from '@/lib/session';
import { getAccessLevelSettingsServer, canSubmitBudget } from '@/lib/permissions-server';

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const budgets = await readCollection('budgets');
    return NextResponse.json(budgets);
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    return NextResponse.json({ error: err.message }, { status: status || 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSession(request);
    const settings = await getAccessLevelSettingsServer();
    requirePermission(canSubmitBudget(actor, settings), 'You do not have permission to submit a budget request.');

    const budget = await request.json();
    if (!budget.id || typeof budget.amount !== 'number') {
      return NextResponse.json({ error: 'Budget id and amount are required.' }, { status: 400 });
    }

    const updated = await mutateCollection('budgets', (current) => {
      const idx = current.findIndex((b: any) => b.id === budget.id);
      if (idx >= 0) {
        current[idx] = budget;
        return [...current];
      }
      return [budget, ...current];
    });

    const created = updated.find((b: any) => b.id === budget.id);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    return NextResponse.json({ error: err.message }, { status: status || 400 });
  }
}
