import { prisma } from "@reelo/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { magicLink } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
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
      // Magic link sending
      "/sign-in/magic-link": {
        window: 10, // 10 seconds
        max: 3,
      },
      // Magic link verification
      "/magic-link/verify": {
        window: 10, // 10 seconds
        max: 3,
      },
      // Social sign-in attempts
      "/sign-in/social": {
        window: 60 * 60 * 24, // 1 day
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
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "reelo",
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"],
      disableIpTracking: false,
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, token, url }, ctx) => {
        console.log("Magic link:", { email, token, url });
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

      const user = await prisma.user.findUnique({
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
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { role: true },
          });

          const cashier = await prisma.cashier.findUnique({
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

export interface CashierLoginData {
  id: string;
  userId: string;
  businessId: string;
  cashierLinkSlug: string;
  user: {
    id: string;
    email: string | null;
    name: string;
  };
}

export async function validateCashierLogin(params: {
  businessSlug: string;
  cashierSlug: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string; cashier?: CashierLoginData }> {
  try {
    const { businessSlug, cashierSlug, email, password } = params;

    const business = await prisma.business.findUnique({
      where: { slug: businessSlug },
    });

    if (!business) {
      return {
        success: false,
        error: "Business not found",
      };
    }

    const cashier = await prisma.cashier.findFirst({
      where: {
        cashierLinkSlug: cashierSlug,
        businessId: business.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!cashier) {
      return {
        success: false,
        error: "Cashier not found in this business",
      };
    }

    if (cashier.user.email !== email) {
      return {
        success: false,
        error: "Invalid email for this cashier",
      };
    }

    if (cashier.password !== password) {
      return {
        success: false,
        error: "Invalid password",
      };
    }

    return {
      success: true,
      cashier: {
        id: cashier.id,
        userId: cashier.userId,
        businessId: cashier.businessId,
        cashierLinkSlug: cashier.cashierLinkSlug,
        user: {
          id: cashier.user.id,
          email: cashier.user.email,
          name: cashier.user.name,
        },
      },
    };
  } catch (error: any) {
    console.error("Failed to validate cashier login:", error);
    return {
      success: false,
      error: error.message || "Failed to validate cashier login",
    };
  }
}
