import type { ApiResponse } from "./types";

function parseSetCookie(value: string): { name: string; val: string } | null {
  const first = value.split(";", 1)[0]?.trim();
  if (!first || !first.includes("=")) return null;
  const idx = first.indexOf("=");
  return {
    name: first.slice(0, idx),
    val: first.slice(idx + 1),
  };
}

export class CookieSessionClient {
  private cookies = new Map<string, string>();

  constructor(private readonly baseUrl: string) {}

  private cookieHeader(): string | undefined {
    if (this.cookies.size === 0) return undefined;
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  private saveCookies(response: Response): void {
    const anyHeaders = response.headers as unknown as {
      getSetCookie?: () => string[];
      raw?: () => Record<string, string[]>;
    };

    const values: string[] =
      anyHeaders.getSetCookie?.() ?? anyHeaders.raw?.()["set-cookie"] ?? [];

    for (const raw of values) {
      const parsed = parseSetCookie(raw);
      if (!parsed) continue;
      this.cookies.set(parsed.name, parsed.val);
    }
  }

  async request<T = unknown>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    const cookie = this.cookieHeader();
    if (cookie) headers.Cookie = cookie;

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    this.saveCookies(response);

    const text = await response.text();
    let data: T | null = null;
    try {
      data = text ? (JSON.parse(text) as T) : null;
    } catch {
      data = null;
    }

    return {
      status: response.status,
      ok: response.ok,
      data,
      text,
    };
  }
}
