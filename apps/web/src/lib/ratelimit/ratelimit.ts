import { db } from "@reelo/db";
import {
  RATELIMIT_DEFAULT_MAX_TRIES,
  RATELIMIT_DEFAULT_WINDOW_SECONDS,
} from "./ratelimit-constants";

export interface RateLimitInput {
  key: string;
  maxTries?: number;
  windowSeconds?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the rate limit window resets; only set when allowed is false */
  retryAfterSeconds?: number;
}

/**
 * Generic rate limit: checks key, maxTries, window. If over limit → block.
 * If under limit → record attempt and allow.
 */
export async function checkRateLimit(
  input: RateLimitInput | string,
  options?: { maxTries?: number; windowSeconds?: number },
): Promise<RateLimitResult> {
  const key = typeof input === "string" ? input : input.key;
  const maxTries =
    (typeof input === "object" ? input.maxTries : undefined) ??
    options?.maxTries ??
    RATELIMIT_DEFAULT_MAX_TRIES;
  const windowSeconds =
    (typeof input === "object" ? input.windowSeconds : undefined) ??
    options?.windowSeconds ??
    RATELIMIT_DEFAULT_WINDOW_SECONDS;

  const now = new Date();
  const windowExpiresAt = new Date(now.getTime() + windowSeconds * 1000);

  const result = await db.$transaction(async (tx) => {
    const existing = await tx.rateLimit.findUnique({
      where: { key },
    });

    if (!existing) {
      await tx.rateLimit.create({
        data: {
          key,
          maxTries,
          tries: 1,
          windowExpiresAt,
        },
      });
      return { allowed: true, remaining: maxTries - 1 };
    }

    if (existing.windowExpiresAt < now) {
      await tx.rateLimit.update({
        where: { key },
        data: {
          maxTries,
          tries: 1,
          windowExpiresAt,
        },
      });
      return { allowed: true, remaining: maxTries - 1 };
    }

    if (existing.tries >= existing.maxTries) {
      const retryAfterSeconds = Math.max(
        0,
        Math.ceil((existing.windowExpiresAt.getTime() - now.getTime()) / 1000),
      );
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    await tx.rateLimit.update({
      where: { key },
      data: {
        tries: { increment: 1 },
      },
    });

    const newTries = existing.tries + 1;
    return {
      allowed: true,
      remaining: Math.max(0, maxTries - newTries),
    };
  });

  return result;
}
