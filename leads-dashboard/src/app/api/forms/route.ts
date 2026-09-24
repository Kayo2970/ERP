import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { requireSession, ForbiddenError } from '@/lib/session';
import { getAccessLevelSettingsServer, canBuildForms } from '@/lib/permissions-server';
import { fanOutAutoApproval, resolveCustomApprovalPanel } from '@/lib/approval-sync';
import { apiError } from '@/lib/api-error';

const PENDING_APPROVAL_MESSAGE: Record<string, string> = {
  pending_create: 'This form needs sign-off from the Centre Head or designated approver before its public link goes live.',
  pending_edit: 'An edit to this form needs sign-off from the Centre Head or designated approver.',
  pending_delete: 'A request to delete this form needs sign-off from the Centre Head or designated approver.',
};

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const items = await readCollection('forms');
    return NextResponse.json(items);
  } catch (err: any) {
    return apiError(err, 'forms-api-get', 500);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSession(request);
    const settings = await getAccessLevelSettingsServer();
    if (!canBuildForms(actor, settings)) throw new ForbiddenError();
    const item = await request.json();
    const updated = await mutateCollection('forms', (current) => {
      if (item.slug && current.some((f: any) => f.slug?.toLowerCase() === item.slug?.toLowerCase())) {
        throw new Error(`A form with slug "${item.slug}" already exists`);
      }
      return [item, ...current];
    });
    const created = updated.find((f: any) => f.id === item.id);

    // Route the built-in Group Policy approval gate on this form (see
    // PublicFormItem's doc comment in local-data.ts) into the Approvals
    // module, mirroring the treatment given to Events/Tasks — previously
    // missing entirely, so pending forms never notified anyone or showed
    // up in the consolidated Approvals inbox.
    if (created && created.approvalStatus === 'pending_create') {
      try {
        const customPanel = created.approverType && created.approverType !== 'CENTER_HEAD'
          ? await resolveCustomApprovalPanel(created.approverType, created.approverMemberId, created.approverPolicyTagId)
          : undefined;
        await fanOutAutoApproval({
          entityType: 'form',
          entityId: created.id,
          entityTitle: created.title,
          eventId: created.eventId,
          requesterId: created.submittedBy || '',
          requesterName: created.submittedBy || 'A member',
          requesterEmail: created.submittedByEmail,
          message: PENDING_APPROVAL_MESSAGE[created.approvalStatus],
          customPanel,
        });
      } catch (approvalErr) {
        console.error('[forms-api] Approval fan-out failed:', approvalErr);
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return apiError(err, 'forms-api-post', 400);
  }
}
