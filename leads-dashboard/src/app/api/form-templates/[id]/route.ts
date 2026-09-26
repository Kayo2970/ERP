import { NextResponse } from 'next/server';
import { mutateCollection } from '@/lib/server-db';
import { requireSession, ForbiddenError } from '@/lib/session';
import { getAccessLevelSettingsServer, canBuildForms } from '@/lib/permissions-server';
import { apiError } from '@/lib/api-error';
import { initialFormTemplates } from '@/lib/local-data';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireSession(request);
    const settings = await getAccessLevelSettingsServer();
    if (!canBuildForms(actor, settings)) throw new ForbiddenError();
    const { id } = await params;

    // Built-in templates are code-managed (see initialFormTemplates in
    // local-data.ts) — server-db.ts's ensureFeedbackFormTemplateSeeded
    // re-syncs the Feedback Form Template from code on every boot, so a
    // saved edit to a built-in id would appear to work and then silently
    // revert. Refuse it here rather than let that happen quietly.
    if (initialFormTemplates.some(t => t.id === id)) {
      return NextResponse.json({ error: 'Built-in templates cannot be edited.' }, { status: 400 });
    }

    const body = await request.json();
    let found = false;
    const updated = await mutateCollection('formTemplates', (current) => {
      const idx = current.findIndex((t: any) => t.id === id);
      if (idx === -1) return current;
      found = true;
      const next = [...current];
      next[idx] = { ...next[idx], ...body, id };
      return next;
    });
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated.find((t: any) => t.id === id));
  } catch (err: any) {
    return apiError(err, 'form-templates-id-api-patch', 500);
  }
}

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
    return apiError(err, 'form-templates-id-api-delete', 500);
  }
}
