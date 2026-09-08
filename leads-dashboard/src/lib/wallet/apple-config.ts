import { readCollection } from '@/lib/server-db';

/**
 * Apple Wallet credentials (Pass Type ID certificate + WWDR intermediate
 * cert). Nothing here works without a real Apple Developer Program
 * enrollment ($99/yr) — see the "What you need from Apple" checklist in
 * docs/wallet-setup.md. Until that's supplied, isAppleWalletConfigured()
 * returns false and the public card page hides the Apple Wallet button
 * instead of ever offering a dead link.
 *
 * Credentials can come from either env vars (for a one-time server-level
 * setup) or the `walletSettings` collection (so a Super User can paste them
 * in from Settings without a redeploy) — env vars win if both are present.
 */
export interface AppleWalletCredentials {
  /** Base64-encoded .p12 (Pass Type ID certificate + private key) contents. */
  p12Base64: string;
  p12Password: string;
  /** Base64-encoded Apple WWDR intermediate certificate (PEM). */
  wwdrPemBase64: string;
  teamIdentifier: string;
  passTypeIdentifier: string;
}

async function readStoredWalletSettings(): Promise<any> {
  const rows = await readCollection<any>('walletSettings');
  return rows.find((r) => r.id === 'default') || null;
}

export async function getAppleWalletCredentials(): Promise<AppleWalletCredentials | null> {
  const envCreds: Partial<AppleWalletCredentials> = {
    p12Base64: process.env.APPLE_PASS_P12_BASE64,
    p12Password: process.env.APPLE_PASS_P12_PASSWORD,
    wwdrPemBase64: process.env.APPLE_WWDR_PEM_BASE64,
    teamIdentifier: process.env.APPLE_TEAM_ID,
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID,
  };
  if (envCreds.p12Base64 && envCreds.p12Password && envCreds.wwdrPemBase64 && envCreds.teamIdentifier && envCreds.passTypeIdentifier) {
    return envCreds as AppleWalletCredentials;
  }

  const stored = await readStoredWalletSettings();
  const apple = stored?.apple;
  if (apple?.p12Base64 && apple?.p12Password && apple?.wwdrPemBase64 && apple?.teamIdentifier && apple?.passTypeIdentifier) {
    return apple as AppleWalletCredentials;
  }

  return null;
}

export async function isAppleWalletConfigured(): Promise<boolean> {
  return (await getAppleWalletCredentials()) !== null;
}
