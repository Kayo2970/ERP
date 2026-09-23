import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { fanOutAutoApproval, resolveCentreHeadAdvisorPanel } from '@/lib/approval-sync';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/api-error';

function summarizeItems(items: any[]): string {
  if (!Array.isArray(items) || items.length === 0) return 'materials';
  const summary = items.map(i => `${i.quantity} ${i.unit || ''} ${i.name}`.replace(/\s+/g, ' ').trim()).join(', ');
  return summary.length > 200 ? `${summary.slice(0, 197)}...` : summary;
}

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const items = await readCollection('procurementRequests');
    return NextResponse.json(items);
  } catch (err: any) {
    return apiError(err, 'procurement-requests-api-get', 500);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSession(request); // any signed-in member may submit a request
    const item = await request.json();

    if (!Array.isArray(item.items) || item.items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required.' }, { status: 400 });
    }
    for (const line of item.items) {
      if (!line.name || typeof line.quantity !== 'number' || line.quantity <= 0) {
        return NextResponse.json({ error: 'Each item needs a name and a positive quantity.' }, { status: 400 });
      }
    }

    const id = item.id || 'proc_' + Date.now();
    const newRequest = {
      ...item,
      id,
      status: 'Pending',
      submittedAt: item.submittedAt || new Date().toISOString(),
    };

    const updated = await mutateCollection('procurementRequests', (current) => {
      const idx = current.findIndex((r: any) => r.id === newRequest.id);
      if (idx >= 0) {
        current[idx] = newRequest;
        return [...current];
      }
      return [newRequest, ...current];
    });

    let created = updated.find((r: any) => r.id === newRequest.id);

    // Fan out the approval email + Approvals-inbox rows to the Centre Head
    // and Advisor only — never the wider default panel — per the module's
    // own design (see permissions.ts's canDecideProcurementRequest).
    let approvalEmailSent = false;
    let approvalEmailError: string | undefined;
    try {
      const panel = await resolveCentreHeadAdvisorPanel();
      if (panel.length === 0) {
        approvalEmailError = 'No Centre Head or Advisor found in the Directory to send the approval request to.';
      } else {
        await fanOutAutoApproval({
          entityType: 'procurement',
          entityId: created.id,
          entityTitle: summarizeItems(created.items),
          eventId: created.eventId,
          requesterId: created.requesterId || actor.id || '',
          requesterName: created.requesterName || actor.name || 'A member',
          requesterEmail: created.requesterEmail || actor.email,
          message: created.justification,
          customPanel: panel,
        });
        approvalEmailSent = true;
      }
    } catch (approvalErr: any) {
      console.error('[procurement-requests-api] Approval fan-out failed:', approvalErr);
      approvalEmailError = approvalErr?.message || 'Failed to send the approval request email.';
    }

    const finalUpdated = await mutateCollection('procurementRequests', (current) => (current || []).map((r: any) =>
      r.id === id ? { ...r, approvalEmailSent, approvalEmailError } : r
    ));
    created = finalUpdated.find((r: any) => r.id === id);

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return apiError(err, 'procurement-requests-api-post', 500);
  }
}
