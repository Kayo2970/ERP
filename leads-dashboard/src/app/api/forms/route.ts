import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { requireSession, ForbiddenError } from '@/lib/session';
import { getAccessLevelSettingsServer, canBuildForms } from '@/lib/permissions-server';
import { apiError } from '@/lib/api-error';

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const items = await readCollection('forms');
    return NextResponse.json(items);
  } catch (err: any) {
    return apiError(err, 'forms-api-get', 500);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSession(request);
    const settings = await getAccessLevelSettingsServer();
    if (!canBuildForms(actor, settings)) throw new ForbiddenError();
    const item = await request.json();
    const updated = await mutateCollection('forms', (current) => {
      if (item.slug && current.some((f: any) => f.slug?.toLowerCase() === item.slug?.toLowerCase())) {
        throw new Error(`A form with slug "${item.slug}" already exists`);
      }
      return [item, ...current];
    });
    const created = updated.find((f: any) => f.id === item.id);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return apiError(err, 'forms-api-post', 400);
  }
}
