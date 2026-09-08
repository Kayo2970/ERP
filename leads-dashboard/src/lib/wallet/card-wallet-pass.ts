import crypto from 'crypto';
import { mutateCollection } from '@/lib/server-db';
import { saveBase64File, deleteStoredFile } from '@/lib/file-storage';
import { createWalletPass } from './walletwallet-client';

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
    designation: member.role || '',
    phone: member.cardPhone || '',
    email: member.email || '',
    bio: member.cardBio || '',
    linkedin: member.cardSocials?.linkedin || '',
    cardUrl,
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

interface CachedWalletPass {
  appleUrl: string;
  googleSaveUrl: string;
}

export async function getOrCreateWalletPass(apiKey: string, member: any, cardUrl: string): Promise<CachedWalletPass> {
  const hash = contentHashFor(member, cardUrl);

  if (member.cardPassContentHash === hash && member.cardPassAppleUrl && member.cardPassGoogleSaveUrl) {
    return { appleUrl: member.cardPassAppleUrl, googleSaveUrl: member.cardPassGoogleSaveUrl };
  }

  const pass = await createWalletPass(
    apiKey,
    {
      name: member.name,
      designation: member.role,
      phone: member.cardPhone,
      email: member.email,
      bio: member.cardBio,
      linkedin: member.cardSocials?.linkedin,
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
    next[idx] = {
      ...next[idx],
      cardPassSerial: pass.serialNumber,
      cardPassContentHash: hash,
      cardPassAppleUrl: stored.url,
      cardPassAppleStorageKey: stored.storageKey,
      cardPassGoogleSaveUrl: pass.googleSaveUrl,
    };
    return next;
  });
  if (previousStorageKey) {
    await deleteStoredFile(previousStorageKey).catch(() => {});
  }

  return { appleUrl: stored.url, googleSaveUrl: pass.googleSaveUrl };
}
