import slugify from "slugify";

// Reserved slugs that cannot be used for workspaces
export const RESERVED_SLUGS = [
  "cashier",
  "cashiers",
  "api",
  "dy",
  "dy-cashier",
  "dy-cashiers",
  "dy-cashier-login",
  "dy-cashier-login",
  "admin",
  "viewer",
  "viewers",
  "app",
  "www",
  "mail",
  "ftp",
  "blog",
  "help",
  "support",
  "docs",
  "status",
  "dashboard",
  "login",
  "signup",
  "auth",
  "oauth",
  "billing",
  "pricing",
  "about",
  "contact",
  "privacy",
  "terms",
  "legal",
  "security",
  "careers",
  "jobs",
  "press",
  "news",
  "media",
  "investors",
  "partners",
  "developers",
  "integrations",
  "marketplace",
  "community",
  "forum",
  "chat",
  "support",
  "feedback",
  "bug",
  "feature",
  "roadmap",
];

export function generateSlug(name: string): string {
  const slug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });

  return slug || "";
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase());
}
