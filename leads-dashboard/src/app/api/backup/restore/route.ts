import { NextResponse } from 'next/server';
import { restoreEncryptedBackup } from '@/lib/backup';
import { requireSession } from '@/lib/session';
import { canManageBackup } from '@/lib/permissions-server';
import { apiError } from '@/lib/api-error';

export async function POST(request: Request) {
  try {
    const actor = await requireSession(request);
    if (!canManageBackup(actor)) {
      return NextResponse.json({ error: 'You do not have permission to restore backups.' }, { status: 403 });
    }
    const formData = await request.formData();
    const passphrase = formData.get('passphrase');
    const file = formData.get('file');

    if (!passphrase || typeof passphrase !== 'string') {
      return NextResponse.json({ error: 'Passphrase is required.' }, { status: 400 });
    }
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Backup file is required.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const summary = await restoreEncryptedBackup(buffer, passphrase);
    return NextResponse.json(summary);
  } catch (err: any) {
    return apiError(err, 'backup-restore-api-post', 400);
  }
}
