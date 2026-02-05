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

  if (response.status === 401 && typeof window !== "undefined") {
    try {
      await fetch("/api/auth/revoke", { method: "POST" });
    } finally {
      // Customer on loyalty page → redirect to that business's login (slug in path)
      const loyaltyMatch =
        window.location.pathname.match(/^\/loyalty\/([^/]+)/);
      if (loyaltyMatch) {
        const businessSlug = loyaltyMatch[1];
        const search = window.location.search || "";
        window.location.href = `/loyalty/${businessSlug}/login${search}`;
      } else {
        window.location.href = "/login";
      }
    }
    throw new Error("Session expired or invalid. Please sign in again.");
  }

  if (!response.ok) {
    const errorMessage = await handleApiError(
      response,
      `Failed to ${options?.method || "fetch"}. Please try again.`,
    );
    throw new Error(errorMessage);
  }

  return response.json();
}
