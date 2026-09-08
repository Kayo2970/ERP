import { readCollection } from '@/lib/server-db';

/**
 * Google Wallet credentials (a Cloud service account + Issuer ID from the
 * Google Wallet Business Console). Same "build now, activate later" story
 * as Apple — see docs/wallet-setup.md for the checklist of what to obtain.
 */
export interface GoogleWalletCredentials {
  issuerId: string;
  serviceAccountEmail: string;
  privateKey: string; // PEM, from the service account JSON key's `private_key`
}

async function readStoredWalletSettings(): Promise<any> {
  const rows = await readCollection<any>('walletSettings');
  return rows.find((r) => r.id === 'default') || null;
}

export async function getGoogleWalletCredentials(): Promise<GoogleWalletCredentials | null> {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const saJsonBase64 = process.env.GOOGLE_WALLET_SA_JSON_BASE64;
  if (issuerId && saJsonBase64) {
    try {
      const sa = JSON.parse(Buffer.from(saJsonBase64, 'base64').toString('utf8'));
      if (sa.client_email && sa.private_key) {
        return { issuerId, serviceAccountEmail: sa.client_email, privateKey: sa.private_key };
      }
    } catch {
      // fall through to stored settings
    }
  }

  const stored = await readStoredWalletSettings();
  const google = stored?.google;
  if (google?.issuerId && google?.serviceAccountEmail && google?.privateKey) {
    return google as GoogleWalletCredentials;
  }

  return null;
}

export async function isGoogleWalletConfigured(): Promise<boolean> {
  return (await getGoogleWalletCredentials()) !== null;
}
