import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/api-error';
import { buildEmailHtml, type EmailCategory } from '@/lib/email-service';
import { cleanBackgroundChoice } from '@/lib/email-background';

const CATEGORIES = new Set<EmailCategory>(['CERTIFICATE', 'DIRECT_MESSAGE', 'ANNOUNCEMENT', 'GUEST_INVITE', 'SYSTEM']);

/**
 * POST { subject, bodyText, category?, badgeText?, background? } → { html }
 * The finished e-mail exactly as it would be sent (same builder as dispatchEmail), so a send dialog can show a real
 * preview — including the blurred background — before anything goes out. Nothing is sent or stored.
 */
export async function POST(request: Request) {
  try {
    await requireSession(request);
    const body = await request.json();
    const subject = typeof body.subject === 'string' ? body.subject.slice(0, 300) : '';
    const bodyText = typeof body.bodyText === 'string' ? body.bodyText.slice(0, 20000) : '';
    const category: EmailCategory = CATEGORIES.has(body.category) ? body.category : 'DIRECT_MESSAGE';
    const html = await buildEmailHtml({
      to: 'preview@example.com',
      subject,
      bodyText,
      category,
      badgeText: typeof body.badgeText === 'string' ? body.badgeText.slice(0, 80) : undefined,
      background: cleanBackgroundChoice(body.background),
    });
    return NextResponse.json({ html });
  } catch (err: any) {
    return apiError(err, 'email-preview', 500);
  }
}
