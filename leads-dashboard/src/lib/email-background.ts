/**
 * email-background.ts — optional blurred picture behind an e-mail.
 *
 * Mail clients don't support CSS `filter: blur()`, so the picture is blurred here on the server into a ready-made JPEG
 * (cached under data/uploads/email-backgrounds-blurred/) and used as an ordinary background image, with a solid colour
 * behind it for clients that block images or ignore CSS backgrounds (e.g. desktop Outlook).
 *
 * Where it comes from, per e-mail:
 *   - the default set in Admin → Settings → Email (EmailSettings.background), unless
 *   - the sender picked 'none', or a custom picture ({ storageKey, blur }) for that one send.
 * Every e-mail goes through dispatchEmail(), which calls applyBackgroundTo() — so the certificate, pass, guest-invite
 * and Email-page mail merges (and the one-off notices) all get it without each generator knowing about it.
 */
import { createHash } from 'crypto';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readStoredFile, saveBase64File } from './file-storage';
import { getAppBaseUrl } from './app-url';

/** Uploaded originals live here; a custom per-send storageKey must too. */
export const EMAIL_BACKGROUND_CATEGORY = 'email-backgrounds';
const BLURRED_CATEGORY = 'email-backgrounds-blurred';
export const MAX_EMAIL_BLUR = 40;
export const DEFAULT_EMAIL_BLUR = 12;
const OUT_WIDTH = 1200;
const OUT_MAX_HEIGHT = 1600;

export interface EmailBackgroundSetting {
  enabled?: boolean;
  storageKey?: string;
  /** Blur radius in pixels (0–40). */
  blur?: number;
}

/** What one send asks for: the saved default, no background, or a specific picture. */
export type EmailBackgroundChoice = 'default' | 'none' | { storageKey: string; blur?: number };

export function clampBlur(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return DEFAULT_EMAIL_BLUR;
  return Math.min(MAX_EMAIL_BLUR, Math.max(0, Math.round(n)));
}

/** True for a storage key of an uploaded e-mail background (so a caller can't point at some other file). */
export function isEmailBackgroundKey(key: unknown): key is string {
  return typeof key === 'string' && key.startsWith(`${EMAIL_BACKGROUND_CATEGORY}/`) && !key.includes('..');
}

/** Validates a per-send background choice that arrived from a browser; anything unrecognised means "use the default". */
export function cleanBackgroundChoice(raw: unknown): EmailBackgroundChoice | undefined {
  if (raw === 'none') return 'none';
  if (raw && typeof raw === 'object' && isEmailBackgroundKey((raw as { storageKey?: unknown }).storageKey)) {
    return { storageKey: (raw as { storageKey: string }).storageKey, blur: clampBlur((raw as { blur?: unknown }).blur) };
  }
  return undefined;
}

const urlCache = new Map<string, string>();

/** Server-relative URL (/api/files/...) of the blurred JPEG for this picture + blur, created on first use. */
export async function getBlurredBackgroundPath(storageKey: string, blur: number): Promise<string | null> {
  if (!isEmailBackgroundKey(storageKey)) return null;
  const radius = clampBlur(blur);
  const hash = createHash('sha1').update(`${storageKey}|${radius}`).digest('hex').slice(0, 20);
  const cached = urlCache.get(hash);
  if (cached) return cached;

  const outKey = `${BLURRED_CATEGORY}/${hash}/0__bg.jpg`;
  try {
    await readStoredFile(outKey); // already made
    const path = `/api/files/${outKey}`;
    urlCache.set(hash, path);
    return path;
  } catch {
    /* not made yet */
  }

  try {
    const img = await loadImage(await readStoredFile(storageKey));
    const scale = OUT_WIDTH / img.width;
    const width = OUT_WIDTH;
    const height = Math.min(OUT_MAX_HEIGHT, Math.max(1, Math.round(img.height * scale)));
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    // Draw slightly larger than the canvas so the blur doesn't fade to transparent at the edges.
    const bleed = radius * 2;
    (ctx as unknown as { filter: string }).filter = radius > 0 ? `blur(${radius}px)` : 'none';
    ctx.drawImage(img, -bleed, -bleed, width + bleed * 2, Math.round(img.height * scale) + bleed * 2);
    const jpeg = canvas.toBuffer('image/jpeg', 80);
    const saved = await saveBase64File(BLURRED_CATEGORY, hash, 0, 'bg.jpg', `data:image/jpeg;base64,${jpeg.toString('base64')}`);
    urlCache.set(hash, saved.url);
    return saved.url;
  } catch (err) {
    console.error('[email-background] Could not build the blurred background:', err);
    return null;
  }
}

/** The absolute URL of the background an e-mail should use, or null for none. */
export async function resolveEmailBackgroundUrl(
  defaults: { background?: EmailBackgroundSetting } | undefined,
  choice: EmailBackgroundChoice | undefined
): Promise<string | null> {
  if (choice === 'none') return null;
  let key: string | undefined;
  let blur: number | undefined;
  if (choice && typeof choice === 'object') {
    key = choice.storageKey;
    blur = choice.blur;
  } else {
    const d = defaults?.background;
    if (!d?.enabled || !d.storageKey) return null;
    key = d.storageKey;
    blur = d.blur;
  }
  if (!key) return null;
  const path = await getBlurredBackgroundPath(key, blur === undefined ? DEFAULT_EMAIL_BLUR : blur);
  return path ? `${getAppBaseUrl()}${path}` : null;
}

const FALLBACK_COLOR = '#f8fafc';

/**
 * Puts `url` behind the whole e-mail: the content is wrapped in a full-width table whose `background` attribute and
 * inline CSS carry the picture (the widest-supported way), with a solid-colour fallback. Idempotent.
 */
export function applyEmailBackground(html: string, url: string): string {
  if (!html || !url || html.includes('data-leads-bg')) return html;
  const safe = url.replace(/["'()<>\s\\]/g, (c) => encodeURIComponent(c));
  const open =
    `<table role="presentation" data-leads-bg="1" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${FALLBACK_COLOR}" background="${safe}" ` +
    `style="width:100%;background-color:${FALLBACK_COLOR};background-image:url('${safe}');background-size:cover;background-position:center;background-repeat:no-repeat;">` +
    `<tr><td align="center" style="padding:24px 12px;">`;
  const close = `</td></tr></table>`;

  if (/<body[^>]*>/i.test(html)) {
    // The master template pads the <body> itself; move that padding inside the picture so the picture reaches the edges.
    const withBody = html.replace(/<body[^>]*>/i, (tag) => `${tag.replace('padding: 24px 12px', 'padding: 0')}${open}`);
    const idx = withBody.toLowerCase().lastIndexOf('</body>');
    return idx === -1 ? `${withBody}${close}` : `${withBody.slice(0, idx)}${close}${withBody.slice(idx)}`;
  }
  return `${open}${html}${close}`;
}
