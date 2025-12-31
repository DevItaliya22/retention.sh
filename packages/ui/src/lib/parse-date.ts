import * as chrono from "chrono-node";

export interface ParseDateOptions {
  /**
   * Reference date for relative parsing (defaults to now)
   */
  referenceDate?: Date;
  /**
   * Minimum allowed date (will return null if parsed date is before this)
   */
  minDate?: Date;
  /**
   * Whether to default to end of day if no time is specified
   */
  defaultToEndOfDay?: boolean;
}

export interface ParseDateResult {
  /**
   * The parsed date, or null if parsing failed
   */
  date: Date | null;
  /**
   * Error message if parsing failed
   */
  error?: string;
}

/**
 * Parses a natural language date string using chrono-node
 *
 * @param input - Natural language date string (e.g., "in 30 days", "next week", "December 25th")
 * @param options - Parsing options
 * @returns ParseDateResult with the parsed date or error message
 *
 * @example
 * ```ts
 * parseNaturalDate("in 30 days") // Returns date 30 days from now
 * parseNaturalDate("next week") // Returns date for next week
 * parseNaturalDate("December 25th") // Returns date for December 25th
 * ```
 */
export function parseNaturalDate(
  input: string,
  options: ParseDateOptions = {},
): ParseDateResult {
  const {
    referenceDate = new Date(),
    minDate,
    defaultToEndOfDay = false,
  } = options;

  if (!input.trim()) {
    return { date: null, error: "Input is empty" };
  }

  try {
    const parsed = chrono.parseDate(input, referenceDate, {
      forwardDate: true,
    });

    if (!parsed) {
      return {
        date: null,
        error:
          "Could not parse date. Try: 'in 30 days', 'next week', 'December 25th'",
      };
    }

    // Ensure the parsed date is not in the past if minDate is set
    if (minDate && parsed < minDate) {
      return { date: null, error: "Date must be in the future" };
    }

    // Apply defaultToEndOfDay only if chrono parsed a date-only expression (no specific time)
    // We detect this by checking if the parsed time is at midnight (00:00:00)
    // and the input doesn't contain explicit time references
    if (defaultToEndOfDay) {
      const parsedHours = parsed.getHours();
      const parsedMinutes = parsed.getMinutes();
      const parsedSeconds = parsed.getSeconds();
      const isAtMidnight =
        parsedHours === 0 && parsedMinutes === 0 && parsedSeconds === 0;

      // Check if input contains explicit time references
      const hasExplicitTime =
        input.match(/\d{1,2}:\d{2}/) || // "14:30" or "2:30"
        input.match(/\d{1,2}\s*(am|pm)/i) || // "2pm" or "2 pm"
        // Relative time expressions: "in 2 hours", "in 30 minutes", "in a two min", etc.
        /in\s+(a|an|\d+|\w+)\s+\w*\s*(second|minute|hour|sec|min|hr|seconds|minutes|hours|secs|mins|hrs)/i.test(
          input,
        ) ||
        /\d+\s+\w*\s*(second|minute|hour|sec|min|hr|seconds|minutes|hours|secs|mins|hrs)\s+(from\s+now|later)/i.test(
          input,
        );

      // Only apply end of day if:
      // 1. Parsed time is at midnight (chrono defaulted to start of day)
      // 2. No explicit time was provided in the input
      // This means chrono parsed a date-only expression like "tomorrow" or "December 25th"
      if (isAtMidnight && !hasExplicitTime) {
        parsed.setHours(23);
        parsed.setMinutes(59);
        parsed.setSeconds(0);
        parsed.setMilliseconds(0);
      }
    }

    return { date: parsed };
  } catch {
    return {
      date: null,
      error:
        "Could not parse date. Try: 'in 30 days', 'next week', 'December 25th'",
    };
  }
}
