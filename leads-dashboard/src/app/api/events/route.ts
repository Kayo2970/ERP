import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { dispatchEmail, generateEventRosterEmailTemplate } from '@/lib/email-service';
import { fanOutAutoApproval } from '@/lib/approval-sync';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/api-error';

const PENDING_APPROVAL_MESSAGE: Record<string, string> = {
  pending_create: 'This event was created and needs sign-off from the Centre Head, Advisor, or GG Campus Events Head before it goes live.',
  pending_edit: 'An edit to this event needs sign-off from the Centre Head, Advisor, or GG Campus Events Head.',
  pending_delete: 'A request to delete this event needs sign-off from the Centre Head, Advisor, or GG Campus Events Head.',
};

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const items = await readCollection('events');
    return NextResponse.json(items);
  } catch (err: any) {
    return apiError(err, 'events-api-get', 500);
  }
}

export async function POST(request: Request) {
  try {
    // Route already branches into a pending-approval path (approvalStatus /
    // approverType computed by the client) when the actor isn't fully
    // trusted — see the fan-out block below — so the gate here is just
    // "must be a real signed-in member," not a hard canCreateEvent check.
    await requireSession(request);
    const item = await request.json();
    const updated = await mutateCollection('events', (current) => {
      const idx = current.findIndex((e: any) => e.id === item.id);
      if (idx >= 0) {
        const copy = [...current];
        copy[idx] = item;
        return copy;
      }
      return [item, ...current];
    });
    const created = updated.find((e: any) => e.id === item.id);

    // Route the built-in Group Policy approval gate (approvalStatus/
    // approverType — see EventItem's doc comment in local-data.ts) into the
    // Approvals module too, so festivals and every other event this fires
    // for actually shows up there. Only the default CENTER_HEAD panel is
    // fanned out here — a SPECIFIC_MEMBER/POLICY_TAG approver was already
    // deliberately narrowed by whoever set that up, so it's left alone.
    if (
      created &&
      (created.approverType === 'CENTER_HEAD' || !created.approverType) &&
      (created.approvalStatus === 'pending_create' || created.approvalStatus === 'pending_edit' || created.approvalStatus === 'pending_delete')
    ) {
      try {
        await fanOutAutoApproval({
          entityType: 'event',
          entityId: created.id,
          entityTitle: created.title,
          requesterId: created.submittedBy || '',
          requesterName: created.submittedBy || 'A member',
          requesterEmail: created.submittedByEmail,
          message: PENDING_APPROVAL_MESSAGE[created.approvalStatus],
        });
      } catch (approvalErr) {
        console.error('[events-api] Approval fan-out failed:', approvalErr);
      }
    }

    // Automated Email Dispatch for Event Committee Roster
    if (created && Array.isArray(created.committees)) {
      try {
        const members = await readCollection('members');

        for (const committee of created.committees) {
          const memberIds = committee.memberIds || [];
          for (const mId of memberIds) {
            const member = members.find((m: any) => m.id === mId);
            if (member && member.email) {
              const template = generateEventRosterEmailTemplate(
                member.name,
                created.title,
                committee.name,
                created.startDate
              );
              await dispatchEmail({
                to: member.email,
                subject: template.subject,
                bodyText: template.bodyText,
                bodyHtml: template.bodyHtml,
                category: 'EVENT_ROSTER',
              });
            }
          }
        }
      } catch (emailErr) {
        console.error('[events-api] Email dispatch failed:', emailErr);
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return apiError(err, 'events-api-post', 400);
  }
}
