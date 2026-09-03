import { NextResponse } from 'next/server';
import { mutateCollection } from '@/lib/server-db';
import { fanOutAutoApproval, cascadeCloseAutoApprovals } from '@/lib/approval-sync';

const PENDING_APPROVAL_MESSAGE: Record<string, string> = {
  pending_create: 'This event was created and needs sign-off from the Centre Head, Advisor, or GG Campus Events Head before it goes live.',
  pending_edit: 'An edit to this event needs sign-off from the Centre Head, Advisor, or GG Campus Events Head.',
  pending_delete: 'A request to delete this event needs sign-off from the Centre Head, Advisor, or GG Campus Events Head.',
};
const PENDING_STATES = new Set(['pending_create', 'pending_edit', 'pending_delete']);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    // Upsert: if this id isn't in the server's collection yet (e.g. client-bundled
    // sample/seed data never POSTed), create it instead of 404ing and silently
    // dropping the edit.
    let previous: any = null;
    const updated = await mutateCollection('events', (current) => {
      const idx = current.findIndex((item: any) => item.id === id);
      if (idx === -1) return [...current, { id, ...updates }];
      previous = current[idx];
      const next = [...current];
      next[idx] = { ...next[idx], ...updates };
      return next;
    });
    const result = updated.find((e: any) => e.id === id);

    if (result && (result.approverType === 'CENTER_HEAD' || !result.approverType)) {
      const wasPending = previous && PENDING_STATES.has(previous.approvalStatus);
      const isPending = PENDING_STATES.has(result.approvalStatus);

      if (isPending && (!wasPending || previous.approvalStatus !== result.approvalStatus)) {
        try {
          await fanOutAutoApproval({
            entityType: 'event',
            entityId: result.id,
            entityTitle: result.title,
            requesterId: result.submittedBy || '',
            requesterName: result.submittedBy || 'A member',
            requesterEmail: result.submittedByEmail,
            message: PENDING_APPROVAL_MESSAGE[result.approvalStatus],
          });
        } catch (approvalErr) {
          console.error('[events-api] Approval fan-out failed:', approvalErr);
        }
      } else if (wasPending && (result.approvalStatus === 'approved' || result.approvalStatus === 'rejected')) {
        try {
          await cascadeCloseAutoApprovals('event', result.id, result.approvalStatus, result.decidedBy);
        } catch (approvalErr) {
          console.error('[events-api] Approval cascade-close failed:', approvalErr);
        }
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let found = false;
    await mutateCollection('events', (current) => {
      const filtered = current.filter((e: any) => e.id !== id);
      found = filtered.length < current.length;
      return filtered;
    });
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
