const API_BASE = 'https://api.walletwallet.dev';

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
  bio?: string;
  linkedin?: string;
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
 * carries the org's own contact details plus the member's bio/LinkedIn.
 *
 * logoURL/iconURL/wideLogoURL/thumbnailURL are WalletWallet Pro-plan-only
 * fields — harmless to send on a free-tier key, just ignored.
 */
export async function createWalletPass(apiKey: string, member: WalletCardMember, cardUrl: string): Promise<WalletWalletPass> {
  const origin = new URL(cardUrl).origin;
  const logoUrl = `${origin}/images/leads-short-logo.png`;

  const secondaryFields = [] as { label: string; value: string }[];
  if (member.phone) secondaryFields.push({ label: 'Phone Number', value: member.phone });
  if (member.email) secondaryFields.push({ label: 'Email ID', value: member.email });

  const backFields = [
    { label: 'Email ID', value: ORG_EMAIL },
    { label: 'Office Mobile Number', value: ORG_PHONE },
    { label: 'Address', value: ORG_ADDRESS },
  ] as { label: string; value: string; changeMessage?: string }[];
  if (member.bio) backFields.push({ label: 'About', value: member.bio });
  if (member.linkedin) backFields.push({ label: 'LinkedIn', value: member.linkedin });
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
      iconURL: logoUrl,
      wideLogoURL: logoUrl,
      thumbnailURL: logoUrl,
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
