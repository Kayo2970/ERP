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
import { registerCustomFonts } from '@/lib/certificate-fonts';
import { customFamily } from '@/lib/certificate-fonts';
import { CERT_W, CERT_H, CERT_FONT_OPTIONS, CertBox, CertLayout, DEFAULT_CERT_LAYOUT, normalizeLayout, isCustomFont } from '@/lib/certificate-layout';
import { EventItem, EventPassItem, getPassAttendanceSummary, getEffectiveEventStatus, formatEventDateRange } from '@/lib/local-data';

const CATEGORY = 'certificate-templates';
const TEMPLATE_FILE_INDEX = 0;
const BACKGROUND_FILE_INDEX = 1;
const HEX = /^#[0-9a-fA-F]{6}$/;

export interface CertificateTemplate {
  title: string;
  /** Line printed above the attendee's name. */
  introText: string;
  /** @event_name, @event_date and @name are merged in. */
  bodyText: string;
  signatoryName: string;
  signatoryTitle: string;
  /** Default ink; a box with its own colour overrides it. */
  textColor: string;
  /** Position, size and font of every text box (name, content, heading, ...). */
  layout: CertLayout;
  backgroundKey?: string;
}

export const DEFAULT_CERTIFICATE_TEMPLATE: CertificateTemplate = {
  title: 'Certificate of Participation',
  introText: 'This is to certify that',
  bodyText: 'has successfully attended @event_name held on @event_date, organised by LEADS Next Gen Centre, RUAS.',
  signatoryName: '',
  signatoryTitle: 'LEADS Next Gen Centre',
  textColor: '#1e293b',
  layout: DEFAULT_CERT_LAYOUT,
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
    const stored = JSON.parse(buf.toString('utf8'));
    return { ...DEFAULT_CERTIFICATE_TEMPLATE, ...stored, layout: normalizeLayout(stored.layout) };
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
    introText: input.introText === undefined ? current.introText : clip(input.introText, 120, current.introText),
    bodyText: clip(input.bodyText, 400, current.bodyText) || DEFAULT_CERTIFICATE_TEMPLATE.bodyText,
    signatoryName: clip(input.signatoryName, 80, current.signatoryName),
    signatoryTitle: clip(input.signatoryTitle, 80, current.signatoryTitle),
    textColor: typeof input.textColor === 'string' && HEX.test(input.textColor) ? input.textColor : current.textColor,
    layout: input.layout === undefined ? current.layout : normalizeLayout(input.layout),
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

const W = CERT_W;
const H = CERT_H;
const FONT_FILES: Array<[string, string]> = [
  ['/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf', 'CertSerif'],
  ['/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf', 'CertSerif'],
  ['/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf', 'CertSerif'],
  ['/usr/share/fonts/truetype/liberation/LiberationSerif-BoldItalic.ttf', 'CertSerif'],
  ['/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf', 'CertSans'],
  ['/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf', 'CertSans'],
  ['/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf', 'CertSans'],
  ['/usr/share/fonts/truetype/liberation/LiberationSans-BoldItalic.ttf', 'CertSans'],
  ['/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf', 'CertMono'],
  ['/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf', 'CertMono'],
  ['/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf', 'CertSerifFallback'],
  ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'CertDejaVu'],
  ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'CertDejaVu'],
];
let fontsReady = false;
function ensureFonts() {
  if (fontsReady) return;
  fontsReady = true;
  for (const [file, family] of FONT_FILES) {
    try {
      GlobalFonts.registerFromPath(file, family); // missing file just throws -> generic fallback
    } catch {
      /* fall back to generic font */
    }
  }
}

function fontCss(box: CertBox, size: number): string {
  const fam = isCustomFont(box.fontFamily)
    ? `${customFamily(box.fontFamily.slice(7))}, ${CERT_FONT_OPTIONS[0].css}`
    : (CERT_FONT_OPTIONS.find((f) => f.id === box.fontFamily) || CERT_FONT_OPTIONS[0]).css;
  return `${box.italic ? 'italic ' : ''}${box.bold ? 'bold ' : ''}${size}px ${fam}`;
}

/** Breaks one over-wide word into pieces that fit. */
function breakWord(ctx: SKRSContext2D, word: string, maxWidth: number): string[] {
  const parts: string[] = [];
  let rest = word;
  while (rest.length > 1 && ctx.measureText(rest).width > maxWidth) {
    let cut = rest.length - 1;
    while (cut > 1 && ctx.measureText(rest.slice(0, cut)).width > maxWidth) cut--;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  parts.push(rest);
  return parts;
}

function wrapLines(ctx: SKRSContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split(/\r?\n/)) {
    let line = '';
    for (const raw of para.split(/\s+/).filter(Boolean)) {
      const pieces = ctx.measureText(raw).width > maxWidth ? breakWord(ctx, raw, maxWidth) : [raw];
      pieces.forEach((word, i) => {
        const test = line && i === 0 ? `${line} ${word}` : word;
        if (line && ctx.measureText(test).width > maxWidth) {
          lines.push(line);
          line = word;
        } else if (i > 0 && line) {
          lines.push(line);
          line = word;
        } else line = test;
      });
    }
    lines.push(line);
  }
  return lines;
}

/**
 * Draws `text` inside the box: wraps to the box width, optionally shrinks until it fits the box height / line limit,
 * aligns it, and clips anything that still overflows. Returns the drawn size and block bounds.
 */
function drawTextBox(ctx: SKRSContext2D, text: string, box: CertBox, fallbackColor: string) {
  const bx = (box.x / 100) * W;
  const by = (box.y / 100) * H;
  const bw = (box.w / 100) * W;
  const bh = (box.h / 100) * H;
  const LH = 1.3;
  let size = box.fontSize;
  let lines: string[] = [];
  const layoutAt = (s: number) => {
    ctx.font = fontCss(box, s);
    lines = wrapLines(ctx, text, bw);
    if (box.maxLines > 0 && lines.length > box.maxLines) {
      lines = lines.slice(0, box.maxLines);
      return false;
    }
    return lines.length * s * LH <= bh + 0.5;
  };
  let fits = layoutAt(size);
  if (box.autoFit) {
    while (!fits && size > 8) {
      size -= 2;
      fits = layoutAt(size);
    }
    if (!fits) layoutAt(size);
  }
  ctx.font = fontCss(box, size);
  const lineH = size * LH;
  const blockH = lines.length * lineH;
  const top = box.valign === 'top' ? by : box.valign === 'bottom' ? by + bh - blockH : by + (bh - blockH) / 2;
  const ax = box.align === 'left' ? bx : box.align === 'right' ? bx + bw : bx + bw / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(bx, by, bw, bh);
  ctx.clip();
  ctx.fillStyle = box.color || fallbackColor;
  ctx.globalAlpha = box.opacity;
  ctx.textAlign = box.align;
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, ax, top + lineH * (i + 0.5)));
  if (box.underline && lines.length) {
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const w = Math.min(widest + 80, bw);
    const ux = box.align === 'left' ? bx : box.align === 'right' ? bx + bw - w : bx + (bw - w) / 2;
    ctx.fillRect(ux, Math.min(top + blockH + 2, by + bh - 3), w, 3);
  }
  ctx.restore();
  return { size, top, blockH, bx, by, bw, bh };
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
  await registerCustomFonts();
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const ink = template.textColor;
  const L = template.layout;

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

  const vars = { name: data.attendeeName, event_name: data.eventName, event_date: data.eventDate };
  if (L.title.enabled) drawTextBox(ctx, merge(template.title, vars).toUpperCase(), L.title, ink);
  if (L.intro.enabled && template.introText) drawTextBox(ctx, merge(template.introText, vars), L.intro, ink);
  if (L.name.enabled) drawTextBox(ctx, data.attendeeName, { ...L.name, align: 'center', valign: 'middle' }, ink);
  if (L.body.enabled) drawTextBox(ctx, merge(template.bodyText, vars), L.body, ink);

  // Signatory: a rule with the name and designation under it
  if (L.signatory.enabled) {
    const sg = L.signatory;
    const sx = (sg.x / 100) * W;
    const sy = (sg.y / 100) * H;
    const sw = (sg.w / 100) * W;
    const sh = (sg.h / 100) * H;
    ctx.fillStyle = sg.color || ink;
    ctx.fillRect(sx, sy, sw, 2);
    const nameH = sh * 0.55;
    if (template.signatoryName) drawTextBox(ctx, template.signatoryName, { ...sg, y: ((sy + 8) / H) * 100, h: (nameH / H) * 100, valign: 'middle' }, ink);
    if (template.signatoryTitle) {
      drawTextBox(ctx, template.signatoryTitle, { ...sg, bold: false, fontSize: Math.round(sg.fontSize * 0.78), y: ((sy + 8 + nameH) / H) * 100, h: ((sh - nameH - 8) / H) * 100, valign: 'middle' }, ink);
    }
  }

  // Verify QR + certificate ID
  if (L.qr.enabled) {
    const q = L.qr;
    const qr = (q.w / 100) * W;
    const qx = (q.x / 100) * W;
    const qy = (q.y / 100) * H;
    drawStyledQr(ctx, verifyUrl, qx, qy, qr, { dark: q.color || ink, light: '#ffffff', shape: 'square' } as any);
    drawTextBox(ctx, `ID ${data.code}`, { ...q, x: q.x - 2, w: q.w + 4, y: ((qy + qr + 4) / H) * 100, h: (Math.max(24, q.fontSize * 1.6) / H) * 100, align: 'center', valign: 'top', maxLines: 1 }, ink);
  }
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
