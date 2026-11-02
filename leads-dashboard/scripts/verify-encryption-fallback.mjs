import assert from 'node:assert';
import crypto from 'node:crypto';

const FALLBACK_KEY = 'LEADS_ERP_MASTER_SECRET_KEY_2026';
const FIXED_SALT = Buffer.from('LEADS_NEXT_GEN_CENTRE_MSRUAS_SALT_2026', 'utf-8');

function deriveKey(passphrase) {
  return crypto.pbkdf2Sync(passphrase, FIXED_SALT, 100000, 32, 'sha256');
}

function encryptWithPassphrase(text, passphrase) {
  const key = deriveKey(passphrase);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let ciphertext = cipher.update(text, 'utf-8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return {
    _encrypted: true,
    algorithm: 'aes-256-gcm',
    iv: iv.toString('hex'),
    authTag,
    ciphertext,
  };
}

function decryptWithPassphrase(payload, passphrase) {
  const key = deriveKey(passphrase);
  const iv = Buffer.from(payload.iv, 'hex');
  const authTag = Buffer.from(payload.authTag, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let plaintext = decipher.update(payload.ciphertext, 'hex', 'utf-8');
  plaintext += decipher.final('utf-8');
  return plaintext;
}

function decryptData(payload, masterKey, customPassphrase) {
  if (!payload || !payload._encrypted || !payload.iv || !payload.ciphertext || !payload.authTag) {
    throw new Error('Invalid encrypted payload format.');
  }
  const passphrase = customPassphrase || masterKey;
  try {
    return decryptWithPassphrase(payload, passphrase);
  } catch (err) {
    if (customPassphrase || passphrase === FALLBACK_KEY) {
      throw err;
    }
    try {
      return decryptWithPassphrase(payload, FALLBACK_KEY);
    } catch {
      throw err;
    }
  }
}

console.log('Testing encryption fallback behavior...');

// Case 1: Payload was created on first boot under FALLBACK_KEY, but master key was rotated to a new key
const initialSeededData = JSON.stringify({ members: [] });
const fallbackPayload = encryptWithPassphrase(initialSeededData, FALLBACK_KEY);
const newConfiguredMasterKey = '4657690d38db082c195ab6e81e77333a36d0d5266d095e5505593179e9d1ef48';

const decryptedWithFallback = decryptData(fallbackPayload, newConfiguredMasterKey);
assert.strictEqual(decryptedWithFallback, initialSeededData, 'Fallback key payload must decrypt even when master key is rotated');

// Case 2: Payload created with new key decrypts directly
const newUserData = JSON.stringify({ user: 'super' });
const newKeyPayload = encryptWithPassphrase(newUserData, newConfiguredMasterKey);
const decryptedWithNewKey = decryptData(newKeyPayload, newConfiguredMasterKey);
assert.strictEqual(decryptedWithNewKey, newUserData, 'New key payload must decrypt with new key');

// Case 3: Completely wrong key and not fallback must throw
const thirdKey = 'completely_different_unknown_random_key_1234567';
assert.throws(
  () => decryptData(newKeyPayload, thirdKey),
  /unable to authenticate data/,
  'Must reject payload encrypted under another key'
);

console.log('All encryption fallback checks passed cleanly.');
