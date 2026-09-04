import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { dispatchEmail, wrapInMasterEmailTemplate } from '@/lib/email-service';
import { requireSession, sessionErrorStatus } from '@/lib/session';

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const items = await readCollection('approvalRequests');
    return NextResponse.json(items);
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    return NextResponse.json({ error: err.message }, { status: status || 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Any signed-in member may ask another member to approve something they
    // own/created; the target member's own consent is enforced at decide time.
    await requireSession(request);
    const item = await request.json();
    const updated = await mutateCollection('approvalRequests', (current) => {
      const idx = current.findIndex((r: any) => r.id === item.id);
      if (idx >= 0) {
        const copy = [...current];
        copy[idx] = item;
        return copy;
      }
      return [item, ...current];
    });
    const created = updated.find((r: any) => r.id === item.id);

    if (created?.targetMemberEmail) {
      try {
        const entityLabelMap: Record<string, string> = {
          task: 'Task',
          committee: 'Committee',
          event: 'Event',
          member: 'Member',
          design: 'Design',
          'event-report': 'Event Report',
          announcement: 'Announcement',
        };
        const entityLabel = entityLabelMap[created.entityType] || 'Event';
        const bodyHtml = `
          <p>Hello ${created.targetMemberName || 'there'},</p>
          <p><strong>${created.requesterName}</strong> is asking you to approve the following ${entityLabel.toLowerCase()}:</p>
          <p style="font-weight: 700; font-size: 15px; color: #0f172a;">${created.entityTitle}</p>
          ${created.message ? `<p style="background: #f8fafc; border-left: 3px solid #38bdf8; padding: 10px 14px; border-radius: 4px; color: #475569;">"${created.message}"</p>` : ''}
          <p>Please sign in to the LEADS Dashboard and visit <strong>Approvals</strong> to approve or reject this request.</p>
        `;
        await dispatchEmail({
          to: created.targetMemberEmail,
          subject: `Approval requested: ${created.entityTitle}`,
          bodyText: `${created.requesterName} is asking you to approve the ${entityLabel.toLowerCase()} "${created.entityTitle}". ${created.message ? `Message: ${created.message}` : ''} Sign in to the LEADS Dashboard's Approvals page to respond.`,
          bodyHtml: wrapInMasterEmailTemplate({
            pageTitle: `Approval requested: ${created.entityTitle}`,
            headerTitle: 'Approval Requested',
            headerSubtitle: `${entityLabel} sign-off needed`,
            badgeText: 'ACTION NEEDED',
            badgeColor: '#d97706',
            bodyContentHtml: bodyHtml,
          }),
          badgeText: 'ACTION NEEDED',
          badgeColor: '#d97706',
          category: 'APPROVAL_REQUEST',
        });
      } catch (emailErr) {
        console.error('[approval-requests-api] Failed to send notification email:', emailErr);
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    return NextResponse.json({ error: err.message }, { status: status || 400 });
  }
}
