import crypto from 'crypto';

const KEY_LENGTH = 64;
const COST_N = 16384;
const COST_R = 8;
const COST_P = 1;

function scryptAsync(password, salt, opts) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, opts, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey);
    });
  });
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, { N: COST_N, r: COST_R, p: COST_P });
  return `scrypt$${COST_N}$${COST_R}$${COST_P}$${salt}$${derived.toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash?.startsWith('scrypt$')) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 6) return false;

  const [, nStr, rStr, pStr, saltHex, hashHex] = parts;
  const N = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p) || !saltHex || !hashHex) return false;

  const actual = await scryptAsync(password, saltHex, { N, r, p });
  const expected = Buffer.from(hashHex, 'hex');
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}
