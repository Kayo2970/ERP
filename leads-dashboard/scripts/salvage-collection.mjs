/**
 * salvage-collection.mjs — best-effort recovery of a corrupted encrypted collection file
 * (e.g. data/emails.json damaged by two overlapping writes).
 *
 * AES-GCM is a stream cipher underneath, so the parts of the file written by the writer whose IV
 * heads the file still decrypt correctly even though the auth tag no longer verifies. This script
 * decrypts WITHOUT the tag check, keeps every record that parses cleanly and drops the garbled ones.
 *
 * Usage (from leads-dashboard/):
 *   node scripts/salvage-collection.mjs data/emails.json            # dry run: reports what it can recover
 *   node scripts/salvage-collection.mjs data/emails.json --apply    # back up the damaged file, write the recovered one
 *
 * Records still marked BUFFERED are recovered as CANCELLED: their real state is unknown (the send may
 * already have happened), and leaving them BUFFERED would make the sweeper re-send them.
 * Stop the app (pm2 stop leads-dashboard) before --apply, then start it again.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const file = process.argv[2];
const apply = process.argv.includes('--apply');
if (!file) {
  console.error('Usage: node scripts/salvage-collection.mjs <data/collection.json> [--apply]');
  process.exit(1);
}

function loadDotEnv() {
  try {
    for (const line of fs.readFileSync(path.resolve('.env'), 'utf-8').split(/\r?\n/)) {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  } catch { /* no .env */ }
}
loadDotEnv();

const passphrase = process.env.DATA_ENCRYPTION_KEY?.trim() ? process.env.DATA_ENCRYPTION_KEY : 'LEADS_ERP_MASTER_SECRET_KEY_2026';
const SALT = Buffer.from('LEADS_NEXT_GEN_CENTRE_MSRUAS_SALT_2026', 'utf-8');
const key = crypto.pbkdf2Sync(passphrase, SALT, 100000, 32, 'sha256');

const raw = fs.readFileSync(path.resolve(file), 'utf-8');
const iv = /"iv":"([0-9a-f]{24})"/.exec(raw)?.[1];
const ctStart = raw.indexOf('"ciphertext":"');
if (!iv || ctStart < 0) {
  console.error('Not an encrypted collection file (no iv/ciphertext found).');
  process.exit(1);
}
const hexStart = ctStart + '"ciphertext":"'.length;
let hexEnd = hexStart;
while (hexEnd < raw.length && /[0-9a-f]/.test(raw[hexEnd])) hexEnd++;
let hex = raw.slice(hexStart, hexEnd);
if (hex.length % 2) hex = hex.slice(0, -1);

const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
// update() only — final() would verify the (now invalid) auth tag and throw.
const text = decipher.update(Buffer.from(hex, 'hex')).toString('utf-8');

// Pull out every record that parses on its own, resyncing on the `{"id":"email-` marker after garbage.
const marker = /\{"id":"/g;
const records = [];
let skipped = 0;
let pos = 0;
while (true) {
  marker.lastIndex = pos;
  const m = marker.exec(text);
  if (!m) break;
  const start = m.index;
  // string-aware brace matching
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  let rec = null;
  if (end > 0) {
    try { rec = JSON.parse(text.slice(start, end)); } catch { /* garbled */ }
  }
  if (rec && typeof rec === 'object' && typeof rec.id === 'string' && rec.id.length < 80) {
    records.push(rec);
    pos = end;
  } else {
    skipped++;
    pos = start + 1;
  }
}

// de-duplicate by id (keep the last copy), then make BUFFERED safe
const byId = new Map();
for (const r of records) byId.set(r.id, r);
let buffered = 0;
const recovered = [...byId.values()].map(r => {
  if (r.status === 'BUFFERED') {
    buffered++;
    return { ...r, status: 'CANCELLED', errorMessage: 'Recovered from a corrupted log file — send state unknown, not re-sent automatically.' };
  }
  return r;
});

console.log(`File size: ${raw.length} bytes, decrypted text: ${text.length} chars`);
console.log(`Recovered records: ${recovered.length}  (garbled/skipped fragments: ${skipped}, BUFFERED turned CANCELLED: ${buffered})`);
if (recovered.length) {
  const dates = recovered.map(r => r.sentAt).filter(Boolean).sort();
  console.log(`Date range: ${dates[0]}  →  ${dates[dates.length - 1]}`);
}

if (!recovered.length) {
  console.error('Nothing recoverable.');
  process.exit(2);
}
if (!apply) {
  console.log('\nDry run only. Re-run with --apply (app stopped) to write the recovered file.');
  process.exit(0);
}

const backup = `${path.resolve(file)}.corrupt-${Date.now()}`;
fs.copyFileSync(path.resolve(file), backup);
const newIv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', key, newIv);
let ciphertext = cipher.update(JSON.stringify(recovered), 'utf-8', 'hex');
ciphertext += cipher.final('hex');
const payload = { _encrypted: true, algorithm: 'aes-256-gcm', iv: newIv.toString('hex'), authTag: cipher.getAuthTag().toString('hex'), ciphertext };
const tmp = `${path.resolve(file)}.salvage.tmp`;
fs.writeFileSync(tmp, JSON.stringify(payload), 'utf-8');
fs.renameSync(tmp, path.resolve(file));
console.log(`\nWrote ${recovered.length} records to ${file}. Damaged original saved as ${backup}`);
