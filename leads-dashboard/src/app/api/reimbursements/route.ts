import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { saveBase64File } from '@/lib/file-storage';
import { requireSession } from '@/lib/session';
import { getAccessLevelSettingsServer, isCentreHead } from '@/lib/permissions-server';
import { dispatchEmail, generateReimbursementSubmittedEmailTemplate } from '@/lib/email-service';
import { apiError } from '@/lib/api-error';

export const maxDuration = 60; // 60s execution limit for large uploads

const MAX_RECEIPT_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MAX_RECEIPT_FILES = 3;

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const items = await readCollection('reimbursements');
    return NextResponse.json(items);
  } catch (err: any) {
    return apiError(err, 'reimbursements-api-get', 500);
  }
}

export async function POST(request: Request) {
  try {
    // Any signed-in member may submit their own expense claim.
    await requireSession(request);
    const item = await request.json();

    const files = Array.isArray(item.receiptFiles) ? item.receiptFiles : [];
    if (files.length > MAX_RECEIPT_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_RECEIPT_FILES} documentation files allowed per claim.` }, { status: 400 });
    }

    const id = item.id || 'reim_' + Date.now();
    item.id = id;

    // Persist each receipt as a real file on disk under data/uploads/ instead of
    // keeping its full base64 payload inline in reimbursements.json.
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (typeof f?.dataUrl === 'string' && f.dataUrl.startsWith('data:')) {
        const approxBytes = Math.floor((f.dataUrl.length * 3) / 4);
        if (approxBytes > MAX_RECEIPT_FILE_BYTES) {
          return NextResponse.json(
            { error: `"${f.name || 'File'}" exceeds the 10 MB per-file limit.` },
            { status: 400 }
          );
        }
        const stored = await saveBase64File('reimbursements', id, i, f.name || 'file', f.dataUrl);
        files[i] = { name: f.name, url: stored.url, storageKey: stored.storageKey, type: f.type };
      }
    }
    item.receiptFiles = files;
    // Keep the legacy single-file fields pointed at the first file's new location
    // rather than an inline base64 payload.
    if (files[0]?.url) {
      item.receiptUrl = files[0].name;
      delete item.receiptData;
    }

    const updated = await mutateCollection('reimbursements', (current) => [item, ...current]);
    const created = updated.find((r: any) => r.id === item.id);

    // Let the Centre Head(s) know a new claim needs their verification —
    // fire-and-log, mirroring the low-stakes tone of the Tasks assignment
    // and Events roster emails rather than the higher-stakes Designs
    // decision-email pattern.
    if (created) {
      try {
        const [members, settings] = await Promise.all([
          readCollection('members'),
          getAccessLevelSettingsServer(),
        ]);
        const approvers = (members as any[]).filter(
          (m) => m.status !== 'Terminated' && m.email && isCentreHead(m, settings)
        );
        for (const approver of approvers) {
          const template = generateReimbursementSubmittedEmailTemplate(
            approver.name,
            created.memberName,
            created.amount,
            created.category
          );
          await dispatchEmail({
            to: approver.email,
            subject: template.subject,
            bodyText: template.bodyText,
            bodyHtml: template.bodyHtml,
            category: 'REIMBURSEMENT',
          });
        }
      } catch (emailErr) {
        console.error('[reimbursements-api] Failed to notify approver of new claim:', emailErr);
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return apiError(err, 'reimbursements-api-post', 400);
  }
}
