/**
 * Sanitizes error messages to prevent exposing sensitive information
 * like database errors, stack traces, or internal details
 */
export function sanitizeErrorMessage(error: unknown): string {
  // If it's already a user-friendly string, return it
  if (typeof error === "string") {
    return sanitizeString(error);
  }

  // If it's an Error object, extract the message
  if (error instanceof Error) {
    return sanitizeString(error.message);
  }

  // If it's an object with a message property
  if (error && typeof error === "object" && "message" in error) {
    return sanitizeString(String(error.message));
  }

  // Default fallback
  return "An unexpected error occurred. Please try again.";
}

/**
 * Sanitizes a string message to remove sensitive information
 */
function sanitizeString(message: string): string {
  if (!message) {
    return "An unexpected error occurred. Please try again.";
  }

  const lowerMessage = message.toLowerCase();

  // Database-related errors
  if (
    lowerMessage.includes("prisma") ||
    lowerMessage.includes("database") ||
    lowerMessage.includes("sql") ||
    lowerMessage.includes("connection") ||
    lowerMessage.includes("query") ||
    lowerMessage.includes("constraint") ||
    lowerMessage.includes("foreign key") ||
    lowerMessage.includes("unique constraint")
  ) {
    // Check for specific user-friendly cases
    if (
      lowerMessage.includes("unique constraint") ||
      lowerMessage.includes("duplicate")
    ) {
      if (lowerMessage.includes("email") || lowerMessage.includes("user")) {
        return "An account with this email already exists.";
      }
      if (lowerMessage.includes("slug")) {
        return "This slug is already taken. Please choose another one.";
      }
      return "This value already exists. Please choose another one.";
    }
    return "A database error occurred. Please try again later.";
  }

  // Network/connection errors
  if (
    lowerMessage.includes("network") ||
    lowerMessage.includes("fetch") ||
    lowerMessage.includes("timeout") ||
    lowerMessage.includes("econnrefused")
  ) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  // Authentication/authorization errors
  if (
    lowerMessage.includes("unauthorized") ||
    lowerMessage.includes("forbidden") ||
    lowerMessage.includes("authentication") ||
    lowerMessage.includes("token") ||
    lowerMessage.includes("session")
  ) {
    if (lowerMessage.includes("invalid") || lowerMessage.includes("expired")) {
      return "Your session has expired. Please sign in again.";
    }
    return "You don't have permission to perform this action.";
  }

  // Validation errors (keep these as they're usually user-friendly)
  if (
    lowerMessage.includes("validation") ||
    lowerMessage.includes("invalid") ||
    lowerMessage.includes("required") ||
    lowerMessage.includes("too short") ||
    lowerMessage.includes("too long") ||
    lowerMessage.includes("must be")
  ) {
    return message; // Keep validation messages as they're user-friendly
  }

  // Zod errors (usually user-friendly)
  if (lowerMessage.includes("zod")) {
    return message; // Zod errors are usually user-friendly
  }

  // Stack traces or technical details
  if (
    message.includes("at ") ||
    message.includes("Error:") ||
    message.includes("Stack:")
  ) {
    return "An unexpected error occurred. Please try again.";
  }

  // If message looks user-friendly (short, no technical terms), return it
  if (message.length < 200 && !lowerMessage.includes("error code")) {
    return message;
  }

  // Default fallback for any unrecognized errors
  return "An unexpected error occurred. Please try again.";
}

/**
 * Extracts user-friendly error message from API response
 */
export function getErrorMessageFromResponse(
  error: unknown,
  defaultMessage: string = "An unexpected error occurred. Please try again.",
): string {
  // If it's a Response object (fetch error)
  if (error && typeof error === "object" && "json" in error) {
    return defaultMessage;
  }

  // If it's an object with error property (common API response format)
  if (error && typeof error === "object" && "error" in error) {
    const errorValue = error.error;
    if (typeof errorValue === "string") {
      return sanitizeErrorMessage(errorValue);
    }
  }

  // If it's an object with message property
  if (error && typeof error === "object" && "message" in error) {
    return sanitizeErrorMessage(error.message);
  }

  // Try to sanitize the error directly
  return sanitizeErrorMessage(error) || defaultMessage;
}

/**
 * Handles API errors and returns a user-friendly message
 */
export async function handleApiError(
  response: Response,
  defaultMessage: string = "An unexpected error occurred. Please try again.",
): Promise<string> {
  try {
    const data = await response.json();
    if (data.error && typeof data.error === "string") {
      return sanitizeErrorMessage(data.error);
    }
    return defaultMessage;
  } catch {
    // If JSON parsing fails, return default message
    return defaultMessage;
  }
}
