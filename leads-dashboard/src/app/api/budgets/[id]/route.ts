import { NextResponse } from 'next/server';
import { mutateCollection, readCollection } from '@/lib/server-db';
import { requireSession, requirePermission } from '@/lib/session';
import {
  getAccessLevelSettingsServer,
  canVerifyBudgetCentreHead,
  canDecideBudget,
  canSubmitBudget,
  isCentreHead,
  isFinanceHead,
} from '@/lib/permissions-server';
import { dispatchEmail, generateBudgetSubmittedEmailTemplate, generateBudgetDecisionEmailTemplate } from '@/lib/email-service';
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

    const existing = (await readCollection<any>('budgets')).find((b: any) => b.id === id);
    const isSubmitter = !!(
      existing?.submittedByEmail &&
      actor?.email &&
      String(existing.submittedByEmail).toLowerCase() === String(actor.email).toLowerCase()
    );

    // Figure out which stage this PATCH is actioning from the body shape —
    // see decideBudget()/verifyBudgetByCentreHead()/updateBudget() in
    // local-data.ts, the only client write paths that hit this route.
    const isVerifyStage = updates.centreHeadVerified === true;
    const isDecideStage = (updates.status === 'Approved' || updates.status === 'Rejected') && 'decidedBy' in updates;
    const isEditStage = updates.status === 'Pending' && updates.centreHeadVerified === false;

    let allowed = false;
    if (isVerifyStage) {
      allowed = allowed || canVerifyBudgetCentreHead(actor, settings);
    }
    if (isDecideStage) {
      allowed = allowed || canDecideBudget(actor, settings, existing);
    }
    if (isEditStage) {
      allowed = allowed || canSubmitBudget(actor, settings) || isSubmitter;
    }
    if (!isVerifyStage && !isDecideStage && !isEditStage) {
      // No recognized stage transition — fall back to the union of everyone
      // who could legitimately touch this record.
      allowed =
        isSubmitter ||
        canSubmitBudget(actor, settings) ||
        canVerifyBudgetCentreHead(actor, settings) ||
        canDecideBudget(actor, settings, existing);
    }
    requirePermission(allowed, 'You do not have permission to update this budget request.');

    const updated = await mutateCollection('budgets', (current) => {
      const idx = current.findIndex((b: any) => b.id === id);
      if (idx === -1) return [...current, { id, ...updates }];
      const next = [...current];
      next[idx] = { ...next[idx], ...updates };
      return next;
    });
    let result = updated.find((b: any) => b.id === id);

    // Notify the submitter on every decision (verify/approve/reject), and
    // the Finance Head(s) once a request clears Centre Head verification —
    // mirrors the Reimbursements module's decision-email wiring.
    if (result && (isVerifyStage || isDecideStage)) {
      try {
        const members = await readCollection('members');
        const label = result.eventName || result.month || result.financialYear || result.type;

        if (isVerifyStage) {
          const financeHeads = (members as any[]).filter(
            (m) => m.status !== 'Terminated' && m.email && isFinanceHead(m, settings)
          );
          for (const fh of financeHeads) {
            const template = generateBudgetSubmittedEmailTemplate(fh.name, result.submittedBy, result.amount, label);
            await dispatchEmail({ to: fh.email, subject: template.subject, bodyText: template.bodyText, bodyHtml: template.bodyHtml, category: 'BUDGET' });
          }
        }

        if (result.submittedByEmail) {
          const outcome = isVerifyStage ? 'verified' : result.status === 'Approved' ? 'approved' : 'rejected';
          const template = generateBudgetDecisionEmailTemplate(result.submittedBy, outcome, result.amount, label, result.decidedBy, result.decisionNotes);
          const log = await dispatchEmail({
            to: result.submittedByEmail,
            subject: template.subject,
            bodyText: template.bodyText,
            bodyHtml: template.bodyHtml,
            category: 'BUDGET',
          });

          await mutateCollection('budgets', (current) => current.map((b: any) =>
            b.id === id ? { ...b, decisionEmailSent: log.status === 'SENT', decisionEmailError: log.errorMessage } : b
          ));
          result = { ...result, decisionEmailSent: log.status === 'SENT', decisionEmailError: log.errorMessage };
        }
      } catch (emailErr: any) {
        console.error('[budgets-api] Decision email dispatch failed:', emailErr);
        const message = emailErr?.message || 'Failed to send the decision email.';
        await mutateCollection('budgets', (current) => current.map((b: any) =>
          b.id === id ? { ...b, decisionEmailSent: false, decisionEmailError: message } : b
        ));
        result = { ...result, decisionEmailSent: false, decisionEmailError: message };
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return apiError(err, 'budgets-id-api-patch', 400);
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
    requirePermission(
      isCentreHead(actor, settings) || actor.tier === 1,
      'You do not have permission to delete this budget request.'
    );

    let found = false;
    await mutateCollection('budgets', (current) => {
      const filtered = current.filter((b: any) => b.id !== id);
      found = filtered.length < current.length;
      return filtered;
    });
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return apiError(err, 'budgets-id-api-delete', 500);
  }
}
