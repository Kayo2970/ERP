/**
 * Renders a horizontal boarding-pass style PNG for an event pass (QR + details + the event's
 * themed background). Used inline in invitation emails and by /api/pass/[serial]/image.
 */
import path from 'path';
import { createCanvas, loadImage, GlobalFonts, SKRSContext2D } from '@napi-rs/canvas';
import QRCode from 'qrcode';
import { readStoredFile } from '@/lib/file-storage';
import {
  EventPassItem,
  PassTheme,
  DEFAULT_PASS_THEME,
  getPassValidDays,
  formatValidDaysLabel,
} from '@/lib/local-data';

let fontReady = false;
function ensureFont(): string {
  if (!fontReady) {
    fontReady = true;
    try {
      // Next.js ships Geist with its OG renderer — a safe, always-present font on any deploy
      GlobalFonts.registerFromPath(
        path.join(process.cwd(), 'node_modules', 'next', 'dist', 'compiled', '@vercel', 'og', 'Geist-Regular.ttf'),
        'PassSans'
      );
    } catch {
      /* fall back to system fonts */
    }
  }
  return 'PassSans, DejaVu Sans, Arial, sans-serif';
}

const W = 1200;
const H = 460;
const STUB_X = 890;

function roundRect(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx: SKRSContext2D, text: string, maxWidth: number, startSize: number, minSize: number, weight = ''): number {
  let size = startSize;
  const fam = ensureFont();
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${fam}`.trim();
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  ctx.font = `${weight} ${size}px ${fam}`.trim();
  return size;
}

function truncate(ctx: SKRSContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

export async function renderBoardingPassPng(
  pass: EventPassItem,
  passUrl: string,
  theme: PassTheme = {}
): Promise<Buffer> {
  const fam = ensureFont();
  const bg = theme.backgroundColor || pass.passColor || DEFAULT_PASS_THEME.backgroundColor;
  const fg = pass.textColor || theme.foregroundColor || DEFAULT_PASS_THEME.foregroundColor;
  const label = pass.labelColor || theme.labelColor || DEFAULT_PASS_THEME.labelColor;
  const overlay = typeof theme.overlay === 'number' ? theme.overlay : DEFAULT_PASS_THEME.overlay;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Outer margin (opaque so it looks right in dark/light mail clients)
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, W, H);

  const x0 = 20, y0 = 20, w = W - 40, h = H - 40;
  ctx.save();
  roundRect(ctx, x0, y0, w, h, 28);
  ctx.clip();

  // Background: artwork (cover-fit) or solid/gradient colour
  ctx.fillStyle = bg;
  ctx.fillRect(x0, y0, w, h);
  if (theme.backgroundKey) {
    try {
      const art = await loadImage(await readStoredFile(theme.backgroundKey));
      const s = Math.max(w / art.width, h / art.height);
      const dw = art.width * s, dh = art.height * s;
      ctx.drawImage(art, x0 + (w - dw) / 2, y0 + (h - dh) / 2, dw, dh);
    } catch {
      /* keep the colour */
    }
  } else {
    const g = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
    g.addColorStop(0, bg);
    g.addColorStop(1, '#030712');
    ctx.fillStyle = g;
    ctx.fillRect(x0, y0, w, h);
  }
  ctx.fillStyle = `rgba(0,0,0,${overlay})`;
  ctx.fillRect(x0, y0, w, h);

  // Logo + brand header
  let textX = 70;
  if (theme.logoKey) {
    try {
      const logo = await loadImage(await readStoredFile(theme.logoKey));
      const lh = 56, lw = (logo.width / logo.height) * lh;
      ctx.drawImage(logo, 70, 52, Math.min(lw, 160), lh);
      textX = 70 + Math.min(lw, 160) + 18;
    } catch {
      /* no logo */
    }
  }
  ctx.fillStyle = label;
  ctx.font = `bold 20px ${fam}`;
  ctx.fillText('LEADS NEXT GEN CENTRE  •  RUAS', textX, 78);
  ctx.fillStyle = label;
  ctx.font = `16px ${fam}`;
  ctx.fillText('OFFICIAL EVENT PASS', textX, 102);

  const maxMain = STUB_X - 70 - 30;

  // Event name
  ctx.fillStyle = fg;
  fitText(ctx, pass.eventName, maxMain, 44, 26, 'bold');
  ctx.fillText(truncate(ctx, pass.eventName, maxMain), 70, 168);

  // Attendee
  ctx.fillStyle = label;
  ctx.font = `15px ${fam}`;
  ctx.fillText((pass.guestCategory || 'GUEST').toString().toUpperCase(), 70, 218);
  ctx.fillStyle = fg;
  fitText(ctx, pass.attendeeName, maxMain, 40, 24, 'bold');
  ctx.fillText(truncate(ctx, pass.attendeeName, maxMain), 70, 262);

  // Field grid
  const validDays = getPassValidDays(pass);
  const validity = validDays.length > 0 ? formatValidDaysLabel(validDays) : pass.validityDate || pass.eventDate || '';
  const cells: Array<[string, string]> = [
    ['PASS TYPE', String(pass.passType)],
    ['VENUE', pass.roomOrVenue || pass.eventVenue || 'Main Auditorium'],
    ['VALID', validity],
  ];
  const colW = maxMain / 3;
  cells.forEach(([k, v], i) => {
    const cx = 70 + i * colW;
    ctx.fillStyle = label;
    ctx.font = `14px ${fam}`;
    ctx.fillText(k, cx, 330);
    ctx.fillStyle = fg;
    fitText(ctx, v, colW - 16, 24, 15, 'bold');
    ctx.fillText(truncate(ctx, v, colW - 16), cx, 362);
  });
  if (validDays.length > 1) {
    ctx.fillStyle = label;
    ctx.font = `15px ${fam}`;
    ctx.fillText(`One pass · one QR · valid on ${validDays.length} days`, 70, 408);
  }

  // Stub (white) with QR
  ctx.fillStyle = 'rgba(255,255,255,0.97)';
  ctx.fillRect(STUB_X, y0, x0 + w - STUB_X, h);
  const qrBuf = await QRCode.toBuffer(passUrl, { margin: 1, width: 300, errorCorrectionLevel: 'H' });
  const qr = await loadImage(qrBuf);
  const qrSize = 220;
  const stubW = x0 + w - STUB_X;
  const qx = STUB_X + (stubW - qrSize) / 2;
  ctx.drawImage(qr, qx, 70, qrSize, qrSize);
  ctx.fillStyle = '#0f172a';
  ctx.font = `bold 17px ${fam}`;
  ctx.textAlign = 'center';
  ctx.fillText('SCAN AT ENTRY', STUB_X + stubW / 2, 330);
  ctx.font = `14px ${fam}`;
  ctx.fillStyle = '#475569';
  ctx.fillText(pass.serialNumber, STUB_X + stubW / 2, 358);
  ctx.textAlign = 'left';

  // Perforation + notches
  ctx.strokeStyle = 'rgba(15,23,42,0.35)';
  ctx.setLineDash([8, 8]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(STUB_X, y0 + 24);
  ctx.lineTo(STUB_X, y0 + h - 24);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  ctx.fillStyle = '#e2e8f0';
  for (const cy of [y0, y0 + h]) {
    ctx.beginPath();
    ctx.arc(STUB_X, cy, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toBuffer('image/png');
}
