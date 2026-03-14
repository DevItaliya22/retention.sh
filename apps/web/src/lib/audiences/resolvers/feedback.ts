import type { Prisma } from "@reelo/db";
import { db } from "@reelo/db";
import type { AudienceChecker, AudienceResolver } from "../types";

function parseRating(param: string): number | null {
  const ratingStr = param.replace("rating_", "");
  const rating = Number(ratingStr);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  return rating;
}

export const resolveFeedbackAudience: AudienceResolver = async (
  businessId,
  param,
) => {
  const rating = parseRating(param);
  if (rating === null) return [];

  const responses = await db.feedbackResponse.findMany({
    where: { businessId, rating },
    select: { customerId: true },
    distinct: ["customerId"],
  });

  return responses.map((r) => r.customerId);
};

export const checkFeedbackAudience: AudienceChecker = async (
  dbClient: Prisma.TransactionClient,
  businessId,
  customerId,
  param,
) => {
  const rating = parseRating(param);
  if (rating === null) return false;

  const match = await dbClient.feedbackResponse.findFirst({
    where: { businessId, customerId, rating },
    select: { id: true },
  });

  return match !== null;
};
