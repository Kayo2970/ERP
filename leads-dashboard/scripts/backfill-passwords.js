#!/usr/bin/env node
/**
 * One-off migration: sets the shared default password ("Kayo29", scrypt-hashed)
 * on any member in data/database.json that doesn't already have a passwordHash —
 * covers a live database.json that was seeded before the auth fix landed. Safe
 * to run more than once: members that already have a hash are left untouched.
 *
 * Usage (from leads-dashboard/): node scripts/backfill-passwords.js
 */
const fs = require('fs');
const path = require('path');
const { randomBytes, scryptSync } = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'data', 'database.json');
const DEFAULT_PASSWORD = 'Kayo29';

function hashPassword(plain) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(plain, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.log(`No database.json at ${DB_PATH} — nothing to backfill (a fresh boot will seed passwordHash directly).`);
    return;
  }

  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  const db = JSON.parse(raw);

  if (!Array.isArray(db.members)) {
    console.log('No members collection found — nothing to do.');
    return;
  }

  let updated = 0;
  db.members = db.members.map(m => {
    if (m.passwordHash) return m;
    updated++;
    return { ...m, passwordHash: hashPassword(DEFAULT_PASSWORD) };
  });

  if (updated === 0) {
    console.log(`All ${db.members.length} members already have a passwordHash — nothing to do.`);
    return;
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  console.log(`Backfilled passwordHash for ${updated} of ${db.members.length} member(s). Default password: ${DEFAULT_PASSWORD}`);
}

main();
