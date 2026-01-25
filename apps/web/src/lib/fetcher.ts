import { handleApiError } from "./utils/error-handler";

export async function fetcher<T = unknown>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorMessage = await handleApiError(
      response,
      `Failed to ${options?.method || "fetch"}. Please try again.`,
    );
    throw new Error(errorMessage);
  }

  return response.json();
}
