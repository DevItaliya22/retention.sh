import { db } from "@reelo/db";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createDemoAccounts } from "../generator";
import type { DemoCredentialLog, DemoScenarioKey } from "../types";
import type { RuntimeAccount } from "./types";

const CREDENTIALS_PATH = path.join(
  process.cwd(),
  "demo",
  "logs",
  "credentials.json",
);

async function readCredentials(): Promise<DemoCredentialLog[]> {
  const raw = await fs.readFile(CREDENTIALS_PATH, "utf8");
  const parsed = JSON.parse(raw) as DemoCredentialLog[];
  if (!Array.isArray(parsed)) {
    throw new Error("Invalid credentials.json format");
  }
  return parsed;
}

async function ensureCredentials(
  requiredKeys: DemoScenarioKey[],
): Promise<DemoCredentialLog[]> {
  let credentials: DemoCredentialLog[] = [];

  try {
    credentials = await readCredentials();
  } catch {
    await createDemoAccounts({ scenarioKeys: requiredKeys });
    credentials = await readCredentials();
  }

  const existing = new Set(credentials.map((c) => c.accountKey));
  const missing = requiredKeys.filter((k) => !existing.has(k));
  if (missing.length > 0) {
    await createDemoAccounts({ scenarioKeys: missing });
    credentials = await readCredentials();
  }

  // Partner scenarios must come from the same run so that partnership linkage exists.
  const needsPartnerPair =
    requiredKeys.includes("partner_left") &&
    requiredKeys.includes("partner_right");
  if (needsPartnerPair) {
    const leftRuns = new Set(
      credentials
        .filter((c) => c.accountKey === "partner_left")
        .map((c) => c.runId),
    );
    const rightRuns = new Set(
      credentials
        .filter((c) => c.accountKey === "partner_right")
        .map((c) => c.runId),
    );
    const hasCommonRun = [...leftRuns].some((runId) => rightRuns.has(runId));
    if (!hasCommonRun) {
      await createDemoAccounts({
        scenarioKeys: ["partner_left", "partner_right"],
      });
      credentials = await readCredentials();
    }
  }

  return credentials;
}

export async function loadRuntimeAccounts(
  requiredKeys: DemoScenarioKey[],
): Promise<Map<DemoScenarioKey, RuntimeAccount>> {
  const credentials = await ensureCredentials(requiredKeys);
  const latestByKey = new Map<DemoScenarioKey, DemoCredentialLog>();

  const needsPartnerPair =
    requiredKeys.includes("partner_left") &&
    requiredKeys.includes("partner_right");
  let partnerRunId: string | null = null;
  if (needsPartnerPair) {
    const leftRuns = new Set(
      credentials
        .filter((c) => c.accountKey === "partner_left")
        .map((c) => c.runId),
    );
    const commonRuns = credentials
      .filter((c) => c.accountKey === "partner_right" && leftRuns.has(c.runId))
      .map((c) => c.runId)
      .sort((a, b) => b.localeCompare(a));
    partnerRunId = commonRuns[0] ?? null;
    if (!partnerRunId) {
      throw new Error(
        "Could not find a matched partner_left/partner_right run in credentials.",
      );
    }
  }

  for (const key of requiredKeys) {
    const matches = credentials
      .filter((c) => {
        if (c.accountKey !== key) return false;
        if (
          partnerRunId &&
          (key === "partner_left" || key === "partner_right")
        ) {
          return c.runId === partnerRunId;
        }
        return true;
      })
      .sort((a, b) => b.runId.localeCompare(a.runId));
    const latest = matches[0];
    if (!latest) {
      throw new Error(`Missing credentials for ${key}`);
    }
    latestByKey.set(key, latest);
  }

  const result = new Map<DemoScenarioKey, RuntimeAccount>();

  for (const key of requiredKeys) {
    const cred = latestByKey.get(key);
    if (!cred) continue;

    const business = await db.business.findUnique({
      where: { slug: cred.businessSlug },
      select: { id: true },
    });
    if (!business) {
      throw new Error(`Business not found for ${key}: ${cred.businessSlug}`);
    }

    const cashier = await db.cashier.findUnique({
      where: { id: cred.cashierId },
      select: { cashierLinkSlug: true, businessId: true },
    });
    if (!cashier) {
      throw new Error(`Cashier not found for ${key}`);
    }

    const activeSku = await db.sku.findFirst({
      where: { businessId: business.id, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    const inactiveSku = await db.sku.findFirst({
      where: { businessId: business.id, isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (!activeSku || !inactiveSku) {
      throw new Error(`SKUs not found for ${key}`);
    }

    await db.sku.update({
      where: { id: inactiveSku.id },
      data: { isActive: false },
    });

    result.set(key, {
      accountKey: key,
      businessId: business.id,
      businessSlug: cred.businessSlug,
      cashierSlug: cashier.cashierLinkSlug,
      cashierEmail: cred.cashierEmail,
      cashierPassword: cred.cashierPassword,
      activeSkuId: activeSku.id,
      inactiveSkuId: inactiveSku.id,
    });
  }

  // Ensure partner pair is actually linked in DB for preview/redeem tests.
  const left = result.get("partner_left");
  const right = result.get("partner_right");
  if (left && right) {
    const existingPartnership = await db.businessPartnership.findFirst({
      where: {
        status: "ACTIVE",
        AND: [
          { members: { some: { businessId: left.businessId } } },
          { members: { some: { businessId: right.businessId } } },
        ],
      },
      select: { id: true },
    });

    if (!existingPartnership) {
      await db.businessPartnership.create({
        data: {
          status: "ACTIVE",
          sharedReferrals: true,
          shareReferralRewards: true,
          sharedCampaigns: true,
          members: {
            create: [
              {
                businessId: left.businessId,
                exchangeRate: 1,
                pointToCurrencyRate: 1,
              },
              {
                businessId: right.businessId,
                exchangeRate: 1,
                pointToCurrencyRate: 1,
              },
            ],
          },
        },
      });
    }
  }

  return result;
}
