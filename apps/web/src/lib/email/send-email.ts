import { Resend } from "resend";
import type { ReactElement } from "react";

export interface SendEmailOptions {
  /** Recipient email address(es) */
  to: string | string[];
  /** Email subject line */
  subject: string;
  /** React Email component to render */
  react: ReactElement;
  /** Sender email address (defaults to RESEND_FROM_EMAIL env var) */
  from?: string;
  /** Reply-to email address */
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends email via Resend. Pass a React Email component as `react`; Resend renders it.
 *
 * @example
 * ```ts
 * import { sendEmail } from "@/lib/email/send-email";
 * import { MagicLinkEmail } from "@reelo/transactional/emails";
 *
 * await sendEmail({
 *   to: "user@example.com",
 *   subject: "Sign in to your account",
 *   react: MagicLinkEmail({ url: "https://..." }),
 * });
 * ```
 */
export async function sendEmail(
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  const { to, subject, react, from, replyTo } = options;
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    from ?? process.env.RESEND_FROM_EMAIL ?? "DY <noreply@example.com>";

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      return { success: true, messageId: `dev-${Date.now()}` };
    }
    return {
      success: false,
      error: "Email service not configured. Please set RESEND_API_KEY.",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
      replyTo,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}
