import { NextResponse } from 'next/server';
import { mutateCollection, readCollection } from '@/lib/server-db';
import { deleteStoredFilesForRecord } from '@/lib/file-storage';
import { requireSession, requirePermission } from '@/lib/session';
import {
  getAccessLevelSettingsServer,
  canApproveAsSectorHead,
  canVerifyReimbursementCentreHead,
  canApproveAsFinanceHead,
  isCentreHead,
  isFinanceHead,
} from '@/lib/permissions-server';
import { dispatchEmail, generateReimbursementSubmittedEmailTemplate, generateReimbursementDecisionEmailTemplate } from '@/lib/email-service';
import { apiError } from '@/lib/api-error';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireSession(request);
    const { id } = await params;
    const updates = await request.json();
    const settings = await getAccessLevelSettingsServer();

    const existing = (await readCollection<any>('reimbursements')).find((r: any) => r.id === id);
    const isClaimant = !!(
      existing?.memberEmail &&
      actor?.email &&
      String(existing.memberEmail).toLowerCase() === String(actor.email).toLowerCase()
    );

    // Figure out which stage this PATCH is actioning from the body shape —
    // see updateReimbursementStatus()/verifyReimbursementByCentreHead() in
    // local-data.ts, the only two client write paths that hit this route.
    const isCentreHeadVerifyAction = updates.status === 'Verified by Centre Head' || updates.centreHeadVerified === true;
    const isFinanceDecision = updates.status === 'Approved' || (updates.status === 'Denied' && !!updates.finalApprover);
    const isFirstPassReject = updates.status === 'Denied' && !!updates.firstPassReviewer && !updates.finalApprover;

    let allowed = false;
    if (isCentreHeadVerifyAction || isFirstPassReject) {
      allowed = allowed || canApproveAsSectorHead(actor, settings) || canVerifyReimbursementCentreHead(actor, settings);
    }
    if (isFinanceDecision) {
      allowed = allowed || canApproveAsFinanceHead(actor, settings, existing);
    }
    if (!isCentreHeadVerifyAction && !isFinanceDecision && !isFirstPassReject) {
      // No recognized stage transition (e.g. a minor field edit) — allow the
      // claimant editing their own claim, or anyone who could act on it at
      // any stage, but not an unrelated member.
      allowed =
        isClaimant ||
        canApproveAsSectorHead(actor, settings) ||
        canVerifyReimbursementCentreHead(actor, settings) ||
        canApproveAsFinanceHead(actor, settings, existing);
    }
    requirePermission(allowed, 'You do not have permission to update this reimbursement claim.');

    // Upsert: if this id isn't in the server's collection yet — e.g. it's one of the
    // client-bundled sample/seed records that was never POSTed — create it instead of
    // 404ing and silently dropping the edit (that used to leave the sample data stuck
    // forever, since polling clients would then keep re-hydrating the stale sample).
    const updated = await mutateCollection('reimbursements', (current) => {
      const idx = current.findIndex((item: any) => item.id === id);
      if (idx === -1) return [...current, { id, ...updates }];
      const next = [...current];
      next[idx] = { ...next[idx], ...updates };
      return next;
    });
    let result = updated.find((r: any) => r.id === id);

    // Notify the claimant on every decision (verify/approve/deny), and the
    // Finance Head(s) once a claim clears Centre Head verification — mirrors
    // the Designs portal's "email on every decision" pattern, with the
    // send outcome written back onto the record so a failure is visible.
    if (result && (isCentreHeadVerifyAction || isFinanceDecision || isFirstPassReject)) {
      try {
        const members = await readCollection('members');

        if (isCentreHeadVerifyAction) {
          const financeHeads = (members as any[]).filter(
            (m) => m.status !== 'Terminated' && m.email && isFinanceHead(m, settings)
          );
          for (const fh of financeHeads) {
            const template = generateReimbursementSubmittedEmailTemplate(fh.name, result.memberName, result.amount, result.category);
            await dispatchEmail({ to: fh.email, subject: template.subject, bodyText: template.bodyText, bodyHtml: template.bodyHtml, category: 'REIMBURSEMENT' });
          }
        }

        const outcome = isCentreHeadVerifyAction ? 'verified' : result.status === 'Approved' ? 'approved' : 'denied';
        const decidedByName = result.finalApprover || result.firstPassReviewer;
        const template = generateReimbursementDecisionEmailTemplate(result.memberName, outcome, result.amount, result.category, decidedByName);
        const log = await dispatchEmail({
          to: result.memberEmail,
          subject: template.subject,
          bodyText: template.bodyText,
          bodyHtml: template.bodyHtml,
          category: 'REIMBURSEMENT',
        });

        await mutateCollection('reimbursements', (current) => current.map((r: any) =>
          r.id === id ? { ...r, decisionEmailSent: log.status === 'SENT', decisionEmailError: log.errorMessage } : r
        ));
        result = { ...result, decisionEmailSent: log.status === 'SENT', decisionEmailError: log.errorMessage };
      } catch (emailErr: any) {
        console.error('[reimbursements-api] Decision email dispatch failed:', emailErr);
        const message = emailErr?.message || 'Failed to send the decision email.';
        await mutateCollection('reimbursements', (current) => current.map((r: any) =>
          r.id === id ? { ...r, decisionEmailSent: false, decisionEmailError: message } : r
        ));
        result = { ...result, decisionEmailSent: false, decisionEmailError: message };
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return apiError(err, 'reimbursements-id-api-patch', 400);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireSession(request);
    const { id } = await params;
    const settings = await getAccessLevelSettingsServer();
    const existing = (await readCollection<any>('reimbursements')).find((r: any) => r.id === id);
    const isClaimant = !!(
      existing?.memberEmail &&
      actor?.email &&
      String(existing.memberEmail).toLowerCase() === String(actor.email).toLowerCase()
    );
    requirePermission(
      isClaimant || isCentreHead(actor, settings) || actor.tier === 1,
      'You do not have permission to delete this reimbursement claim.'
    );

    let found = false;
    await mutateCollection('reimbursements', (current) => {
      const filtered = current.filter((r: any) => r.id !== id);
      found = filtered.length < current.length;
      return filtered;
    });
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await deleteStoredFilesForRecord('reimbursements', id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return apiError(err, 'reimbursements-id-api-delete', 500);
  }
}
