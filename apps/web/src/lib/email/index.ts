/**
 * Email utilities
 *
 * This module provides email sending functionality using Resend and React Email.
 *
 * Architecture:
 * - `send-email.ts` - Core function that handles all email sending
 * - `magic-link.ts` - Specific email sender for magic link authentication
 *
 * Usage:
 * ```ts
 * // For magic links
 * import { sendMagicLink } from "@/lib/email";
 *
 * // For custom emails
 * import { sendEmail } from "@/lib/email";
 * import { MyEmailComponent } from "@reelo/transactional/emails";
 * ```
 */

export { sendMagicLink, type SendMagicLinkOptions } from "./magic-link";
export {
  sendEmail,
  type SendEmailOptions,
  type SendEmailResult,
} from "./send-email";
