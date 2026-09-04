import { NextResponse } from 'next/server';
import { restoreEncryptedBackup, InvalidPassphraseError } from '@/lib/backup';
import { requireSession, sessionErrorStatus } from '@/lib/session';
import { canManageBackup } from '@/lib/permissions-server';

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
    const status = sessionErrorStatus(err);
    if (status) return NextResponse.json({ error: err.message }, { status });
    if (err instanceof InvalidPassphraseError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || 'Failed to restore backup.' }, { status: 500 });
  }
}
