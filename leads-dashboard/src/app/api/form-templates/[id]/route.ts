import { NextResponse } from 'next/server';
import { mutateCollection } from '@/lib/server-db';
import { requireSession, sessionErrorStatus, ForbiddenError } from '@/lib/session';
import { getAccessLevelSettingsServer, canBuildForms } from '@/lib/permissions-server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireSession(request);
    const settings = await getAccessLevelSettingsServer();
    if (!canBuildForms(actor, settings)) throw new ForbiddenError();
    const { id } = await params;
    let found = false;
    await mutateCollection('formTemplates', (current) => {
      const filtered = current.filter((t: any) => t.id !== id);
      found = filtered.length < current.length;
      return filtered;
    });
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    return NextResponse.json({ error: err.message }, { status: status || 500 });
  }
}
