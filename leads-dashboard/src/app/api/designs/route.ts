import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { saveBase64File } from '@/lib/file-storage';
import { fanOutAutoApproval } from '@/lib/approval-sync';
import { requireSession, sessionErrorStatus } from '@/lib/session';

export const maxDuration = 60; // 60s execution limit for large uploads (up to 25 MB)

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const items = await readCollection('designs');
    return NextResponse.json(items);
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    if (status) return NextResponse.json({ error: err.message }, { status });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireSession(request); // any signed-in member may submit a design
    const item = await request.json();

    if (!item.title || !item.fileName || !item.fileSize) {
      return NextResponse.json({ error: 'Title, file name, and file size are required.' }, { status: 400 });
    }

    if (item.fileSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size exceeds the maximum limit of 25 MB.' },
        { status: 400 }
      );
    }

    const now = new Date();
    const submittedAt = item.submittedAt || now.toISOString();
    const expiresAt = item.expiresAt || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const id = item.id || 'des_' + Date.now();

    const newDesign = {
      ...item,
      id,
      submittedAt,
      expiresAt,
      isExpired: false,
    };

    // Persist the uploaded asset as a real file on disk under data/uploads/ instead
    // of keeping its full base64 payload inline in designs.json.
    if (typeof newDesign.fileData === 'string' && newDesign.fileData.startsWith('data:')) {
      const stored = await saveBase64File('designs', id, 0, newDesign.fileName, newDesign.fileData);
      newDesign.fileUrl = stored.url;
      newDesign.storageKey = stored.storageKey;
      delete newDesign.fileData;
    }

    const updated = await mutateCollection('designs', (current) => {
      const idx = current.findIndex((d: any) => d.id === newDesign.id);
      if (idx >= 0) {
        current[idx] = newDesign;
        return [...current];
      }
      return [newDesign, ...current];
    });

    const created = updated.find((d: any) => d.id === newDesign.id);

    // Every design submission needs a style-approval/proofreading decision
    // from the Centre Head, Advisor, or GG Campus Events Head — fan that
    // ask out to the Approvals module as soon as it lands.
    if (created) {
      try {
        await fanOutAutoApproval({
          entityType: 'design',
          entityId: created.id,
          entityTitle: created.title,
          eventId: created.eventId,
          requesterId: created.designerId || '',
          requesterName: created.designerName || 'A designer',
          requesterEmail: created.designerEmail,
          message: created.proofreadRequested
            ? 'This design submission needs style approval and proofreading sign-off.'
            : 'This design submission needs style approval sign-off.',
        });
      } catch (approvalErr) {
        console.error('[designs-api] Approval fan-out failed:', approvalErr);
      }
    }

    // Proofread Request Email Dispatch — goes to the full eligible reviewer panel
    // (Centre Head, Advisor, GG Campus Events Head), not just whichever single
    // person resolveDesignReviewer() happened to route the record to. Any one of
    // the three can act on it (see canReviewDesignProofread in permissions.ts).
    if (created && (created.requestProofread || created.assignedProofreaderId)) {
      try {
        const [members, { dispatchEmail, wrapInMasterEmailTemplate, findApprovalRecipients }] = await Promise.all([
          readCollection('members'),
          import('@/lib/email-service'),
        ]);
        const recipients = findApprovalRecipients(members as any[]);
        const reviewers = [recipients.centreHead, recipients.advisor, recipients.eventsHeadGg].filter(
          (r): r is { name: string; email: string } => Boolean(r?.email)
        );

        if (reviewers.length > 0) {
          const { getAppBaseUrl } = await import('@/lib/app-url');
          const baseUrl = getAppBaseUrl(request);
          const designLink = `${baseUrl}/dashboard/designs?highlight=${created.id}`;
          const subject = `Proofread Request: ${created.title}`;

          for (const reviewer of reviewers) {
            const bodyText = `Dear ${reviewer.name},\n\nA design asset needs your proofread sign-off (any one of the Centre Head, Advisor, or GG Campus Events Head can approve it): "${created.title}".\n\nCategory: ${created.category || 'Design Asset'}\nEvent: ${created.eventTitle || 'LEADS Event'}\nSubmitted By: ${created.designerName || 'Designer'} (${created.designerEmail || 'N/A'})\n\nPlease inspect and complete your proofread review here:\n${designLink}\n\nRegards,\nLEADS Design Portal`;

            const bodyHtml = wrapInMasterEmailTemplate({
              pageTitle: subject,
              badgeText: 'PROOFREAD REQUEST',
              badgeColor: '#6366f1',
              headerTitle: 'Proofread Request Received',
              bodyContentHtml: `
              <p style="margin: 0 0 16px; font-size: 14px; color: #475569; line-height: 1.6;">
                Dear <strong>${reviewer.name}</strong>,<br/>
                A new design asset submission needs your proofread sign-off. Any one of the Centre Head, Advisor, or GG Campus Events Head can approve it — whoever gets to it first.
              </p>

              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                <strong style="color: #6366f1; font-size: 15px;">🎨 ${created.title}</strong>
                <div style="font-size: 12px; color: #64748b; margin-top: 8px; line-height: 1.5;">
                  <span><strong>Category:</strong> ${created.category || 'Poster'}</span><br/>
                  <span><strong>Event:</strong> ${created.eventTitle || 'LEADS Operations'}</span><br/>
                  <span><strong>Designer:</strong> ${created.designerName} (${created.designerEmail})</span>
                </div>
              </div>

              <div style="text-align: center; margin: 24px 0 12px;">
                <a href="${designLink}" target="_blank" style="display: inline-block; background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 14px;">
                  🔍 Inspect & Proofread Design
                </a>
              </div>
              `,
            });

            await dispatchEmail({
              to: reviewer.email,
              subject,
              bodyText,
              bodyHtml,
              category: 'SYSTEM',
            });
          }
        }
      } catch (emailErr) {
        console.error('[designs-api] Proofread email dispatch failed:', emailErr);
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    return NextResponse.json({ error: err.message }, { status: status || 500 });
  }
}
