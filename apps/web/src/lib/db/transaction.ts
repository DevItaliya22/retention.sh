import type { Prisma } from "@reelo/db";
import { db } from "@reelo/db";

/** Max time (ms) a transaction can run. Prevents long-running DB locks. */
export const TRANSACTION_TIMEOUT_MS = 30_000;

export function runTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: { timeout?: number },
): Promise<T> {
  const timeout = options?.timeout ?? TRANSACTION_TIMEOUT_MS;
  return db.$transaction(fn, { timeout });
}
