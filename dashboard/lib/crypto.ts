/**
 * Crypto Utilities
 * Password hashing and verification using bcrypt
 */

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a random secure token
 */
export function generateToken(length: number = 32): string {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate API key
 */
export function generateApiKey(): string {
  return 'dbg_' + generateToken(24);
}

/**
 * Hash a string (for non-password hashing)
 */
export async function hashString(input: string): Promise<string> {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(input).digest('hex');
}
