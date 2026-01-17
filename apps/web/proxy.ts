import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

// Protected routes that require authentication
const protectedRoutes = [
  "/inbox",
];

// Public routes that should not require authentication
const publicRoutes = ["/view"];

// Auth routes that should redirect authenticated users
const authRoutes = ["/auth", "/login", "/register"];

export function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const hostname = req.headers.get("host") || "";
  const pathname = nextUrl.pathname;

  // ============================================
  // CUSTOM DOMAIN ROUTING (must run first)
  // ============================================
  // Get main app domain from env (without protocol)
  let mainAppDomain: string | null = null;
  try {
    const domainValue = process.env.NEXT_PUBLIC_APP_DOMAIN;
    if (domainValue) {
      // Handle both full URLs and just domain names
      if (
        domainValue.startsWith("http://") ||
        domainValue.startsWith("https://")
      ) {
        const url = new URL(domainValue);
        mainAppDomain = url.hostname || null;
      } else {
        const parts = domainValue.split(":");
        mainAppDomain = parts[0]?.toLowerCase() || null;
      }
    }
  } catch (error) {
    // If URL parsing fails, skip domain check
    console.warn("Failed to parse NEXT_PUBLIC_APP_DOMAIN:", error);
  }

  // Extract domain from hostname (remove port if present)
  const domain = hostname.split(":")[0]?.toLowerCase() || "";

  // Check if this is a custom domain request
  // In development, allow .local domains for testing
  const isDevelopment = process.env.NODE_ENV === "development";
  const isCustomDomain =
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !pathname.startsWith("/_static/") &&
    !pathname.startsWith("/favicon.ico") &&
    !pathname.startsWith("/robots.txt") &&
    !pathname.startsWith("/sitemap.xml") &&
    !pathname.startsWith("/manifest.json") &&
    !pathname.startsWith("/.well-known/") &&
    !pathname.startsWith("/view/") &&
    !pathname.startsWith("/welcome/") &&
    !pathname.startsWith("/auth/") &&
    !(mainAppDomain && domain === mainAppDomain) &&
    domain !== "localhost" &&
    !domain.startsWith("localhost") &&
    domain !== "127.0.0.1" &&
    (domain.includes(".") || (isDevelopment && domain.includes(".local"))); // Allow .local domains in development

  // Handle custom domain routing
  if (isCustomDomain) {
    const normalizedPathname = pathname.replace(/\/$/, "") || "/";

    // Check if this is a document route: /[key]/document/[documentId]
    // Must match exactly: /[key]/document/[documentId] (no trailing slash, no extra segments)
    const documentRouteMatch = normalizedPathname.match(
      /^\/([^/]+)\/document\/([^/]+)$/,
    );
    if (documentRouteMatch) {
      const [, rawKey, documentId] = documentRouteMatch;
      // Validate that key and documentId are not empty
      if (rawKey && documentId) {
        // Rewrite to custom domain document page
        // Domain and key are used as-is (Next.js will handle encoding/decoding in routing)
        const rewriteUrl = new URL(req.url);
        rewriteUrl.pathname = `/${domain}/${rawKey}/document/${documentId}`;
        return NextResponse.rewrite(rewriteUrl);
      }
    }

    // Extract key from pathname (remove leading slash)
    // Next.js already decoded the pathname, so rawKey is the decoded value
    const rawKey = normalizedPathname.slice(1) || "";

    // If no key (root domain), show placeholder
    if (!rawKey || rawKey.trim() === "") {
      // Rewrite to domain placeholder page
      const rewriteUrl = new URL(req.url);
      rewriteUrl.pathname = `/${domain}`;
      return NextResponse.rewrite(rewriteUrl);
    }

    // Rewrite to our custom domain page component
    // Preserve the key as-is (Next.js will handle encoding/decoding in routing)
    const rewriteUrl = new URL(req.url);
    rewriteUrl.pathname = `/${domain}/${rawKey}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  // ============================================
  // AUTHENTICATION & SECURITY HEADERS
  // ============================================
  const sessionCookie = getSessionCookie(req, {
    cookiePrefix: "better-auth",
  });

  const res = NextResponse.next();

  // Only check for UI redirects - NO AUTHORIZATION LOGIC
  const isLoggedIn = !!sessionCookie;
  const isOnPublicRoute = publicRoutes.some((route) =>
    nextUrl.pathname.startsWith(route),
  );
  const isOnProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route),
  );
  const isOnAuthRoute = authRoutes.some(
    (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith(route),
  );

  // Skip authentication checks for public routes (like /view)
  // Also skip security headers for view pages (they have their own CSP in next.config.mjs)
  if (isOnPublicRoute) {
    // View pages need frame-ancestors * for embedding, which is set in next.config.mjs
    // Don't override with restrictive CSP here
    return res;
  }

  // Redirect authenticated users away from auth pages to home page
  if (isOnAuthRoute && isLoggedIn) {
    const returnTo = nextUrl.searchParams.get("returnTo");
    // If returnTo is an invitation link, redirect there instead
    if (returnTo && returnTo.includes("?invite=1")) {
      // Ensure returnTo is treated as a path (not absolute URL)
      const returnPath = returnTo.startsWith("/") ? returnTo : `/${returnTo}`;
      return NextResponse.redirect(new URL(returnPath, req.url));
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Redirect unauthenticated users from root to login
  if (!isLoggedIn && pathname === "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // UI redirects only (for better UX, not security)
  if (isOnProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    // Preserve full URL including query parameters (e.g., ?invite=1)
    const fullPath = nextUrl.pathname + nextUrl.search;
    loginUrl.searchParams.set("returnTo", fullPath);
    return NextResponse.redirect(loginUrl);
  }

  // Enhanced security headers (following Supabase best practices)
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  // HSTS header for HTTPS (only in production)
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  // Enhanced Content Security Policy for production-ready OAuth
  const companionUrl =
    process.env.NEXT_PUBLIC_COMPANION_URL || "http://localhost:3020";

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://cdnjs.cloudflare.com",
    "script-src-elem 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com",
    "worker-src 'self' blob: https://cdnjs.cloudflare.com https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://accounts.google.com",
    "img-src 'self' data: https: blob: lh3.googleusercontent.com https://ssl.gstatic.com",
    "font-src 'self' data: https://fonts.gstatic.com https://unpkg.com",
    `connect-src 'self' ${companionUrl} https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://cdnjs.cloudflare.com https://unpkg.com https://*.amazonaws.com https://api.trigger.dev wss: ws: blob:`,
    "frame-src 'self' https://accounts.google.com https://oauth2.googleapis.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com",
  ].join("; ");

  res.headers.set("Content-Security-Policy", csp);

  res.headers.set("Cross-Origin-Opener-Policy", "unsafe-none");
  res.headers.set("Cross-Origin-Embedder-Policy", "unsafe-none");

  // Additional headers for OAuth flow
  res.headers.set("Cross-Origin-Resource-Policy", "cross-origin");

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - api/upload/tus (TUS upload routes - resumable upload protocol)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml, manifest.json, .well-known (static files)
     */
    "/((?!api/auth|api/upload/tus|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.well-known/).*)",
  ],
};
