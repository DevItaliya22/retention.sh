import { db } from "@reelo/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { magicLink } from "better-auth/plugins";
import { sendMagicLink } from "../email";
import { ADMIN_COOKIE_PREFIX } from "../utils/cookie";

/**
 * Better Auth configuration for ADMIN users.
 *
 * This handles:
 * - Email/password authentication
 * - Magic link authentication
 * - Session management with role-based access
 *
 * API endpoint: /api/auth/admin/*
 */

export const auth = betterAuth({
  basePath: "/api/auth/admin",
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
      },
    },
  },
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 100, // 100 requests per minute (global fallback)
    storage: "memory",
    customRules: {
      "/sign-in/magic-link": {
        window: 10,
        max: 3,
      },
      "/magic-link/verify": {
        window: 10,
        max: 3,
      },
      "/sign-in/social": {
        window: 60 * 60 * 24,
        max: 10,
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL,
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],
  session: {
    freshAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 15 * 60, // 15 minutes
    },
    additionalFields: {
      role: {
        type: "string",
      },
    },
  },
  advanced: {
    useSecureCookies: false,
    cookiePrefix: ADMIN_COOKIE_PREFIX,
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"],
      disableIpTracking: false,
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLink({ email, url });
      },
    }),
  ],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const restrictedPaths = [
        "/sign-in/email",
        "/sign-in/magic-link",
        "/sign-up/email",
      ];

      if (!restrictedPaths.includes(ctx.path)) {
        return;
      }

      const email = ctx.body?.email;

      if (!email) {
        return;
      }

      const user = await db.user.findUnique({
        where: { email },
        select: { role: true },
      });

      // Allow new users (user doesn't exist) - they will get ADMIN role via database hook
      // Only block existing users who are not ADMIN
      if (user && user.role !== "ADMIN") {
        throw new APIError("FORBIDDEN", {
          message: "You are not allowed to sign in here.",
        });
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              role: "ADMIN",
            },
          };
        },
      },
    },
    session: {
      create: {
        before: async (session: {
          userId: string;
          expiresAt: Date;
          token: string;
          ipAddress?: string | null;
          userAgent?: string | null;
          role?: string | null;
        }) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { role: true },
          });

          const cashier = await db.cashier.findUnique({
            where: { userId: session.userId },
            select: { id: true },
          });

          const role = cashier
            ? "CASHIER"
            : ((user?.role as unknown as string | null) ?? null);

          return {
            data: {
              ...session,
              role,
            },
          };
        },
      },
    },
  },
});
