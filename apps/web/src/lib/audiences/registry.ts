import type { Prisma } from "@reelo/db";
import { checkAllAudience, resolveAllAudience } from "./resolvers/all";
import {
  checkFeedbackAudience,
  resolveFeedbackAudience,
} from "./resolvers/feedback";
import {
  checkSegmentAudience,
  resolveSegmentAudience,
} from "./resolvers/segment";
import type { AudienceChecker, AudienceMeta, AudienceResolver } from "./types";

const resolverMap: Record<string, AudienceResolver> = {
  all: resolveAllAudience,
  segment: resolveSegmentAudience,
  feedback: resolveFeedbackAudience,
};

const checkerMap: Record<string, AudienceChecker> = {
  all: checkAllAudience,
  segment: checkSegmentAudience,
  feedback: checkFeedbackAudience,
};

function parseAudienceKey(key: string): { prefix: string; param: string } {
  const colonIndex = key.indexOf(":");
  if (colonIndex === -1) return { prefix: key, param: "" };
  return {
    prefix: key.slice(0, colonIndex),
    param: key.slice(colonIndex + 1),
  };
}

export async function resolveAudience(
  businessId: string,
  audienceKey: string,
): Promise<string[]> {
  const { prefix, param } = parseAudienceKey(audienceKey);
  const resolver = resolverMap[prefix];
  if (!resolver) return [];
  return resolver(businessId, param);
}

export async function resolveAudiences(
  businessId: string,
  keys: string[],
): Promise<string[]> {
  if (keys.length === 0) return [];
  const results = await Promise.all(
    keys.map((key) => resolveAudience(businessId, key)),
  );
  const union = new Set<string>();
  for (const ids of results) {
    for (const id of ids) union.add(id);
  }
  return Array.from(union);
}

export async function isCustomerInAudience(
  dbClient: Prisma.TransactionClient,
  businessId: string,
  customerId: string,
  keys: string[],
): Promise<boolean> {
  if (keys.length === 0) return true;
  for (const key of keys) {
    const { prefix, param } = parseAudienceKey(key);
    const checker = checkerMap[prefix];
    if (!checker) continue;
    const match = await checker(dbClient, businessId, customerId, param);
    if (match) return true;
  }
  return false;
}

const RATING_LABELS: Record<string, string> = {
  rating_1: "1-star feedback",
  rating_2: "2-star feedback",
  rating_3: "3-star feedback",
  rating_4: "4-star feedback",
  rating_5: "5-star feedback",
};

export function getAudienceLabel(key: string): string {
  const { prefix, param } = parseAudienceKey(key);
  if (prefix === "all" && param === "customers") return "ALL customers";
  if (prefix === "segment") return `Segment: ${param}`;
  if (prefix === "feedback")
    return RATING_LABELS[param] ?? `Feedback: ${param}`;
  return key;
}

export function listBuiltinAudiences(): AudienceMeta[] {
  return [
    {
      key: "all:customers",
      label: "ALL customers",
      description: "All customers of this business",
    },
    {
      key: "feedback:rating_1",
      label: "1-star feedback",
      description: "Customers who gave 1-star feedback",
    },
    {
      key: "feedback:rating_2",
      label: "2-star feedback",
      description: "Customers who gave 2-star feedback",
    },
    {
      key: "feedback:rating_3",
      label: "3-star feedback",
      description: "Customers who gave 3-star feedback",
    },
    {
      key: "feedback:rating_4",
      label: "4-star feedback",
      description: "Customers who gave 4-star feedback",
    },
    {
      key: "feedback:rating_5",
      label: "5-star feedback",
      description: "Customers who gave 5-star feedback",
    },
  ];
}
