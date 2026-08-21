/**
 * server-db.ts — Shared server-side file-based database helper.
 *
 * Each collection lives in its own file under data/ (data/members.json,
 * data/events.json, ...) rather than one shared database.json — a write to
 * one collection no longer requires reading and rewriting every other
 * collection, and unrelated collections never block each other's writes
 * (each has its own async mutex). The files stay "interconnected" the same
 * way real relational tables do: by referencing each other's ids (tasks
 * reference eventId/assigneeId, ratings reference targetId, reimbursements
 * reference eventId, etc.) — the connections are in the data, not in a
 * shared physical file.
 *
 * A one-time, idempotent migration splits any pre-existing single-file
 * data/database.json into these per-collection files on first read after
 * upgrading, and retires (never deletes) the old file to data/database.json.migrated
 * as a safety net.
 */
import fs from 'fs/promises';
import path from 'path';
import { deleteStoredFile, saveBase64File } from './file-storage';
import {
  initialMembers,
  initialEvents,
  initialTasks,
  initialRatings,
  initialReimbursements,
  initialAnnouncements,
  initialForms,
  initialSubmissions,
  initialDesigns,
  initialGroupPolicies,
  initialAccessLevelSettings,
  initialSystemSettings,
  initialGuests,
} from './local-data';

const DATA_DIR = path.join(process.cwd(), 'data');
const LEGACY_DB_PATH = path.join(DATA_DIR, 'database.json');
const RETIRED_LEGACY_DB_PATH = path.join(DATA_DIR, 'database.json.migrated');
const META_PATH = path.join(DATA_DIR, '_meta.json');

export interface DbSchema {
  members: any[];
  events: any[];
  tasks: any[];
  ratings: any[];
  reimbursements: any[];
  announcements: any[];
  forms: any[];
  submissions: any[];
  designs: any[];
  groupPolicies: any[];
  accessLevelSettings: any[];
  systemSettings: any[];
  auditLogs: any[];
  emails: any[];
  passwordResets: any[];
  emailChanges: any[];
  emailSettings: any[];
  guests: any[];
  lastUpdated?: string;
}

const EMPTY_DB: DbSchema = {
  members: [],
  events: [],
  tasks: [],
  ratings: [],
  reimbursements: [],
  announcements: [],
  forms: [],
  submissions: [],
  designs: [],
  groupPolicies: [],
  accessLevelSettings: [],
  systemSettings: [],
  auditLogs: [],
  emails: [],
  passwordResets: [],
  emailChanges: [],
  emailSettings: [],
  guests: [],
};

const SEED_DB: DbSchema = {
  members: initialMembers,
  events: initialEvents,
  tasks: initialTasks,
  ratings: initialRatings,
  reimbursements: initialReimbursements,
  announcements: initialAnnouncements,
  forms: initialForms,
  submissions: initialSubmissions,
  designs: initialDesigns,
  groupPolicies: initialGroupPolicies,
  accessLevelSettings: initialAccessLevelSettings,
  systemSettings: initialSystemSettings,
  auditLogs: [],
  emails: [],
  passwordResets: [],
  emailChanges: [],
  emailSettings: [
    {
      id: 'default',
      provider: 'gmail',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      secure: false,
      authUser: 'leads@msruas.ac.in',
      authPass: '',
      fromName: 'LEADS Next Gen Centre',
      fromEmail: 'leads@msruas.ac.in',
      replyTo: 'leads@msruas.ac.in',
      updatedAt: new Date().toISOString()
    }
  ],
  guests: initialGuests,
};

const COLLECTION_KEYS = Object.keys(EMPTY_DB) as (keyof DbSchema)[];

function collectionPath(key: keyof DbSchema): string {
  return path.join(DATA_DIR, `${String(key)}.json`);
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * One-time, idempotent split of the legacy single-file database.json into
 * per-collection files. Cached in module scope so concurrent calls (e.g.
 * several requests landing at once on first boot after upgrading) all await
 * the same migration instead of racing each other. Safe to call on every
 * boot — a no-op once migration has happened (ENOENT on the legacy path).
 */
let migrationPromise: Promise<void> | null = null;
function ensureMigrated(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      let legacy: Partial<DbSchema>;
      try {
        const raw = await fs.readFile(LEGACY_DB_PATH, 'utf-8');
        legacy = JSON.parse(raw);
      } catch (err: any) {
        if (err?.code !== 'ENOENT') {
          console.error('[server-db] Legacy database.json read failed during migration check:', err);
        }
        return; // no legacy file (or unreadable) — nothing to migrate
      }

      await fs.mkdir(DATA_DIR, { recursive: true });
      for (const key of COLLECTION_KEYS) {
        const target = collectionPath(key);
        if (await fileExists(target)) continue; // already migrated (or created independently) — never overwrite
        const value = Array.isArray(legacy[key]) ? legacy[key] : (EMPTY_DB[key] as any[]);
        await fs.writeFile(target, JSON.stringify(value, null, 2), 'utf-8');
      }

      // Retire, never delete, the legacy file — undeletable safety net if migration
      // logic ever has a bug. Idempotent: if a retired copy already exists (a prior
      // partial run), leave both alone rather than overwriting the earlier snapshot.
      if (!(await fileExists(RETIRED_LEGACY_DB_PATH))) {
        try {
          await fs.rename(LEGACY_DB_PATH, RETIRED_LEGACY_DB_PATH);
        } catch (err) {
          console.error('[server-db] Failed to retire legacy database.json after migration:', err);
        }
      }
    })();
  }
  return migrationPromise;
}

/**
 * 30-Day Storage Retention Cleanup Helper:
 * Checks design items past 30 days, marks them as expired, and purges the stored
 * file — both the legacy inline base64 payload (if the record predates the
 * disk-backed storage migration) and, for newer records, the actual file on disk
 * referenced by storageKey.
 */
function processDesignRetention(designs: any[]): any[] {
  if (!Array.isArray(designs)) return [];
  const nowMs = Date.now();

  return designs.map(item => {
    if (!item.expiresAt) return item;
    const expiresMs = new Date(item.expiresAt).getTime();
    if (nowMs > expiresMs) {
      if (!item.isExpired && item.storageKey) {
        // Best-effort, not awaited — this function stays synchronous and never
        // blocks a read waiting on a delete that only needs to happen once.
        deleteStoredFile(item.storageKey).catch(() => {});
      }
      return {
        ...item,
        isExpired: true,
        fileData: undefined, // Purge legacy inline payload after 30 days
        fileUrl: undefined,
        storageKey: undefined,
      };
    }
    return item;
  });
}

/**
 * One-time, idempotent migration of any legacy inline-base64 file payloads
 * (designs.json's fileData, reimbursements.json's receiptFiles[].dataUrl /
 * receiptData) out to real files under data/uploads/, rewriting the JSON
 * records to reference them via storageKey/url instead. Safe to run on every
 * boot — a record that's already migrated has no dataUrl/fileData left to act
 * on, so it's skipped. Cached in module scope like ensureMigrated().
 */
let fileMigrationPromise: Promise<void> | null = null;
function ensureFilesMigrated(): Promise<void> {
  if (!fileMigrationPromise) {
    fileMigrationPromise = (async () => {
      await migrateDesignFilesToDisk();
      await migrateReimbursementFilesToDisk();
    })();
  }
  return fileMigrationPromise;
}

/**
 * One-off correction: an instance already running before local-data.ts's
 * seed was corrected may still have Dr. Subhadeep Mukherjee's old email
 * baked into its members.json — the seed only applies on first boot, and
 * an already-existing collection file is never overwritten. Runs once per
 * boot, only touches the record if the stale address is still present, and
 * is a permanent no-op afterward.
 */
let subhadeepEmailFixPromise: Promise<void> | null = null;
function ensureSubhadeepEmailFixed(): Promise<void> {
  if (!subhadeepEmailFixPromise) {
    subhadeepEmailFixPromise = (async () => {
      const STALE_EMAIL = 'subhadeep.mukherjee@msruas.ac.in';
      const CORRECT_EMAIL = 'subhadeepmukherjee.ms.mc@msruas.ac.in';
      try {
        const raw = await fs.readFile(collectionPath('members'), 'utf-8');
        const members = JSON.parse(raw);
        if (!Array.isArray(members)) return;
        let changed = false;
        const updated = members.map((m: any) => {
          if (m?.email?.toLowerCase() === STALE_EMAIL) {
            changed = true;
            return { ...m, email: CORRECT_EMAIL };
          }
          return m;
        });
        if (changed) {
          await fs.writeFile(collectionPath('members'), JSON.stringify(updated, null, 2), 'utf-8');
        }
      } catch (err: any) {
        if (err?.code !== 'ENOENT') {
          console.error('[server-db] Subhadeep email correction check failed:', err);
        }
      }
    })();
  }
  return subhadeepEmailFixPromise;
}

async function migrateDesignFilesToDisk(): Promise<void> {
  let designs: any[];
  try {
    designs = JSON.parse(await fs.readFile(collectionPath('designs'), 'utf-8'));
  } catch {
    return; // no file yet — nothing to migrate
  }
  if (!Array.isArray(designs)) return;

  let changed = false;
  for (const item of designs) {
    if (typeof item.fileData === 'string' && item.fileData.startsWith('data:')) {
      try {
        const stored = await saveBase64File('designs', item.id, 0, item.fileName || 'file', item.fileData);
        item.fileUrl = stored.url;
        item.storageKey = stored.storageKey;
        delete item.fileData;
        changed = true;
      } catch (err) {
        console.error('[server-db] Failed to migrate design file to disk for', item.id, err);
      }
    }
  }
  if (changed) await writeCollectionFile('designs', designs);
}

async function migrateReimbursementFilesToDisk(): Promise<void> {
  let items: any[];
  try {
    items = JSON.parse(await fs.readFile(collectionPath('reimbursements'), 'utf-8'));
  } catch {
    return;
  }
  if (!Array.isArray(items)) return;

  let changed = false;
  for (const item of items) {
    const files = Array.isArray(item.receiptFiles) ? item.receiptFiles : [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f && typeof f.dataUrl === 'string' && f.dataUrl.startsWith('data:')) {
        try {
          const stored = await saveBase64File('reimbursements', item.id, i, f.name || 'file', f.dataUrl);
          f.url = stored.url;
          f.storageKey = stored.storageKey;
          delete f.dataUrl;
          changed = true;
        } catch (err) {
          console.error('[server-db] Failed to migrate receipt file to disk for', item.id, i, err);
        }
      }
    }
    // Legacy single-file shape predating receiptFiles[] entirely.
    if (files.length === 0 && typeof item.receiptData === 'string' && item.receiptData.startsWith('data:')) {
      try {
        const stored = await saveBase64File('reimbursements', item.id, 0, item.receiptUrl || 'receipt.pdf', item.receiptData);
        item.receiptFiles = [{ name: item.receiptUrl || 'receipt.pdf', url: stored.url, storageKey: stored.storageKey }];
        delete item.receiptData;
        changed = true;
      } catch (err) {
        console.error('[server-db] Failed to migrate legacy receipt for', item.id, err);
      }
    }
  }
  if (changed) await writeCollectionFile('reimbursements', items);
}

async function readCollectionFile<T = any>(key: keyof DbSchema): Promise<T[]> {
  await ensureMigrated();
  await ensureFilesMigrated();
  await ensureSubhadeepEmailFixed();
  try {
    const raw = await fs.readFile(collectionPath(key), 'utf-8');
    const parsed = JSON.parse(raw);
    let arr: any[] = Array.isArray(parsed) ? parsed : ((EMPTY_DB[key] as any[]) ?? []);
    if (key === 'designs') arr = processDesignRetention(arr);
    return arr as T[];
  } catch (err: any) {
    if (err?.code !== 'ENOENT') return ((EMPTY_DB[key] as any[]) ?? []) as T[];
    // First boot for this specific collection: seed it from local-data.ts's initial* export.
    const seeded = ((SEED_DB[key] as any[]) ?? []) as T[];
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(collectionPath(key), JSON.stringify(seeded, null, 2), 'utf-8');
    } catch (writeErr) {
      console.error(`[server-db] First-boot seed write failed for "${String(key)}":`, writeErr);
    }
    return seeded;
  }
}

async function writeCollectionFile<T = any>(key: keyof DbSchema, data: T[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(collectionPath(key), JSON.stringify(data, null, 2), 'utf-8');
}

/** Best-effort shared freshness marker — nothing depends on this for correctness. */
async function touchMeta(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(META_PATH, JSON.stringify({ lastUpdated: new Date().toISOString() }, null, 2), 'utf-8');
  } catch (err) {
    console.error('[server-db] Failed to update _meta.json:', err);
  }
}

/** Read every collection and assemble the full DbSchema shape (used by the /api/data aggregate poll). */
export async function readDb(): Promise<DbSchema> {
  const entries = await Promise.all(
    COLLECTION_KEYS.map(async key => [key, await readCollectionFile(key)] as const)
  );
  const db = Object.fromEntries(entries) as unknown as DbSchema;
  try {
    const metaRaw = await fs.readFile(META_PATH, 'utf-8');
    db.lastUpdated = JSON.parse(metaRaw)?.lastUpdated;
  } catch {
    // no meta file yet — fine, lastUpdated stays undefined
  }
  return db;
}

/**
 * Read a single collection from its own file.
 */
export async function readCollection<T = any>(key: keyof DbSchema): Promise<T[]> {
  return readCollectionFile<T>(key);
}

// Per-collection write locks — a write to "tasks" never waits on a concurrent
// write to "members" or any other unrelated collection.
const writeLocks = new Map<keyof DbSchema, Promise<void>>();

/**
 * Apply a mutation to a single collection and write only that collection's file.
 * The mutator receives the current array and returns the updated array.
 * Locked per-collection so concurrent calls to the SAME collection queue up
 * safely, while calls to different collections proceed independently.
 */
export async function mutateCollection<T = any>(
  key: keyof DbSchema,
  mutator: (current: T[]) => T[]
): Promise<T[]> {
  const previousLock = writeLocks.get(key) ?? Promise.resolve();
  let result: T[] = [];
  let mutationError: unknown = null;

  const thisLock = previousLock.then(async () => {
    try {
      const current = await readCollectionFile<T>(key);
      const updated = mutator(current);
      await writeCollectionFile(key, updated);
      result = updated;
    } catch (err) {
      mutationError = err;
    }
  });

  writeLocks.set(key, thisLock);
  await thisLock;
  touchMeta(); // best-effort, not awaited — never blocks or fails a mutation
  if (mutationError) throw mutationError;
  return result;
}
