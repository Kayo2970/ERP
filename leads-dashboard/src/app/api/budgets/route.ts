import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { requireSession, requirePermission } from '@/lib/session';
import { getAccessLevelSettingsServer, canSubmitBudget, isCentreHead } from '@/lib/permissions-server';
import { dispatchEmail, generateBudgetSubmittedEmailTemplate } from '@/lib/email-service';
import { apiError } from '@/lib/api-error';

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const budgets = await readCollection('budgets');
    return NextResponse.json(budgets);
  } catch (err: any) {
    return apiError(err, 'budgets-api-get', 500);
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

    // Let the Centre Head(s) know a new budget request needs their
    // verification — same low-stakes, fire-and-log tone as the
    // Reimbursements submit notice.
    if (created) {
      try {
        const members = await readCollection('members');
        const approvers = (members as any[]).filter(
          (m) => m.status !== 'Terminated' && m.email && isCentreHead(m, settings)
        );
        const label = created.eventName || created.month || created.financialYear || created.type;
        for (const approver of approvers) {
          const template = generateBudgetSubmittedEmailTemplate(approver.name, created.submittedBy, created.amount, label);
          await dispatchEmail({
            to: approver.email,
            subject: template.subject,
            bodyText: template.bodyText,
            bodyHtml: template.bodyHtml,
            category: 'BUDGET',
          });
        }
      } catch (emailErr) {
        console.error('[budgets-api] Failed to notify approver of new request:', emailErr);
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return apiError(err, 'budgets-api-post', 400);
  }
}
