import { NextResponse } from 'next/server';
import { readCollection } from '@/lib/server-db';
import { apiError } from '@/lib/api-error';
import { formatEventDateRange } from '@/lib/local-data';

/**
 * Deliberately unauthenticated — this is what src/app/forms/[slug]/page.tsx
 * calls to resolve a public form for a respondent who scanned its QR code
 * (or opened its shared link) and has never logged into the dashboard, so
 * has no session to call the member-only /api/data poll with. Mirrors
 * POST /api/submissions, which is intentionally ungated for the exact same
 * reason (see that route's comment) — the read side needs the same public
 * access the write side already has, or an anonymous respondent can submit
 * a response to a form they were never actually able to load.
 *
 * Returns only the fields the public fill-out page needs to render and
 * submit the form — never approval bookkeeping, submitter contact info, or
 * any other internal metadata that lives on the full PublicFormItem record.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const forms = await readCollection<any>('forms');
    const match = forms.find((f: any) => typeof f.slug === 'string' && f.slug.toLowerCase() === slug.toLowerCase());

    // Same visibility rule the dashboard's own form list uses: a form that's
    // never been approved (still pending, or was rejected) has no live
    // public link yet.
    if (!match || match.approvalStatus === 'pending_create' || match.approvalStatus === 'rejected') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { id, slug: formSlug, title, description, fields, eventName, sourceTemplateId } = match;

    // Live details of the linked event (so "default = the event's name/date/venue" follows renames/reschedules)
    let eventInfo: { name?: string; date?: string; venue?: string } | undefined;
    if (match.eventId) {
      const events = await readCollection<any>('events');
      const ev = events.find((e: any) => e.id === match.eventId);
      if (ev) {
        eventInfo = {
          name: ev.title,
          date: ev.datesTBD ? undefined : formatEventDateRange(ev),
          venue: ev.location || undefined,
        };
      }
    }
    return NextResponse.json({ id, slug: formSlug, title, description, fields, eventName, sourceTemplateId, eventInfo });
  } catch (err: any) {
    return apiError(err, 'public-forms-slug-api-get', 500);
  }
}
