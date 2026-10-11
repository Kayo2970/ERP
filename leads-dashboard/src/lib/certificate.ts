/**
 * Event-attendance certificates (server only): per-event template, eligibility, A4 PDF rendering and emailing.
 * One record per pass in the `certificates` collection keeps re-sends idempotent and powers the public verify page.
 * Template files live in their own upload category so the pass-theme retention purge never deletes them.
 */
import { randomBytes } from 'crypto';
import { createCanvas, loadImage, GlobalFonts, SKRSContext2D } from '@napi-rs/canvas';
import { jsPDF } from 'jspdf';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { saveBase64File, readStoredFile, deleteStoredFile } from '@/lib/file-storage';
import { dispatchEmail } from '@/lib/email-service';
import { drawStyledQr } from '@/lib/qr-style';
import { EventItem, EventPassItem, getPassAttendanceSummary, getEffectiveEventStatus, formatEventDateRange } from '@/lib/local-data';

const CATEGORY = 'certificate-templates';
const TEMPLATE_FILE_INDEX = 0;
const BACKGROUND_FILE_INDEX = 1;
const HEX = /^#[0-9a-fA-F]{6}$/;

export interface CertificateTemplate {
  title: string;
  /** @event_name, @event_date and @name are merged in. */
  bodyText: string;
  signatoryName: string;
  signatoryTitle: string;
  textColor: string;
  backgroundKey?: string;
}

export const DEFAULT_CERTIFICATE_TEMPLATE: CertificateTemplate = {
  title: 'Certificate of Participation',
  bodyText: 'has successfully attended @event_name held on @event_date, organised by LEADS Next Gen Centre, RUAS.',
  signatoryName: '',
  signatoryTitle: 'LEADS Next Gen Centre',
  textColor: '#1e293b',
};

export interface CertificateRecord {
  id: string;
  code: string;
  passId: string;
  eventId: string;
  attendeeName: string;
  attendeeEmail: string;
  eventName: string;
  eventDate: string;
  issuedAt: string;
  sentAt?: string;
  status: 'Issued' | 'Sent' | 'Failed';
  error?: string;
}

// ── Template storage ────────────────────────────────────────────────────────────

export async function getCertificateTemplate(eventId: string): Promise<CertificateTemplate> {
  try {
    const buf = await readStoredFile(`${CATEGORY}/${eventId}/${TEMPLATE_FILE_INDEX}__template.json`);
    return { ...DEFAULT_CERTIFICATE_TEMPLATE, ...JSON.parse(buf.toString('utf8')) };
  } catch {
    return { ...DEFAULT_CERTIFICATE_TEMPLATE };
  }
}

/** Saves text settings; `backgroundDataUrl` replaces the artwork, `null` removes it, `undefined` keeps it. */
export async function saveCertificateTemplate(
  eventId: string,
  input: Partial<CertificateTemplate>,
  backgroundDataUrl?: string | null
): Promise<CertificateTemplate> {
  const current = await getCertificateTemplate(eventId);
  const clip = (v: unknown, max: number, fallback: string) => (typeof v === 'string' ? v.trim().slice(0, max) : fallback);
  const next: CertificateTemplate = {
    title: clip(input.title, 80, current.title) || DEFAULT_CERTIFICATE_TEMPLATE.title,
    bodyText: clip(input.bodyText, 400, current.bodyText) || DEFAULT_CERTIFICATE_TEMPLATE.bodyText,
    signatoryName: clip(input.signatoryName, 80, current.signatoryName),
    signatoryTitle: clip(input.signatoryTitle, 80, current.signatoryTitle),
    textColor: typeof input.textColor === 'string' && HEX.test(input.textColor) ? input.textColor : current.textColor,
    backgroundKey: current.backgroundKey,
  };
  if (backgroundDataUrl === null && current.backgroundKey) {
    await deleteStoredFile(current.backgroundKey);
    next.backgroundKey = undefined;
  } else if (typeof backgroundDataUrl === 'string' && backgroundDataUrl) {
    if (!/^data:image\/(png|jpe?g|webp);base64,/i.test(backgroundDataUrl)) throw new Error('Artwork must be a PNG, JPG or WebP image.');
    // Re-encode as a capped JPEG so a huge upload can't bloat every PDF
    const img = await loadImage(Buffer.from(backgroundDataUrl.split(',')[1] || '', 'base64'));
    const scale = Math.min(1, 2480 / Math.max(img.width, img.height));
    const c = createCanvas(Math.max(1, Math.round(img.width * scale)), Math.max(1, Math.round(img.height * scale)));
    const cctx = c.getContext('2d');
    cctx.fillStyle = '#fff';
    cctx.fillRect(0, 0, c.width, c.height);
    cctx.drawImage(img, 0, 0, c.width, c.height);
    if (current.backgroundKey) await deleteStoredFile(current.backgroundKey);
    const saved = await saveBase64File(CATEGORY, eventId, BACKGROUND_FILE_INDEX, 'background.jpg', `data:image/jpeg;base64,${c.toBuffer('image/jpeg', 85).toString('base64')}`);
    next.backgroundKey = saved.storageKey;
  }
  const payload = Buffer.from(JSON.stringify(next)).toString('base64');
  await saveBase64File(CATEGORY, eventId, TEMPLATE_FILE_INDEX, 'template.json', `data:application/json;base64,${payload}`);
  return next;
}

// ── Eligibility ─────────────────────────────────────────────────────────────────

/** Attended = checked in at least once. Needs an email, and not cancelled / held for approval. */
export function isCertificateEligible(pass: EventPassItem): boolean {
  if (pass.status === 'Cancelled' || !pass.attendeeEmail?.trim()) return false;
  if ((pass as any).approvalStatus && (pass as any).approvalStatus !== 'approved') return false;
  return pass.status === 'Checked In' || getPassAttendanceSummary(pass).attended > 0;
}

export function isEventOver(event: EventItem | undefined): boolean {
  return !!event && !event.datesTBD && getEffectiveEventStatus(event) === 'completed';
}

// ── Rendering ───────────────────────────────────────────────────────────────────

const W = 1754;
const H = 1240;
const FONT_FILES: Array<[string, string]> = [
  ['/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf', 'CertSerif'],
  ['/usr/share/fonts/truetype/liberation/LiberationSerif-BoldItalic.ttf', 'CertScript'],
  ['/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf', 'CertSerifFallback'],
];
let fontsReady = false;
function ensureFonts() {
  if (fontsReady) return;
  fontsReady = true;
  for (const [file, family] of FONT_FILES) {
    try {
      GlobalFonts.registerFromPath(file, family); // missing file just throws -> generic serif fallback
    } catch {
      /* fall back to generic serif */
    }
  }
}
const SERIF = "CertSerif, CertSerifFallback, 'Times New Roman', serif";
const SCRIPT = "CertScript, CertSerif, CertSerifFallback, 'Times New Roman', serif";

function fit(ctx: SKRSContext2D, text: string, maxWidth: number, start: number, min: number, family: string, style = ''): number {
  let size = start;
  while (size > min) {
    ctx.font = `${style} ${size}px ${family}`.trim();
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  ctx.font = `${style} ${size}px ${family}`.trim();
  return size;
}

function wrapLines(ctx: SKRSContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function merge(text: string, vars: Record<string, string>): string {
  return text.replace(/@(name|event_name|event_date)\b/gi, (_, k: string) => vars[k.toLowerCase()] ?? '');
}

export async function renderCertificatePng(
  data: { attendeeName: string; eventName: string; eventDate: string; code: string },
  template: CertificateTemplate,
  verifyUrl: string
): Promise<Buffer> {
  ensureFonts();
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const ink = template.textColor;

  ctx.fillStyle = '#fffdf7';
  ctx.fillRect(0, 0, W, H);
  let hasArt = false;
  if (template.backgroundKey) {
    try {
      const art = await loadImage(await readStoredFile(template.backgroundKey));
      const s = Math.max(W / art.width, H / art.height);
      ctx.drawImage(art, (W - art.width * s) / 2, (H - art.height * s) / 2, art.width * s, art.height * s);
      hasArt = true;
    } catch {
      /* fall back to the plain design */
    }
  }
  if (!hasArt) {
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 10;
    ctx.strokeRect(50, 50, W - 100, H - 100);
    ctx.lineWidth = 2;
    ctx.strokeRect(75, 75, W - 150, H - 150);
  }

  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const cx = W / 2;

  fit(ctx, template.title.toUpperCase(), W - 400, 64, 34, SERIF, 'bold');
  ctx.fillText(template.title.toUpperCase(), cx, 330);

  ctx.font = `34px ${SERIF}`;
  ctx.globalAlpha = 0.75;
  ctx.fillText('This is to certify that', cx, 430);
  ctx.globalAlpha = 1;

  fit(ctx, data.attendeeName, W - 400, 118, 52, SCRIPT, 'italic');
  ctx.fillText(data.attendeeName, cx, 575);
  const nameW = Math.min(ctx.measureText(data.attendeeName).width + 80, W - 360);
  ctx.fillRect(cx - nameW / 2, 605, nameW, 3);

  ctx.font = `36px ${SERIF}`;
  const body = merge(template.bodyText, { name: data.attendeeName, event_name: data.eventName, event_date: data.eventDate });
  wrapLines(ctx, body, W - 480).slice(0, 4).forEach((l, i) => ctx.fillText(l, cx, 700 + i * 54));

  // Signatory (bottom left)
  const sx = 420;
  ctx.fillRect(sx - 190, 1025, 380, 2);
  if (template.signatoryName) {
    fit(ctx, template.signatoryName, 380, 36, 22, SERIF, 'bold');
    ctx.fillText(template.signatoryName, sx, 1070);
  }
  if (template.signatoryTitle) {
    fit(ctx, template.signatoryTitle, 380, 28, 18, SERIF);
    ctx.fillText(template.signatoryTitle, sx, 1108);
  }

  // Verify QR + certificate ID (bottom right)
  const qr = 170;
  const qx = W - 420 - qr / 2;
  drawStyledQr(ctx, verifyUrl, qx, 920, qr, { dark: ink, light: '#ffffff', shape: 'square' } as any);
  ctx.font = `22px ${SERIF}`;
  ctx.fillText(`ID ${data.code}`, qx + qr / 2, 1118);
  return canvas.toBuffer('image/png');
}

export function pngToPdf(png: Buffer): Buffer {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.addImage(`data:image/png;base64,${png.toString('base64')}`, 'PNG', 0, 0, 297, 210);
  return Buffer.from(doc.output('arraybuffer'));
}

// ── Records + sending ───────────────────────────────────────────────────────────

export function eventDateLabel(event: EventItem): string {
  return formatEventDateRange(event);
}

export function verifyUrlFor(origin: string, code: string): string {
  return `${origin}/certificate/${code}`;
}

/** Finds or creates the certificate record for a pass (one per pass). */
export async function ensureCertificateRecord(pass: EventPassItem, event: EventItem): Promise<CertificateRecord> {
  let result!: CertificateRecord;
  await mutateCollection<CertificateRecord>('certificates', (current = []) => {
    const found = current.find((c) => c.passId === pass.id);
    if (found) {
      result = found;
      return current;
    }
    const code = randomBytes(9).toString('base64url').replace(/[-_]/g, 'x').toUpperCase();
    result = {
      id: `cert-${Date.now()}-${randomBytes(3).toString('hex')}`,
      code,
      passId: pass.id,
      eventId: pass.eventId,
      attendeeName: pass.attendeeName,
      attendeeEmail: (pass.attendeeEmail || '').trim(),
      eventName: event.title || pass.eventName,
      eventDate: eventDateLabel(event),
      issuedAt: new Date().toISOString(),
      status: 'Issued',
    };
    return [...current, result];
  });
  return result;
}

export async function renderCertificatePdf(rec: CertificateRecord, origin: string): Promise<Buffer> {
  const template = await getCertificateTemplate(rec.eventId);
  const png = await renderCertificatePng(rec, template, verifyUrlFor(origin, rec.code));
  return pngToPdf(png);
}

export async function sendCertificate(
  pass: EventPassItem,
  event: EventItem,
  origin: string,
  to?: string
): Promise<{ ok: boolean; error?: string; record: CertificateRecord }> {
  const rec = await ensureCertificateRecord(pass, event);
  const recipient = (to || pass.attendeeEmail || '').trim();
  try {
    if (!recipient) throw new Error('No email address.');
    const pdf = await renderCertificatePdf(rec, origin);
    const verify = verifyUrlFor(origin, rec.code);
    await dispatchEmail({
      to: recipient,
      subject: `Your certificate — ${rec.eventName}`,
      bodyText: `Dear ${rec.attendeeName},\n\nThank you for attending ${rec.eventName}. Your certificate of participation is attached to this email.\n\nYou can verify it any time at ${verify} (certificate ID ${rec.code}).\n\nWarm regards,\nLEADS Next Gen Centre • RUAS`,
      category: 'CERTIFICATE',
      attachments: [{ filename: `Certificate-${rec.attendeeName.replace(/[^\w]+/g, '_')}.pdf`, content: pdf, contentType: 'application/pdf' }],
    });
    const sentAt = new Date().toISOString();
    await mutateCollection<CertificateRecord>('certificates', (cur = []) => cur.map((c) => (c.id === rec.id ? { ...c, status: 'Sent', sentAt, error: undefined } : c)));
    return { ok: true, record: { ...rec, status: 'Sent', sentAt } };
  } catch (err: any) {
    const error = err?.message || 'Failed to send.';
    await mutateCollection<CertificateRecord>('certificates', (cur = []) => cur.map((c) => (c.id === rec.id ? { ...c, status: 'Failed', error } : c)));
    return { ok: false, error, record: { ...rec, status: 'Failed', error } };
  }
}

export async function findCertificateByCode(code: string): Promise<CertificateRecord | undefined> {
  const all = await readCollection<CertificateRecord>('certificates');
  return all.find((c) => c.code.toLowerCase() === String(code).toLowerCase());
}
