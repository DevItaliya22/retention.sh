import type { Prisma } from "@reelo/db";

export type AudienceResolver = (
  businessId: string,
  param: string,
) => Promise<string[]>;

export type AudienceChecker = (
  dbClient: Prisma.TransactionClient,
  businessId: string,
  customerId: string,
  param: string,
) => Promise<boolean>;

export interface AudienceMeta {
  key: string;
  label: string;
  description: string;
}
