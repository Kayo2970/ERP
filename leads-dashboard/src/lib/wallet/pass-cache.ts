/**
 * One WalletWallet call per pass, ever. Apple (.pkpass) and Google (save URL) both come from the single
 * POST /api/passes response; both are cached on the pass record + disk and served from there afterwards.
 * Concurrent requests share one in-flight creation, and a failed creation backs off for a minute so a
 * burst of clicks can't burn through the monthly quota.
 */
import { mutateCollection, readCollection } from '@/lib/server-db';
import { saveBase64File } from '@/lib/file-storage';
import { getWalletWalletApiKey } from '@/lib/wallet/walletwallet-config';
import { createEventWalletPass } from '@/lib/wallet/walletwallet-client';
import { walletDataForPass } from '@/lib/pass-theme';
import type { EventPassItem } from '@/lib/local-data';

export interface CachedWalletPass {
  appleUrl: string;
  googleSaveUrl: string;
  cached: boolean;
}

const inFlight = new Map<string, Promise<CachedWalletPass>>();
const failedUntil = new Map<string, { until: number; message: string }>();

export class WalletUnavailableError extends Error {}

function fromRecord(pass: EventPassItem): CachedWalletPass | null {
  // Cached as soon as WalletWallet has issued the pass (Google link or stored serial) — not only when both exist
  if (pass.walletGoogleSaveUrl || pass.walletAppleUrl || pass.walletSerialNumber) {
    return { appleUrl: pass.walletAppleUrl || '', googleSaveUrl: pass.walletGoogleSaveUrl || '', cached: true };
  }
  return null;
}

export async function getOrCreateWalletPass(passRef: string, origin: string): Promise<CachedWalletPass> {
  const hit = (await readCollection<EventPassItem>('event_passes')).find(
    (p) => p.id === passRef || p.serialNumber.toLowerCase() === passRef.toLowerCase()
  );
  if (!hit) throw new WalletUnavailableError('Pass not found');
  if (hit.status === 'Cancelled') throw new WalletUnavailableError('This pass has been cancelled.');

  const cached = fromRecord(hit);
  if (cached) return cached;

  const key = hit.id;
  const failed = failedUntil.get(key);
  if (failed && failed.until > Date.now()) throw new WalletUnavailableError(failed.message);

  const running = inFlight.get(key);
  if (running) return running;

  const job = (async (): Promise<CachedWalletPass> => {
    const apiKey = await getWalletWalletApiKey();
    if (!apiKey) throw new WalletUnavailableError('Wallet passes are temporarily unavailable.');
    const walletPass = await createEventWalletPass(apiKey, await walletDataForPass(hit), `${origin}/pass/${hit.serialNumber}`);

    let appleUrl = '';
    if (walletPass.applePass) {
      const stored = await saveBase64File(
        'event-passes',
        hit.id,
        0,
        `${hit.serialNumber}.pkpass`,
        `data:application/vnd.apple.pkpass;base64,${walletPass.applePass}`
      );
      appleUrl = stored.url;
    }
    const googleSaveUrl = walletPass.googleSaveUrl || '';
    await mutateCollection<EventPassItem>('event_passes', (current = []) => {
      const idx = current.findIndex((p) => p.id === hit.id);
      if (idx === -1) return current;
      const copy = [...current];
      copy[idx] = { ...copy[idx], walletAppleUrl: appleUrl, walletGoogleSaveUrl: googleSaveUrl, walletSerialNumber: walletPass.serialNumber };
      return copy;
    });
    return { appleUrl, googleSaveUrl, cached: false };
  })();

  inFlight.set(key, job);
  try {
    return await job;
  } catch (err: any) {
    const message = err?.message || 'Wallet pass could not be created.';
    failedUntil.set(key, { until: Date.now() + 60_000, message });
    throw err instanceof WalletUnavailableError ? err : new WalletUnavailableError(message);
  } finally {
    inFlight.delete(key);
  }
}

/** Test hook / admin reset: forget back-off state. */
export function resetWalletBackoff(): void {
  failedUntil.clear();
}
