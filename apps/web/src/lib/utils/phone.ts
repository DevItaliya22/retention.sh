import { PhoneNumberFormat, PhoneNumberUtil } from "google-libphonenumber";

const phoneUtil = PhoneNumberUtil.getInstance();

/**
 * Formats a phone number to WhatsApp-compliant E.164 format
 * WhatsApp format: E.164 format (e.g., "+919876543210", "+15551234567")
 *
 * @param phone - Phone number in any format (e.g., "09876543210", "+919876543210", "9876543210")
 * @param defaultRegion - Default region code to use if not present (default: "IN" for India)
 * @returns Formatted phone number in E.164 format (e.g., "+919876543210")
 * @throws Error if the phone number is invalid
 */
export function formatPhoneNumber(
  phone: string,
  defaultRegion: string = "IN",
): string {
  try {
    const number = phoneUtil.parse(phone, defaultRegion);

    if (!phoneUtil.isValidNumber(number)) {
      throw new Error("Invalid phone number");
    }

    return phoneUtil.format(number, PhoneNumberFormat.E164);
  } catch (error) {
    throw new Error(`Invalid phone number: ${phone}`);
  }
}

/**
 * Formats a phone number for search queries
 * Handles both complete and partial phone numbers
 * For complete numbers, returns E.164 format
 * For partial numbers, returns cleaned numeric string for contains search
 *
 * @param phone - Phone number (complete or partial)
 * @param defaultRegion - Default region code to use if not present (default: "IN" for India)
 * @returns Formatted phone number for search
 */
export function formatPhoneNumberForSearch(
  phone: string,
  defaultRegion: string = "IN",
): string {
  try {
    const number = phoneUtil.parse(phone, defaultRegion);

    if (phoneUtil.isValidNumber(number)) {
      return phoneUtil.format(number, PhoneNumberFormat.E164);
    }
  } catch (error) {}

  return phone.replace(/[^\d]/g, "");
}
