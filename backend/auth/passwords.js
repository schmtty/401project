/**
 * Password hashing and verification using Node's built-in scrypt algorithm.
 *
 * Hash format (stored in the password_hash column):
 *   scrypt$<N>$<r>$<p>$<saltHex>$<derivedKeyHex>
 *
 *   N    - CPU/memory cost factor (work factor); higher = slower but more secure.
 *   r    - Block size parameter; controls memory usage per iteration.
 *   p    - Parallelization factor.
 *   salt - 16 random bytes encoded as hex; unique per password to prevent rainbow tables.
 *   hash - 64-byte derived key encoded as hex.
 *
 * Example stored value:
 *   scrypt$16384$8$1$afc5ab04...$3c3cbf9d...
 *
 * All parameters are encoded in the hash string so that cost factors can be
 * increased in future without invalidating existing stored hashes.
 */
import crypto from 'crypto';

/** Length in bytes of the derived key produced by scrypt. */
const KEY_LENGTH = 64;

/**
 * CPU/memory cost factor for scrypt. Must be a power of 2.
 * 16384 (2^14) is a reasonable default for interactive logins.
 * Increase for higher security at the cost of slower hashing.
 */
const COST_N = 16384;

/** Block size parameter. Controls per-iteration memory usage (r * 128 bytes). */
const COST_R = 8;

/** Parallelization factor. Set to 1 for sequential hashing on a single thread. */
const COST_P = 1;

/**
 * Promisify Node's callback-based crypto.scrypt.
 * @param {string} password - Plain-text password to derive a key from.
 * @param {string} salt - Hex-encoded salt string.
 * @param {{ N: number, r: number, p: number }} opts - scrypt cost parameters.
 * @returns {Promise<Buffer>} Derived key buffer of length KEY_LENGTH.
 */
function scryptAsync(password, salt, opts) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, opts, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey);
    });
  });
}

/**
 * Hash a plain-text password using scrypt with a random salt.
 * The result is a self-contained string encoding all parameters needed to verify later.
 * @param {string} password - Plain-text password to hash.
 * @returns {Promise<string>} Encoded hash string in the format described at the top of this file.
 */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, { N: COST_N, r: COST_R, p: COST_P });
  return `scrypt$${COST_N}$${COST_R}$${COST_P}$${salt}$${derived.toString('hex')}`;
}

/**
 * Verify a plain-text password against a stored hash string.
 *
 * Uses crypto.timingSafeEqual for the final comparison to prevent timing attacks —
 * a standard string equality check (===) would leak information about how many
 * bytes match, which could be exploited to guess passwords character by character.
 *
 * Returns false (rather than throwing) for any malformed or missing hash so callers
 * can treat both "wrong password" and "no password set" as a simple false result.
 *
 * @param {string} password - Plain-text password supplied by the user.
 * @param {string|null|undefined} storedHash - Hash string retrieved from the database.
 * @returns {Promise<boolean>} True if the password matches, false otherwise.
 */
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
  // Buffers must be the same length before timingSafeEqual or it throws.
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}
