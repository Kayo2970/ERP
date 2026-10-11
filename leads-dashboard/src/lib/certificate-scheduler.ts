/**
 * Sends scheduled certificate batches. A schedule is one row in `certificateSchedules`; every minute any
 * `Scheduled` row whose time has come is claimed (-> `Running`) and sent, so a restart or an overlapping tick never sends twice.
 */
import { readCollection, mutateCollection } from '@/lib/server-db';
import { EventItem } from '@/lib/local-data';
import { isEventOver, sendCertificatesBatch } from '@/lib/certificate';

export interface CertificateSchedule {
  id: string;
  eventId: string;
  passIds: string[];
  sendAt: string;
  origin: string;
  createdBy: string;
  createdAt: string;
  status: 'Scheduled' | 'Running' | 'Done' | 'Failed' | 'Cancelled';
  sent?: number;
  failed?: number;
  error?: string;
  finishedAt?: string;
}

export async function runDueCertificateSchedules(now: Date = new Date()): Promise<number> {
  const claimed: CertificateSchedule[] = [];
  await mutateCollection<CertificateSchedule>('certificateSchedules', (current = []) =>
    current.map((s) => {
      if (s.status === 'Scheduled' && new Date(s.sendAt).getTime() <= now.getTime()) {
        claimed.push(s);
        return { ...s, status: 'Running' as const };
      }
      return s;
    })
  );
  for (const s of claimed) {
    let patch: Partial<CertificateSchedule>;
    try {
      const event = (await readCollection<EventItem>('events')).find((e) => e.id === s.eventId);
      if (!event) throw new Error('Event no longer exists.');
      if (!isEventOver(event)) throw new Error('The event had not ended at the scheduled time.');
      const results = await sendCertificatesBatch(event, s.passIds, s.origin);
      const sent = results.filter((r) => r.ok).length;
      patch = { status: 'Done', sent, failed: results.length - sent };
    } catch (err: any) {
      patch = { status: 'Failed', error: err?.message || 'Failed to send.' };
    }
    await mutateCollection<CertificateSchedule>('certificateSchedules', (cur = []) =>
      cur.map((x) => (x.id === s.id ? { ...x, ...patch, finishedAt: new Date().toISOString() } : x))
    );
  }
  return claimed.length;
}

let timer: NodeJS.Timeout | null = null;

export function startCertificateScheduler(): void {
  if (timer) return;
  const tick = () =>
    runDueCertificateSchedules()
      .then((n) => n && console.log(`[certificates] ran ${n} scheduled send(s)`))
      .catch((err) => console.error('[certificates] scheduled send failed:', err));
  setTimeout(tick, 30_000);
  timer = setInterval(tick, 60_000);
  timer.unref?.();
}
