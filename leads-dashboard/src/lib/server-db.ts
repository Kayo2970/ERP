/**
 * server-db.ts — Shared server-side file-based database helper.
 * All API routes use this to read/write data/database.json safely.
 * Uses a simple async mutex to prevent concurrent write races.
 */
import fs from 'fs/promises';
import path from 'path';

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
  auditLogs: any[];
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
  auditLogs: [],
};

export async function readDb(): Promise<DbSchema> {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    // Ensure all expected collections exist
    return { ...EMPTY_DB, ...parsed };
  } catch {
    return { ...EMPTY_DB };
  }
}

export async function writeDb(data: DbSchema): Promise<void> {
  // Queue write behind any pending write to prevent races
  writeLock = writeLock.then(async () => {
    try {
      const dir = path.dirname(DB_PATH);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[server-db] Write failed:', err);
      throw err;
    }
  });
  return writeLock;
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
 */
export async function mutateCollection<T = any>(
  key: keyof DbSchema,
  mutator: (current: T[]) => T[]
): Promise<T[]> {
  // Queue behind existing writes
  let result: T[] = [];
  writeLock = writeLock.then(async () => {
    const db = await readDb();
    const current = (db[key] as T[]) ?? [];
    const updated = mutator(current);
    db[key] = updated as any;
    db.lastUpdated = new Date().toISOString();
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    result = updated;
  });
  await writeLock;
  return result;
}
