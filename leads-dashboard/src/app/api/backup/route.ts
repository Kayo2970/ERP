import { NextResponse } from 'next/server';
import { createEncryptedBackup } from '@/lib/backup';
import { requireSession } from '@/lib/session';
import { canManageBackup } from '@/lib/permissions-server';
import { apiError } from '@/lib/api-error';

export async function POST(request: Request) {
  try {
    const actor = await requireSession(request);
    if (!canManageBackup(actor)) {
      return NextResponse.json({ error: 'You do not have permission to download backups.' }, { status: 403 });
    }
    const { passphrase } = await request.json();
    if (!passphrase || typeof passphrase !== 'string' || passphrase.length < 8) {
      return NextResponse.json({ error: 'A passphrase of at least 8 characters is required.' }, { status: 400 });
    }

    const { buffer, summary } = await createEncryptedBackup(passphrase);
    const stamp = new Date().toISOString().split('T')[0];

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="leads-backup-${stamp}.leadsbackup"`,
        'X-Backup-Collections': String(summary.collectionCount),
        'X-Backup-Files': String(summary.fileCount),
      },
    });
  } catch (err: any) {
    return apiError(err, 'backup-api-post', 500);
  }
}
