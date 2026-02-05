import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password for storing in the database.
 * Use when creating or updating any user/cashier/etc. password.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a stored bcrypt hash.
 */
export async function verifyPassword(
  plainPassword: string,
  storedHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, storedHash);
}
