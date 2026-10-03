const API_BASE = 'https://api.walletwallet.dev';

// Production domain the app is deployed at — hardcoded (rather than derived
// from the request) so the wallet pass's logo URLs are stable and always
// resolve, even if this code ever runs from a request with a different
// Host header. If the domain ever changes, update this constant and see
// "If the production domain ever changes" in docs/wallet-setup.md for the
// rest of what needs updating (DNS, env vars, etc.).
//
// Was 'https://leadsnextgencentre.online' — that domain now points at a
// stale, separate deployment (different IPs entirely, confirmed via dig:
// Cloudflare vs. this app's real AWS ELB), left over from before the app
// moved to portal-leads.msruas.ac.in. Every wallet pass generation was
// asking that old, unrelated server for the member's current photo — which
// it never had — so WalletWallet's fetch of iconURL/thumbnailURL failed
// with "iconURL could not be fetched" on every single pass. Pointing this
// at the actual live domain fixes it.
const SITE_ORIGIN = 'https://portal-leads.msruas.ac.in';

// Fixed org-wide details shown on the back of every pass — same for every
// member, so they live here rather than on the Member record. Sourced
// verbatim from the pass design finalized in the WalletWallet dashboard;
// double-check these before relying on them (the office email/phone as
// given look like they may have a stray character — see docs/wallet-setup.md).
const ORG_NAME = 'Leads Next Gen Centre';
const ORG_EMAIL = 'LEADS.NGC.@MSRUAS.AC.IN';
const ORG_PHONE = '+91 804536666';
const ORG_ADDRESS = 'LEADS NEXT GEN CENTRE M. S. Ramaiah University of Applied Sciences is University House, New BEL Road, MSR Nagar, Bengaluru - 560054.';

// Pass branding — pale-blue-on-green design finalized in the WalletWallet
// dashboard (see the "Style" tab there to tweak further).
const COLOR_PRESET = 'green';
const CUSTOM_COLOR = '#ebf9ff';

export interface WalletCardMember {
  name: string;
  designation?: string;
  phone?: string;
  email?: string;
  linkedin?: string;
  // Icon isn't included — Apple/Google Wallet back fields are plain
  // label/value text with no icon slot, so only label+url matter here.
  customLinks?: { label: string; url: string }[];
  photoUrl?: string;
}

export interface WalletWalletPass {
  serialNumber: string;
  /** base64-encoded .pkpass file contents. */
  applePass: string;
  googleSaveUrl: string;
  shareUrl: string;
}

/**
 * Creates a wallet pass (Apple + Google, one call) via WalletWallet
 * (https://walletwallet.dev/docs/) — see src/lib/wallet/walletwallet-config.ts
 * for where the API key comes from.
 *
 * Field layout matches the design finalized in the WalletWallet dashboard:
 * the primary field's LABEL is the member's designation and its VALUE is
 * their name (so the name renders large, with the designation as the small
 * caption above it), phone/email up front as secondary fields, and the back
 * carries the org's own contact details plus the member's LinkedIn.
 *
 * Uses the member's VPS-hosted photo for the pass thumbnail & icon when available.
 */
export async function createWalletPass(apiKey: string, member: WalletCardMember, cardUrl: string): Promise<WalletWalletPass> {
  const logoUrl = `${SITE_ORIGIN}/images/leads-short-logo.png`;
  const memberPhoto = member.photoUrl
    ? (member.photoUrl.startsWith('http') ? member.photoUrl : `${SITE_ORIGIN}${member.photoUrl}`)
    : logoUrl;

  const secondaryFields = [] as { label: string; value: string }[];
  if (member.phone) secondaryFields.push({ label: 'Phone Number', value: member.phone });
  if (member.email) secondaryFields.push({ label: 'Email ID', value: member.email });

  const backFields = [
    { label: 'Email ID', value: ORG_EMAIL },
    { label: 'Office Mobile Number', value: ORG_PHONE },
    { label: 'Address', value: ORG_ADDRESS },
  ] as { label: string; value: string; changeMessage?: string }[];
  if (member.linkedin) backFields.push({ label: 'LinkedIn', value: member.linkedin });
  for (const link of member.customLinks || []) {
    backFields.push({ label: link.label, value: link.url });
  }
  backFields.push({ label: 'Full Card', value: cardUrl });
  // Placeholder field WalletWallet uses to push a notification to already-
  // installed passes when this pass is updated — %@ is filled in by them.
  backFields.push({ label: 'Notifications', value: ' ', changeMessage: '%@' });

  const res = await fetch(`${API_BASE}/api/passes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organizationName: ORG_NAME,
      colorPreset: COLOR_PRESET,
      color: CUSTOM_COLOR,
      logoURL: logoUrl,
      iconURL: memberPhoto,
      wideLogoURL: logoUrl,
      thumbnailURL: memberPhoto,
      barcodeValue: cardUrl,
      barcodeFormat: 'QR',
      primaryFields: [{ label: member.designation || ORG_NAME, value: member.name }],
      secondaryFields,
      backFields,
    }),
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(`WalletWallet pass creation failed: ${detail.error || res.statusText}`);
  }

  return res.json();
}

export interface WalletEventPassData {
  serialNumber: string;
  /** WalletWallet's own serial for an already-created pass; defaults to serialNumber. */
  walletSerial?: string;
  eventName: string;
  eventDate?: string;
  eventVenue?: string;
  attendeeName: string;
  guestCategory?: string;
  roomOrVenue?: string;
  passType: string;
  validityDate?: string;
  validDays?: string[];
  passColor?: string;
  /**
   * Event pass theme. Images are sent to WalletWallet as PUBLIC HTTPS URLs (it fetches and re-hosts them
   * once at creation — same approach as the LEADS logo). Values are storage paths such as
   * "/api/files/pass-themes/<eventId>/2__wallet-<ts>.jpg" or absolute https URLs.
   */
  themeBackgroundUrl?: string;
  themeLogoUrl?: string;
  themeColor?: string;
}

/** Days from now until the pass's last valid day (+1 so it stays valid through that day), 1..3650. */
function expirationDaysFor(eventPass: WalletEventPassData): number | undefined {
  const days = [...(eventPass.validDays || [])].sort();
  const last = days[days.length - 1];
  if (!last) return undefined;
  const ms = new Date(`${last}T23:59:59`).getTime() - Date.now();
  if (!Number.isFinite(ms)) return undefined;
  return Math.min(3650, Math.max(1, Math.ceil(ms / 86_400_000) + 1));
}

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|\[?::1)/i;

/** Public origin WalletWallet's servers can reach (override with WALLET_PUBLIC_ORIGIN; never a private/local host). */
export function walletPublicOrigin(): string {
  const raw = (process.env.WALLET_PUBLIC_ORIGIN || SITE_ORIGIN).replace(/\/+$/, '');
  try {
    return PRIVATE_HOST.test(new URL(raw).hostname) ? '' : raw;
  } catch {
    return '';
  }
}

/** Turn a stored upload path into the absolute public HTTPS URL WalletWallet fetches. Empty when not reachable. */
export function walletImageUrl(pathOrUrl?: string): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https:\/\//i.test(pathOrUrl)) {
    try {
      return PRIVATE_HOST.test(new URL(pathOrUrl).hostname) ? undefined : pathOrUrl;
    } catch {
      return undefined;
    }
  }
  const origin = walletPublicOrigin();
  return origin ? `${origin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}` : undefined;
}

/**
 * Theme/validity fields shared by pass create + update. `color` is the base colour; `backgroundURL` is
 * full-bleed artwork (690×1010 portrait). With a background, iOS 27 switches to Apple's poster layout.
 */
function themeBody(eventPass: WalletEventPassData): Record<string, unknown> {
  const out: Record<string, unknown> = {
    color: eventPass.themeColor || eventPass.passColor || '#0b1526',
  };
  const bg = walletImageUrl(eventPass.themeBackgroundUrl);
  if (bg) out.backgroundURL = bg;
  const logo = walletImageUrl(eventPass.themeLogoUrl);
  if (logo) {
    out.logoURL = logo;
    out.iconURL = logo;
  }
  const exp = expirationDaysFor(eventPass);
  if (exp) out.expirationDays = exp;
  return out;
}

type WalletField = { label: string; value: string; changeMessage?: string };

/**
 * Field layout for an event pass. With a background the pass renders in Apple's iOS 27 poster layout, which
 * only shows: one header field, up to four primary fields and up to two footer fields (secondaryFields are
 * NOT shown), always in white text with light labels. Without a background we keep the classic layout.
 */
function buildEventFields(eventPass: WalletEventPassData, passUrl: string, opts: { live: boolean; notification?: string }) {
  const cm = opts.live ? { changeMessage: '%@' } : {};
  const f = (label: string, value: string): WalletField => ({ label, value, ...cm });
  const venue = eventPass.roomOrVenue || eventPass.eventVenue || 'Main Auditorium';
  const validity = eventPass.validityDate || eventPass.eventDate || '2026';
  const days = eventPass.validDays?.length || 0;
  const poster = Boolean(walletImageUrl(eventPass.themeBackgroundUrl));

  const backFields: WalletField[] = [
    { label: 'Event Name', value: eventPass.eventName },
    { label: 'Pass Serial ID', value: eventPass.serialNumber },
    { label: 'Valid On', value: validity },
    { label: 'Issuing Authority', value: 'LEADS Next Gen Centre • RUAS' },
    { label: 'Access Policy', value: 'One pass, one QR — valid on every day shown. Non-transferable. Present at event check-in.' },
    { label: 'Digital Pass Link', value: passUrl },
    { label: 'Notifications', value: opts.notification ?? (opts.live ? 'Pass details updated.' : ' '), changeMessage: '%@' },
  ];

  if (poster) {
    return {
      headerFields: [f('ACCESS', (eventPass.passType || 'VIP PASS').toUpperCase())],
      primaryFields: [
        f((eventPass.guestCategory || 'GUEST ATTENDEE').toUpperCase(), eventPass.attendeeName),
        f('EVENT', eventPass.eventName),
        f('VENUE', venue),
        f('VALID', validity),
      ],
      footerFields: [
        { label: 'PASS ID', value: eventPass.serialNumber },
        { label: 'ENTRY', value: days > 1 ? `One pass · ${days} days` : 'Scan QR at gate' },
      ],
      // Clear classic-layout fields on live updates (e.g. a theme background was just added)
      ...(opts.live ? { secondaryFields: [] as WalletField[] } : {}),
      backFields,
    };
  }
  return {
    headerFields: [f('ACCESS', (eventPass.passType || 'VIP PASS').toUpperCase())],
    primaryFields: [f((eventPass.guestCategory || 'GUEST ATTENDEE').toUpperCase(), eventPass.attendeeName)],
    secondaryFields: [f('ROOM / VENUE', venue), f('VALIDITY', validity)],
    ...(opts.live ? { footerFields: [] as WalletField[] } : {}),
    backFields,
  };
}

/**
 * Creates an event access pass (Apple Wallet .pkpass + Google Wallet save link)
 * via WalletWallet API matching the 98% pixel-accurate native layout.
 */
export async function createEventWalletPass(
  apiKey: string,
  eventPass: WalletEventPassData,
  passUrl: string
): Promise<WalletWalletPass> {
  const logoUrl = `${SITE_ORIGIN}/card/leads-logo.png`;
  const fields = buildEventFields(eventPass, passUrl, { live: false });

  const res = await fetch(`${API_BASE}/api/passes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organizationName: ORG_NAME,
      logoText: 'LEADS Next Gen Centre',
      // Solid hex color only — WalletWallet's colorPreset field only accepts
      // its fixed preset names (dark/blue/green/red/purple/orange), not "custom".
      // Sending an unrecognized preset value made the API reject every event
      // pass creation call, so we send just the hex `color` field instead.
      logoURL: logoUrl,
      iconURL: logoUrl,
      ...themeBody(eventPass),
      barcodeValue: passUrl,
      barcodeFormat: 'QR',
      barcodeAltText: eventPass.serialNumber,
      ...fields,
    }),
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(`WalletWallet event pass creation failed: ${detail.error || res.statusText}`);
  }

  return res.json();
}

/**
 * Updates an issued event access pass (Apple Wallet + Google Wallet) via WalletWallet API
 * (PUT /api/passes/:serialNumber). Updates fields and pushes live update to attendee's wallet.
 */
export async function updateEventWalletPass(
  apiKey: string,
  eventPass: WalletEventPassData,
  passUrl: string,
  notificationMsg?: string
): Promise<{ success: boolean; detail?: any }> {
  const fields = buildEventFields(eventPass, passUrl, { live: true, notification: notificationMsg });

  const res = await fetch(`${API_BASE}/api/passes/${encodeURIComponent(eventPass.walletSerial || eventPass.serialNumber)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...themeBody(eventPass),
      ...fields,
    }),
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(`Wallet pass update failed: ${detail.error || res.statusText}`);
  }

  const data = await res.json().catch(() => ({}));
  return { success: true, detail: data };
}

/**
 * Pushes a live lock-screen update / notification to an issued Apple & Google Wallet pass
 * via WalletWallet PUT /api/passes/:serialNumber.
 */
export async function updateEventPassPushNotification(
  apiKey: string,
  serialNumber: string,
  message: string,
  additionalFields?: { [key: string]: string }
): Promise<{ success: boolean; detail?: any }> {
  const updatePayload: any = {
    backFields: [
      { label: 'Notifications', value: message, changeMessage: '%@' },
    ],
  };

  if (additionalFields?.roomOrVenue) {
    updatePayload.secondaryFields = [
      { label: 'ROOM / VENUE', value: additionalFields.roomOrVenue, changeMessage: '%@' },
    ];
  }

  const res = await fetch(`${API_BASE}/api/passes/${encodeURIComponent(serialNumber)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatePayload),
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(`Push notification update failed: ${detail.error || res.statusText}`);
  }

  const data = await res.json().catch(() => ({}));
  return { success: true, detail: data };
}




/**
 * Revokes an issued event pass on every device (DELETE /api/passes/:serialNumber).
 * A 404 means it was never issued / already revoked, which is fine.
 */
export async function revokeEventWalletPass(apiKey: string, serialNumber: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/passes/${encodeURIComponent(serialNumber)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok && res.status !== 404) {
    const detail = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(`WalletWallet pass revoke failed: ${detail.error || res.statusText}`);
  }
}
