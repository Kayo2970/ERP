/** Renders + sends one event-pass email (boarding-pass PNG inline). Shared by /api/email/send and approved dispatch requests. */
import { dispatchEmail } from './email-service';
import { readCollection } from './server-db';
import { renderBoardingPassPng } from './pass-image';
import { getPassTheme } from './pass-theme';
import type { EventPassItem } from './local-data';

export interface PassEmailPayload {
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  passSerial: string;
  category?: string;
  badgeText?: string;
  badgeColor?: string;
}

export async function sendPassEmailFromPayload(p: PassEmailPayload | undefined, origin: string) {
  if (!p || !p.to || !p.subject || !p.bodyText) throw new Error('Pass email request is incomplete.');
  const attachments: { filename: string; content: Buffer; contentType: string; cid: string }[] = [];
  try {
    const passes = await readCollection<EventPassItem>('event_passes');
    const pass = passes.find((x) => x.serialNumber.toLowerCase() === String(p.passSerial).toLowerCase());
    if (pass && pass.status !== 'Cancelled') {
      const png = await renderBoardingPassPng(pass, `${origin}/pass/${pass.serialNumber}`, await getPassTheme(pass.eventId));
      attachments.push({ filename: `${pass.serialNumber}.png`, content: png, contentType: 'image/png', cid: 'leads-pass-image' });
    }
  } catch (err) {
    console.warn('[pass-email-send] Boarding-pass image skipped:', err);
  }
  return dispatchEmail({
    to: p.to,
    subject: p.subject,
    bodyText: p.bodyText,
    bodyHtml: p.bodyHtml,
    badgeText: p.badgeText || 'Official Event Pass',
    badgeColor: p.badgeColor,
    category: (p.category as any) || 'EVENT_INVITATION',
    attachments: attachments.length ? attachments : undefined,
  });
}
