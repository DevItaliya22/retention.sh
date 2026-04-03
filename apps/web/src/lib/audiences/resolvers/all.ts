import { db } from "@reelo/db";
import type { AudienceChecker, AudienceResolver } from "../types";

export const resolveAllAudience: AudienceResolver = async (
  businessId,
  param,
) => {
  if (param !== "customers") return [];

  const rows = await db.businessCustomer.findMany({
    where: { businessId },
    select: { customerId: true },
  });

  return rows.map((row) => row.customerId);
};

export const checkAllAudience: AudienceChecker = async (
  dbClient,
  businessId,
  customerId,
  param,
) => {
  if (param !== "customers") return false;

  const membership = await dbClient.businessCustomer.findUnique({
    where: {
      businessId_customerId: {
        businessId,
        customerId,
      },
    },
    select: { customerId: true },
  });

  return membership !== null;
};
