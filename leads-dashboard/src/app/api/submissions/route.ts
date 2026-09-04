import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/api-error';

// GET (listing collected responses) is member-only. POST is deliberately left
// ungated: forms are filled out publicly at src/app/forms/[slug]/page.tsx by
// non-members with no session at all (addSubmission() in local-data.ts even
// logs the actor as "Public Respondent") — this is a genuine public form
// intake endpoint, not an oversight.
export async function GET(request: Request) {
  try {
    await requireSession(request);
    const items = await readCollection('submissions');
    return NextResponse.json(items);
  } catch (err: any) {
    return apiError(err, 'submissions-api-get', 500);
  }
}

export async function POST(request: Request) {
  try {
    const item = await request.json();
    const updated = await mutateCollection('submissions', (current) => [item, ...current]);
    const created = updated.find((s: any) => s.id === item.id);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return apiError(err, 'submissions-api-post', 400);
  }
}
