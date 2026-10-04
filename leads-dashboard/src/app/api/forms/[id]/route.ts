import { NextResponse } from 'next/server';
import { mutateCollection, readCollection } from '@/lib/server-db';
import { gateFormAction, formEditKeys, holdEditForApproval, classifyApprovalUpdate, canDecidePending } from '@/lib/approval-gate';
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
    const { id } = await params;
    const updates = await request.json();

    // Chain of command: a genuinely pending form is decided only by its approver (this route used to let any form
    // builder approve their own submission); edits by non-trusted builders are held as pending_edit.
    const storedForm = (await readCollection<any>('forms')).find((f: any) => f.id === id);
    if (classifyApprovalUpdate(storedForm, updates) === 'decision') {
      if (!(await canDecidePending(storedForm, actor))) {
        throw new ForbiddenError('You are not authorized to decide this form — it needs sign-off from the designated approver.');
      }
    } else {
      const gate = await gateFormAction(actor, 'EDIT');
      const isPendingRequest = updates.approvalStatus === 'pending_edit' || updates.approvalStatus === 'pending_delete' || updates.approvalStatus === 'pending_create';
      if (!gate.allowed && !(isPendingRequest && canBuildForms(actor, settings))) throw new ForbiddenError();
      const editKeys = formEditKeys(updates);
      if (editKeys.length > 0 && storedForm && gate.requiresApproval && !PENDING_STATES.has(storedForm.approvalStatus)) {
        holdEditForApproval(storedForm, updates, editKeys, gate, actor);
      }
    }
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
    if (!(await canDeleteForms(actor, settings))) throw new ForbiddenError();
    const { id } = await params;

    // Chain of command: a non-trusted user's delete is held as pending_delete; a pending delete is carried out only by its approver.
    const storedForm = (await readCollection<any>('forms')).find((f: any) => f.id === id);
    const delGate = await gateFormAction(actor, 'DELETE');
    if (storedForm && delGate.requiresApproval) {
      if (storedForm.approvalStatus === 'pending_delete' && (await canDecidePending(storedForm, actor))) {
        // approver confirming the deletion — fall through
      } else if (PENDING_STATES.has(storedForm.approvalStatus)) {
        return NextResponse.json({ error: 'This form already has a change waiting for approval.' }, { status: 409 });
      } else {
        const held: Record<string, any> = {
          approvalStatus: 'pending_delete',
          approverType: delGate.approverType,
          approverMemberId: delGate.approverMemberId,
          approverPolicyTagId: delGate.approverPolicyTagId,
          approvalPolicyName: delGate.policyName,
          submittedBy: actor.name,
          submittedByEmail: actor.email,
        };
        const updatedRows = await mutateCollection('forms', (current) => current.map((f: any) => (f.id === id ? { ...f, ...held } : f)));
        const result = updatedRows.find((f: any) => f.id === id);
        if (result) {
          try {
            const customPanel = result.approverType && result.approverType !== 'CENTER_HEAD'
              ? await resolveCustomApprovalPanel(result.approverType, result.approverMemberId, result.approverPolicyTagId)
              : undefined;
            await fanOutAutoApproval({
              entityType: 'form', entityId: result.id, entityTitle: result.title, eventId: result.eventId,
              requesterId: result.submittedBy || '', requesterName: result.submittedBy || 'A member', requesterEmail: result.submittedByEmail,
              message: PENDING_APPROVAL_MESSAGE.pending_delete, customPanel,
            });
          } catch (approvalErr) {
            console.error('[forms-api] Approval fan-out failed:', approvalErr);
          }
        }
        return NextResponse.json({ success: true, approvalPending: true }, { status: 202 });
      }
    }
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
