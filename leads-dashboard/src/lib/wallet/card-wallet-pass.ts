import crypto from 'crypto';
import { mutateCollection } from '@/lib/server-db';
import { saveBase64File, deleteStoredFile } from '@/lib/file-storage';
import { effectiveCardDesignation } from '@/lib/member-guard';
import { createWalletPass } from './walletwallet-client';

const RATE_LIMIT_WINDOW_MS = 15 * 24 * 60 * 60 * 1000; // 15 days
const RATE_LIMIT_MAX_GENERATIONS = 2;

export class WalletPassRateLimitError extends Error {
  retryAt: string;
  constructor(retryAt: string) {
    super(`Wallet pass generation limit reached (${RATE_LIMIT_MAX_GENERATIONS} per 15 days). Try again after ${retryAt}.`);
    this.retryAt = retryAt;
  }
}

/**
 * Caches the WalletWallet-issued pass on the member record so a repeat visit
 * to the card page doesn't burn API quota re-creating an identical pass —
 * only regenerated when the card's own content actually changed.
 *
 * ponytail: WalletWallet's PUT /api/passes/{serial} would push a live update
 * to already-installed devices, but its response doesn't return fresh pass
 * bytes — so on an edit this always creates a brand-new pass (new serial)
 * rather than updating the existing one in place. Correct for a first-time
 * install, but a member who edited their card after someone already added
 * the old version to their wallet won't get that person's pass auto-updated.
 * Upgrade path: switch to PUT once/if WalletWallet's update response
 * includes the regenerated pass bytes.
 */
function contentHashFor(member: any, cardUrl: string): string {
  const payload = JSON.stringify({
    name: member.name,
    designation: effectiveCardDesignation(member),
    phone: member.cardPhone || '',
    email: member.email || '',
    linkedin: member.cardSocials?.linkedin || '',
    photoUrl: member.cardPhotoUrl || member.avatarUrl || '',
    cardUrl,
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/** Generation timestamps within the current rate-limit window (oldest first). */
function recentGenerations(member: any): string[] {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
  return ((member.cardPassGenerations as string[]) || []).filter((iso) => new Date(iso).getTime() > cutoff);
}

/**
 * Every non-Super-User member is limited to RATE_LIMIT_MAX_GENERATIONS
 * actual WalletWallet API calls per rolling 15-day window — a cache hit
 * (unchanged card content) never counts against this, only a real
 * regeneration does. Super Users (tier 1) are exempt.
 */
export function checkWalletPassRateLimit(member: any): void {
  if (member.tier === 1) return;
  const recent = recentGenerations(member);
  if (recent.length < RATE_LIMIT_MAX_GENERATIONS) return;
  const oldest = new Date(recent[0]).getTime();
  const retryAt = new Date(oldest + RATE_LIMIT_WINDOW_MS).toISOString();
  throw new WalletPassRateLimitError(retryAt);
}

interface CachedWalletPass {
  appleUrl: string;
  googleSaveUrl: string;
}

/**
 * Cache-only lookup — never calls WalletWallet's API, never touches the
 * rate limit, just returns whatever is already sitting on this VPS's disk
 * (or null if nothing's been generated for this member yet). Used by the
 * Visiting Card page's own Live Preview so a member clicking around their
 * own draft can never itself burn an API call or count against their
 * quota — only a real Save/Publish (via getOrCreateWalletPass) does that.
 */
export function getCachedWalletPass(member: any): CachedWalletPass | null {
  if (!member.cardPassAppleUrl || !member.cardPassGoogleSaveUrl) return null;
  return { appleUrl: member.cardPassAppleUrl, googleSaveUrl: member.cardPassGoogleSaveUrl };
}

export async function getOrCreateWalletPass(apiKey: string, member: any, cardUrl: string): Promise<CachedWalletPass> {
  const hash = contentHashFor(member, cardUrl);

  if (member.cardPassContentHash === hash && member.cardPassAppleUrl && member.cardPassGoogleSaveUrl) {
    return { appleUrl: member.cardPassAppleUrl, googleSaveUrl: member.cardPassGoogleSaveUrl };
  }

  // A real regeneration is about to happen — enforce the per-member quota
  // before spending an API call.
  checkWalletPassRateLimit(member);

  const pass = await createWalletPass(
    apiKey,
    {
      name: member.name,
      designation: effectiveCardDesignation(member),
      phone: member.cardPhone,
      email: member.email,
      linkedin: member.cardSocials?.linkedin,
      photoUrl: member.cardPhotoUrl || member.avatarUrl,
    },
    cardUrl
  );

  const stored = await saveBase64File(
    'members',
    member.id,
    2, // 0 = avatar, 1 = card photo, 2 = wallet pass — see members/[id]/route.ts
    `${member.cardSlug}.pkpass`,
    `data:application/vnd.apple.pkpass;base64,${pass.applePass}`
  );

  let previousStorageKey: string | undefined;
  await mutateCollection('members', (current: any[]) => {
    const idx = current.findIndex((m) => m.id === member.id);
    if (idx === -1) return current;
    const next = [...current];
    if (next[idx].cardPassAppleStorageKey && next[idx].cardPassAppleStorageKey !== stored.storageKey) {
      previousStorageKey = next[idx].cardPassAppleStorageKey;
    }
    const generations = [...recentGenerations(next[idx]), new Date().toISOString()];
    next[idx] = {
      ...next[idx],
      cardPassSerial: pass.serialNumber,
      cardPassContentHash: hash,
      cardPassAppleUrl: stored.url,
      cardPassAppleStorageKey: stored.storageKey,
      cardPassGoogleSaveUrl: pass.googleSaveUrl,
      cardPassGenerations: generations,
    };
    return next;
  });
  if (previousStorageKey) {
    await deleteStoredFile(previousStorageKey).catch(() => {});
  }

  return { appleUrl: stored.url, googleSaveUrl: pass.googleSaveUrl };
}
