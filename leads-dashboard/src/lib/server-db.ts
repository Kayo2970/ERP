/**
 * server-db.ts — Shared server-side file-based database helper.
 * All API routes use this to read/write data/database.json safely.
 * Uses a simple async mutex to prevent concurrent write races.
 */
import fs from 'fs/promises';
import path from 'path';
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
} from './local-data';

export const DB_PATH = path.join(process.cwd(), 'data', 'database.json');

// Simple async mutex to prevent concurrent file writes
let writeLock: Promise<void> = Promise.resolve();

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
  auditLogs: any[];
  emails: any[];
  passwordResets: any[];
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
  auditLogs: [],
  emails: [],
  passwordResets: [],
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
  auditLogs: [],
  emails: [],
  passwordResets: [],
};

/**
 * 30-Day Storage Retention Cleanup Helper:
 * Checks design items past 30 days, marks them as expired, and purges heavy file payloads.
 */
function processDesignRetention(designs: any[]): any[] {
  if (!Array.isArray(designs)) return [];
  const nowMs = Date.now();

  return designs.map(item => {
    if (!item.expiresAt) return item;
    const expiresMs = new Date(item.expiresAt).getTime();
    if (nowMs > expiresMs) {
      return {
        ...item,
        isExpired: true,
        fileData: undefined, // Purge file data payload after 30 days
      };
    }
    return item;
  });
}

export async function readDb(): Promise<DbSchema> {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    const db: DbSchema = { ...EMPTY_DB, ...parsed };
    if (Array.isArray(db.designs)) {
      db.designs = processDesignRetention(db.designs);
    }
    return db;
  } catch (err: any) {
    if (err?.code !== 'ENOENT') return { ...EMPTY_DB };
    const seeded: DbSchema = { ...SEED_DB, lastUpdated: new Date().toISOString() };
    try {
      await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
      await fs.writeFile(DB_PATH, JSON.stringify(seeded, null, 2), 'utf-8');
    } catch (writeErr) {
      console.error('[server-db] First-boot seed write failed:', writeErr);
    }
    return seeded;
  }
}

export async function writeDb(data: DbSchema): Promise<void> {
  let writeError: unknown = null;
  writeLock = writeLock.then(async () => {
    try {
      const dir = path.dirname(DB_PATH);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[server-db] Write failed:', err);
      writeError = err;
    }
  });
  await writeLock;
  if (writeError) throw writeError;
}

/**
 * Read a single collection from the database.
 */
export async function readCollection<T = any>(key: keyof DbSchema): Promise<T[]> {
  const db = await readDb();
  return (db[key] as T[]) ?? [];
}

/**
 * Apply a mutation to a single collection and write the file.
 * The mutator receives the current array and returns the updated array.
 * Uses the write mutex so concurrent calls queue up safely.
 * Always resolves writeLock so errors don't poison subsequent calls.
 */
export async function mutateCollection<T = any>(
  key: keyof DbSchema,
  mutator: (current: T[]) => T[]
): Promise<T[]> {
  let result: T[] = [];
  let mutationError: unknown = null;

  writeLock = writeLock.then(async () => {
    try {
      const db = await readDb();
      const current = (db[key] as T[]) ?? [];
      const updated = mutator(current);
      db[key] = updated as any;
      db.lastUpdated = new Date().toISOString();
      await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
      await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
      result = updated;
    } catch (err) {
      mutationError = err;
    }
  });

  await writeLock;
  if (mutationError) throw mutationError;
  return result;
}

