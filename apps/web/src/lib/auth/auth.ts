import { prisma } from "@dy/db";
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
