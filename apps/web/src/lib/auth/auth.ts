import { prisma } from "@reelo/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink, phoneNumber } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
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
      // Organization invitation sending
      "/organization/invite": {
        window: 60 * 60 * 24, // 1 day
        max: 10,
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
        // TODO: Implement email sending service
        // Example: await sendEmail({ to: email, subject: "Magic Link", html: `<a href="${url}">Click here to sign in</a>` })
        console.log("Magic link:", { email, token, url });
      },
    }),
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }, ctx) => {
        // TODO: Implement SMS sending service
        // Example: await sendSMS({ to: phoneNumber, message: `Your OTP code is: ${code}` })
        console.log("OTP code:", { phoneNumber, code });
      },
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => {
          return `${phoneNumber.replace(/[^0-9]/g, "")}@temp.dy.com`;
        },
        getTempName: (phoneNumber) => {
          return phoneNumber;
        },
      },
    }),
  ],
});
