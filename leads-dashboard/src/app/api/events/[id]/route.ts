import { NextResponse } from 'next/server';
import { mutateCollection } from '@/lib/server-db';
import { fanOutAutoApproval, cascadeCloseAutoApprovals } from '@/lib/approval-sync';
import { requireSession, requirePermission, ForbiddenError } from '@/lib/session';
import { canDeleteEvent, canApprovePendingEvent, getAccessLevelSettingsServer } from '@/lib/permissions-server';
import { apiError } from '@/lib/api-error';

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
    // Existing approval-routing logic (approvalStatus/approverType fan-out
    // below) already handles the "not fully trusted, route to pending" case,
    // so the gate here is just "must be a real signed-in member" — EXCEPT
    // for the specific transition that actually decides a pending item
    // (pending_* -> approved/rejected), which requires the real resolved
    // approver (see canApprovePendingEvent below) and never just any
    // signed-in member.
    const actor = await requireSession(request);
    const settings = await getAccessLevelSettingsServer();
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

      const isDecideTransition =
        PENDING_STATES.has(previous.approvalStatus) &&
        (updates.approvalStatus === 'approved' || updates.approvalStatus === 'rejected');
      if (isDecideTransition && !canApprovePendingEvent(previous, actor, settings)) {
        throw new ForbiddenError('You are not authorized to decide this event — it needs sign-off from the Centre Head, Advisor, or GG Campus Events Head.');
      }

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
    return apiError(err, 'events-id-api-patch', 400);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireSession(request);
    const settings = await getAccessLevelSettingsServer();
    requirePermission(canDeleteEvent(actor, settings), 'You do not have permission to delete events.');
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
    return apiError(err, 'events-id-api-delete', 500);
  }
}
