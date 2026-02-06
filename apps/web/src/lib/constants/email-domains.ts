export const EMAIL_DOMAIN_SUFFIXES = [
  { label: ".com", value: "com" },
  { label: ".in", value: "in" },
  { label: ".co", value: "co" },
  { label: ".org", value: "org" },
  { label: ".net", value: "net" },
  { label: ".io", value: "io" },
  { label: ".co.in", value: "co.in" },
  { label: ".co.uk", value: "co.uk" },
  { label: ".store", value: "store" },
  { label: ".shop", value: "shop" },
  { label: ".biz", value: "biz" },
] as const;

export const DEFAULT_EMAIL_DOMAIN_SUFFIX = "com";

export type EmailDomainSuffix = (typeof EMAIL_DOMAIN_SUFFIXES)[number]["value"];
