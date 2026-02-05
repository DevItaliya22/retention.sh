import { MagicLinkEmail } from "@reelo/transactional";
import { sendEmail, type SendEmailResult } from "./send-email";

export interface SendMagicLinkOptions {
  /** Recipient email address */
  email: string;
  /** Magic link URL */
  url: string;
  /** App name to display in email (defaults to "DY") */
  appName?: string;
  /** Minutes until link expires (defaults to 5) */
  expiresInMinutes?: number;
}

/**
 * Sends a magic link email for passwordless authentication.
 *
 * @example
 * ```ts
 * import { sendMagicLink } from "@/lib/email/magic-link";
 *
 * await sendMagicLink({
 *   email: "user@example.com",
 *   url: "https://app.example.com/auth/verify?token=...",
 * });
 * ```
 */
export async function sendMagicLink(
  options: SendMagicLinkOptions,
): Promise<SendEmailResult> {
  const { email, url, appName = "DY", expiresInMinutes = 5 } = options;

  // In DEV, also log the URL for easy access
  if (process.env.NODE_ENV !== "production") {
    console.log("\n[auth] Magic Link URL:", url, "\n");
  }

  return sendEmail({
    to: email,
    subject: `Sign in to ${appName}`,
    react: MagicLinkEmail({ url, appName, expiresInMinutes }),
  });
}
