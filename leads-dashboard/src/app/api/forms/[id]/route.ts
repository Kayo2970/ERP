import { NextResponse } from 'next/server';
import { mutateCollection } from '@/lib/server-db';
import { requireSession, ForbiddenError } from '@/lib/session';
import { getAccessLevelSettingsServer, canBuildForms, canDeleteForms } from '@/lib/permissions-server';
import { fanOutAutoApproval, cascadeCloseAutoApprovals, deleteLinkedApprovalRequests, resolveCustomApprovalPanel } from '@/lib/approval-sync';
import { apiError } from '@/lib/api-error';

const PENDING_APPROVAL_MESSAGE: Record<string, string> = {
  pending_create: 'This form needs sign-off from the Centre Head or designated approver before its public link goes live.',
  pending_edit: 'An edit to this form needs sign-off from the Centre Head or designated approver.',
  pending_delete: 'A request to delete this form needs sign-off from the Centre Head or designated approver.',
};
const PENDING_STATES = new Set(['pending_create', 'pending_edit', 'pending_delete']);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireSession(request);
    const settings = await getAccessLevelSettingsServer();
    if (!canBuildForms(actor, settings)) throw new ForbiddenError();
    const { id } = await params;
    const updates = await request.json();
    // Upsert: if this id isn't in the server's collection yet (e.g. client-bundled
    // sample/seed data never POSTed), create it instead of 404ing and silently
    // dropping the edit.
    let previous: any = null;
    const updated = await mutateCollection('forms', (current) => {
      const idx = current.findIndex((item: any) => item.id === id);
      if (idx === -1) return [...current, { id, ...updates }];
      previous = current[idx];
      const next = [...current];
      next[idx] = { ...next[idx], ...updates };
      return next;
    });
    const result = updated.find((f: any) => f.id === id);

    if (result) {
      const wasPending = previous && PENDING_STATES.has(previous.approvalStatus);
      const isPending = PENDING_STATES.has(result.approvalStatus);

      if (isPending && (!wasPending || previous.approvalStatus !== result.approvalStatus)) {
        try {
          const customPanel = result.approverType && result.approverType !== 'CENTER_HEAD'
            ? await resolveCustomApprovalPanel(result.approverType, result.approverMemberId, result.approverPolicyTagId)
            : undefined;
          await fanOutAutoApproval({
            entityType: 'form',
            entityId: result.id,
            entityTitle: result.title,
            eventId: result.eventId,
            requesterId: result.submittedBy || '',
            requesterName: result.submittedBy || 'A member',
            requesterEmail: result.submittedByEmail,
            message: PENDING_APPROVAL_MESSAGE[result.approvalStatus],
            customPanel,
          });
        } catch (approvalErr) {
          console.error('[forms-api] Approval fan-out failed:', approvalErr);
        }
      } else if (wasPending && (result.approvalStatus === 'approved' || result.approvalStatus === 'rejected')) {
        try {
          await cascadeCloseAutoApprovals('form', result.id, result.approvalStatus, result.decidedBy);
        } catch (approvalErr) {
          console.error('[forms-api] Approval cascade-close failed:', approvalErr);
        }
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return apiError(err, 'forms-id-api-patch', 400);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireSession(request);
    const settings = await getAccessLevelSettingsServer();
    if (!canDeleteForms(actor, settings)) throw new ForbiddenError();
    const { id } = await params;
    let found = false;
    let deletedSlug: string | undefined;
    await mutateCollection('forms', (current) => {
      const target = current.find((f: any) => f.id === id);
      deletedSlug = target?.slug;
      const filtered = current.filter((f: any) => f.id !== id);
      found = filtered.length < current.length;
      return filtered;
    });
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await deleteLinkedApprovalRequests('form', id);

    // A deleted form used to leave its submissions behind forever — they'd
    // even resurface under a brand-new form later created on the same slug
    // (submissions are matched by slug as a fallback for records predating
    // a reliable formId). Cascade the cleanup here so it applies regardless
    // of which client triggered the delete.
    await mutateCollection('submissions', (current) =>
      current.filter((s: any) => s.formId !== id && s.slug !== deletedSlug)
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return apiError(err, 'forms-id-api-delete', 500);
  }
}
