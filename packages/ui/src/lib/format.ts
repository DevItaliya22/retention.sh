export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {},
) {
  if (!date) return "";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: opts.month ?? "long",
      day: opts.day ?? "numeric",
      year: opts.year ?? "numeric",
      ...opts,
    }).format(new Date(date));
  } catch (_err) {
    console.log("_err in formatDate", _err);
    return "";
  }
}

/**
 * Formats a date as relative time, handling both past and future dates.
 *
 * Past dates:
 * - Very recent (< 1 minute): "just now"
 * - Minutes (< 1 hour): "2m ago", "15m ago"
 * - Hours (< 24 hours): "3h ago", "12h ago"
 * - Yesterday: "Yesterday"
 * - This week (< 7 days): "Monday", "Tuesday", etc.
 * - This year: "Jan 15", "Feb 3" (month and day)
 * - Older: "Jan 15, 2024" (full date with year)
 *
 * Future dates:
 * - Very soon (< 1 minute): "just now"
 * - Minutes (< 1 hour): "in 2m", "in 15m"
 * - Hours (< 24 hours): "in 3h", "in 12h"
 * - Tomorrow: "Tomorrow"
 * - This week (< 7 days): "Monday", "Tuesday", etc.
 * - This year: "Jan 15", "Feb 3" (month and day)
 * - Future: "Jan 15, 2025" (full date with year)
 *
 * @param date - The date to format
 * @returns Formatted relative time or date string
 */
export function formatRelativeTime(
  date: Date | string | number | null | undefined,
): string {
  if (!date) return "";

  try {
    const dateObj = new Date(date);
    if (Number.isNaN(dateObj.getTime())) return "";

    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - dateObj.getTime()) / 1000,
    );
    const absDiffInSeconds = Math.abs(diffInSeconds);
    const diffInDays = Math.floor(absDiffInSeconds / 86400);
    const isFuture = diffInSeconds < 0;

    // Very recent or very soon (< 1 minute)
    if (absDiffInSeconds < 60) {
      return "just now";
    }

    // Less than 1 hour - show minutes
    if (absDiffInSeconds < 3600) {
      const minutes = Math.floor(absDiffInSeconds / 60);
      return isFuture ? `in ${minutes}m` : `${minutes}m ago`;
    }

    // Less than 24 hours - show hours
    if (absDiffInSeconds < 86400) {
      const hours = Math.floor(absDiffInSeconds / 3600);
      return isFuture ? `in ${hours}h` : `${hours}h ago`;
    }

    // Tomorrow or Yesterday
    if (diffInDays === 1) {
      return isFuture ? "Tomorrow" : "Yesterday";
    }

    // Within the next/last 7 days - show day name
    if (diffInDays < 7) {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
      }).format(dateObj);
    }

    // Same year - show month and day
    if (dateObj.getFullYear() === now.getFullYear()) {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(dateObj);
    }

    // Different year - show full date
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(dateObj);
  } catch {
    return "";
  }
}
