const API_BASE = 'https://api.walletwallet.dev';

export interface WalletCardMember {
  name: string;
  designation?: string;
  phone?: string;
  email?: string;
  bio?: string;
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
 * for where the API key comes from. `colorPreset: 'dark'` matches the ERP's
 * own dark navy theme (src/app/globals.css) without needing the Pro-only
 * custom-color fields.
 */
export async function createWalletPass(apiKey: string, member: WalletCardMember, cardUrl: string): Promise<WalletWalletPass> {
  const primaryFields = [] as { label: string; value: string }[];
  if (member.designation) primaryFields.push({ label: 'Designation', value: member.designation });
  if (member.phone) primaryFields.push({ label: 'Phone', value: member.phone });
  if (member.email) primaryFields.push({ label: 'Email', value: member.email });
  if (member.bio) primaryFields.push({ label: 'About', value: member.bio });

  const res = await fetch(`${API_BASE}/api/passes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: member.name,
      organizationName: 'LEADS Next Gen Centre',
      colorPreset: 'dark',
      barcodeValue: cardUrl,
      barcodeFormat: 'QR',
      primaryFields,
    }),
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(`WalletWallet pass creation failed: ${detail.error || res.statusText}`);
  }

  return res.json();
}
