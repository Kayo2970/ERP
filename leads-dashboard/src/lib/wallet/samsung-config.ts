/**
 * Samsung Wallet card issuance requires enrollment in Samsung's Partner
 * Portal, which is invite/business-verification-gated — unlike Apple's
 * self-serve $99/yr Developer Program or Google's open Cloud Console
 * signup, there is no publicly documented self-serve path for an individual
 * developer to issue arbitrary business cards today. See
 * docs/wallet-setup.md for details.
 *
 * This module is a placeholder so wiring up real Samsung Wallet support
 * later is a drop-in: once partner credentials exist, replace the always-
 * false check below with the same env-var-or-walletSettings pattern used by
 * apple-config.ts / google-config.ts, and implement
 * buildSamsungCardTemplate()/signSamsungLink() analogues in a new
 * samsung-pass.ts alongside apple-pkpass.ts and google-pass.ts.
 */
export async function isSamsungWalletConfigured(): Promise<boolean> {
  return false;
}
