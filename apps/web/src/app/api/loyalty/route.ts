import { withAdminAuth } from "@/lib/auth/middleware";
import {
  loyaltyCreateSchema,
  loyaltyUpdateSchema,
  type LoyaltyCreateInput,
} from "@/lib/schemas/loyalty";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapLoyaltyResponse(loyalty: Awaited<ReturnType<typeof fetchLoyalty>>) {
  if (!loyalty) return null;
  return {
    ...loyalty,
    termsAndConditions: loyalty.termsAndConditions.map((t) => ({
      id: t.id,
      content: t.content,
    })),
    branding: loyalty.branding
      ? {
          logo: loyalty.branding.logo,
          themeColor: loyalty.branding.themeColor,
          textColor: loyalty.branding.textColor,
          bannerImage: loyalty.branding.bannerImage,
          header: loyalty.branding.header,
          subtitle: loyalty.branding.subtitle,
        }
      : null,
  };
}

async function fetchLoyalty(businessId: string) {
  return db.loyalty.findUnique({
    where: { businessId },
    include: {
      cashbackConfig: true,
      tierConfig: { include: { tiers: { orderBy: { rank: "asc" } } } },
      amountSpentConfig: {
        include: { rewardStages: { orderBy: { pointsRequired: "asc" } } },
      },
      visitMadeConfig: {
        include: { rewardStages: { orderBy: { pointsRequired: "asc" } } },
      },
      termsAndConditions: { orderBy: { createdAt: "asc" } },
      branding: true,
    },
  });
}

// ─── GET ────────────────────────────────────────────────────────────────────

export const GET = withAdminAuth(async (_request, context) => {
  try {
    const loyalty = await fetchLoyalty(context.business.id);
    return NextResponse.json({ loyalty: mapLoyaltyResponse(loyalty) });
  } catch (error: unknown) {
    console.error("Failed to fetch loyalty settings:", error);
    return NextResponse.json(
      {
        loyalty: null,
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch loyalty settings. Please try again.",
      },
      { status: 500 },
    );
  }
});

// ─── POST (Create onboarding) ────────────────────────────────────────────────

export const POST = withAdminAuth(async (request, context) => {
  try {
    const body = await request.json();
    const validation = validateSchema(loyaltyCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { loyalty: null, error: validation.error },
        { status: 400 },
      );
    }

    const data = validation.data as LoyaltyCreateInput;
    const businessId = context.business.id;

    const result = await db.$transaction(async (tx) => {
      // 1. Upsert branding
      let brandingId: string | null = null;
      if (data.branding != null) {
        const branding = await tx.branding.upsert({
          where: { businessId },
          create: {
            businessId,
            logo: data.branding.logo ?? null,
            themeColor: data.branding.themeColor ?? null,
            textColor: data.branding.textColor ?? null,
            bannerImage: data.branding.bannerImage ?? null,
            header: data.branding.header ?? null,
            subtitle: data.branding.subtitle ?? null,
          },
          update: {
            logo: data.branding.logo ?? null,
            themeColor: data.branding.themeColor ?? null,
            textColor: data.branding.textColor ?? null,
            bannerImage: data.branding.bannerImage ?? null,
            header: data.branding.header ?? null,
            subtitle: data.branding.subtitle ?? null,
          },
        });
        brandingId = branding.id;
      }

      // 2. Create Loyalty
      const loyalty = await tx.loyalty.create({
        data: {
          businessId,
          loyaltyType: data.loyaltyType,
          brandingId,
          pointReminderDays: data.pointReminderDays ?? null,
          pointExpiryDays: data.pointExpiryDays ?? null,
          whatsappEnabled: data.whatsappEnabled ?? false,
          emailEnabled: data.emailEnabled ?? false,
          smsEnabled: data.smsEnabled ?? false,
        },
      });

      // 3. Create type-specific config
      if (data.loyaltyType === "CASHBACK" && "cashbackConfig" in data) {
        await tx.loyaltyCashbackConfig.create({
          data: {
            loyaltyId: loyalty.id,
            cashbackPercentage: data.cashbackConfig.cashbackPercentage ?? 0,
            onFinalAmount: data.cashbackConfig.onFinalAmount ?? false,
            maxCashbackCap: data.cashbackConfig.maxCashbackCap ?? null,
            minPurchaseForEarningEnabled:
              data.cashbackConfig.minPurchaseForEarningEnabled ?? false,
            minPurchaseForEarning:
              data.cashbackConfig.minPurchaseForEarning ?? null,
            minPurchaseForRedemptionEnabled:
              data.cashbackConfig.minPurchaseForRedemptionEnabled ?? false,
            minPurchaseForRedemption:
              data.cashbackConfig.minPurchaseForRedemption ?? null,
            redemptionBalanceLimitEnabled:
              data.cashbackConfig.redemptionBalanceLimitEnabled ?? false,
            redemptionBalanceLimitAmount:
              data.cashbackConfig.redemptionBalanceLimitAmount ?? null,
            redemptionBalanceLimitPercentage:
              data.cashbackConfig.redemptionBalanceLimitPercentage ?? null,
            redemptionBillLimitEnabled:
              data.cashbackConfig.redemptionBillLimitEnabled ?? false,
            redemptionBillLimitAmount:
              data.cashbackConfig.redemptionBillLimitAmount ?? null,
            redemptionBillLimitPercentage:
              data.cashbackConfig.redemptionBillLimitPercentage ?? null,
          },
        });
      }

      if (data.loyaltyType === "TIER" && "tierConfig" in data) {
        const tierConfig = await tx.loyaltyTierConfig.create({
          data: {
            loyaltyId: loyalty.id,
            pointsPerRupee: data.tierConfig.pointsPerRupee ?? 1,
            maxCashbackCapEnabled:
              data.tierConfig.maxCashbackCapEnabled ?? false,
            maxCashbackCap: data.tierConfig.maxCashbackCap ?? null,
          },
        });
        for (const tier of data.tierConfig.tiers) {
          await tx.loyaltyTier.create({
            data: {
              tierConfigId: tierConfig.id,
              name: tier.name,
              rank: tier.rank,
              minLifetimeSpend: tier.minLifetimeSpend,
              maxLifetimeSpend: tier.maxLifetimeSpend ?? null,
              cashbackPercentage: tier.cashbackPercentage ?? 0,
              minPurchaseForEarningEnabled:
                tier.minPurchaseForEarningEnabled ?? false,
              minPurchaseForEarning: tier.minPurchaseForEarning ?? null,
              minPurchaseForRedemptionEnabled:
                tier.minPurchaseForRedemptionEnabled ?? false,
              minPurchaseForRedemption: tier.minPurchaseForRedemption ?? null,
              maxCashbackCapEnabled: tier.maxCashbackCapEnabled ?? false,
              maxCashbackCap: tier.maxCashbackCap ?? null,
            },
          });
        }
      }

      if (data.loyaltyType === "AMOUNT_SPENT" && "amountSpentConfig" in data) {
        const amountSpentConfig = await tx.loyaltyAmountSpentConfig.create({
          data: {
            loyaltyId: loyalty.id,
            pointsPerRupee: data.amountSpentConfig.pointsPerRupee ?? 1,
            onFinalAmount: data.amountSpentConfig.onFinalAmount ?? false,
            maxPointsPerPurchase:
              data.amountSpentConfig.maxPointsPerPurchase ?? null,
          },
        });
        const stages =
          "rewardStages" in data && Array.isArray(data.rewardStages)
            ? data.rewardStages
            : [];
        for (const stage of stages) {
          await tx.loyaltyRewardStage.create({
            data: {
              amountSpentConfigId: amountSpentConfig.id,
              pointsRequired: stage.pointsRequired,
              rewardType: stage.rewardType,
              rewardName: stage.rewardName,
              freeItemSkuId: stage.freeItemSkuId ?? null,
              freeItemName: stage.freeItemName ?? null,
              percentageValue: stage.percentageValue ?? null,
              appliesToEntirePurchase: stage.appliesToEntirePurchase ?? true,
              specificProductIds: stage.specificProductIds ?? [],
              cashAmount: stage.cashAmount ?? null,
              minPurchaseForRedemptionEnabled:
                stage.minPurchaseForRedemptionEnabled ?? false,
              minPurchaseForRedemption: stage.minPurchaseForRedemption ?? null,
              maxDiscountCapEnabled: stage.maxDiscountCapEnabled ?? false,
              maxDiscountCap: stage.maxDiscountCap ?? null,
            },
          });
        }
      }

      if (data.loyaltyType === "VISIT_MADE" && "visitMadeConfig" in data) {
        const visitMadeConfig = await tx.loyaltyVisitMadeConfig.create({
          data: {
            loyaltyId: loyalty.id,
            pointsPerVisit: data.visitMadeConfig.pointsPerVisit ?? 1,
            visitIntervalEnabled:
              data.visitMadeConfig.visitIntervalEnabled ?? false,
            visitIntervalValue: data.visitMadeConfig.visitIntervalValue ?? null,
            visitIntervalUnit: data.visitMadeConfig.visitIntervalUnit ?? null,
          },
        });
        const stages =
          "rewardStages" in data && Array.isArray(data.rewardStages)
            ? data.rewardStages
            : [];
        for (const stage of stages) {
          await tx.loyaltyRewardStage.create({
            data: {
              visitMadeConfigId: visitMadeConfig.id,
              pointsRequired: stage.pointsRequired,
              rewardType: stage.rewardType,
              rewardName: stage.rewardName,
              freeItemSkuId: stage.freeItemSkuId ?? null,
              freeItemName: stage.freeItemName ?? null,
              percentageValue: stage.percentageValue ?? null,
              appliesToEntirePurchase: stage.appliesToEntirePurchase ?? true,
              specificProductIds: stage.specificProductIds ?? [],
              cashAmount: stage.cashAmount ?? null,
              minPurchaseForRedemptionEnabled:
                stage.minPurchaseForRedemptionEnabled ?? false,
              minPurchaseForRedemption: stage.minPurchaseForRedemption ?? null,
              maxDiscountCapEnabled: stage.maxDiscountCapEnabled ?? false,
              maxDiscountCap: stage.maxDiscountCap ?? null,
            },
          });
        }
      }

      // 4. Create T&C
      const rawTerms = data.termsAndConditions ?? [];
      const terms = rawTerms.filter(
        (s): s is string => typeof s === "string" && s.trim().length > 0,
      );
      for (const content of terms) {
        await tx.termsAndConditions.create({
          data: { content: content.trim(), loyaltyId: loyalty.id },
        });
      }
    });

    const updated = await fetchLoyalty(businessId);
    return NextResponse.json({ loyalty: mapLoyaltyResponse(updated) });
  } catch (error: unknown) {
    console.error("Failed to create loyalty program:", error);
    return NextResponse.json(
      {
        loyalty: null,
        error:
          sanitizeErrorMessage(error) ||
          "Failed to create loyalty program. Please try again.",
      },
      { status: 500 },
    );
  }
});

// ─── PUT (Update by section) ────────────────────────────────────────────────

export const PUT = withAdminAuth(async (request, context) => {
  try {
    const body = await request.json();
    const validation = validateSchema(loyaltyUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { loyalty: null, error: validation.error },
        { status: 400 },
      );
    }

    const data = validation.data;
    const businessId = context.business.id;
    const section = data.section;

    const existing = await db.loyalty.findUnique({
      where: { businessId },
      include: {
        cashbackConfig: true,
        tierConfig: { include: { tiers: true } },
        amountSpentConfig: true,
        visitMadeConfig: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { loyalty: null, error: "Loyalty program not found" },
        { status: 404 },
      );
    }

    if (section === "common") {
      await db.loyalty.update({
        where: { businessId },
        data: {
          pointReminderDays: data.pointReminderDays ?? null,
          pointExpiryDays: data.pointExpiryDays ?? null,
          whatsappEnabled: data.whatsappEnabled ?? false,
          emailEnabled: data.emailEnabled ?? false,
          smsEnabled: data.smsEnabled ?? false,
        },
      });
      const rawTerms = data.termsAndConditions ?? [];
      const terms = rawTerms.filter(
        (s): s is string => typeof s === "string" && s.trim().length > 0,
      );
      await db.$transaction([
        db.termsAndConditions.deleteMany({ where: { loyaltyId: existing.id } }),
        ...terms.map((content) =>
          db.termsAndConditions.create({
            data: { content: content.trim(), loyaltyId: existing.id },
          }),
        ),
      ]);
    }

    if (section === "branding" && data.branding != null) {
      const branding = await db.branding.upsert({
        where: { businessId },
        create: {
          businessId,
          logo: data.branding.logo ?? null,
          themeColor: data.branding.themeColor ?? null,
          textColor: data.branding.textColor ?? null,
          bannerImage: data.branding.bannerImage ?? null,
          header: data.branding.header ?? null,
          subtitle: data.branding.subtitle ?? null,
        },
        update: {
          logo: data.branding.logo ?? null,
          themeColor: data.branding.themeColor ?? null,
          textColor: data.branding.textColor ?? null,
          bannerImage: data.branding.bannerImage ?? null,
          header: data.branding.header ?? null,
          subtitle: data.branding.subtitle ?? null,
        },
      });
      await db.loyalty.update({
        where: { businessId },
        data: { brandingId: branding.id },
      });
    }

    if (
      section === "cashbackConfig" &&
      data.cashbackConfig &&
      existing.cashbackConfig
    ) {
      await db.loyaltyCashbackConfig.update({
        where: { id: existing.cashbackConfig.id },
        data: {
          cashbackPercentage: data.cashbackConfig.cashbackPercentage,
          onFinalAmount: data.cashbackConfig.onFinalAmount,
          maxCashbackCap: data.cashbackConfig.maxCashbackCap,
          minPurchaseForEarningEnabled:
            data.cashbackConfig.minPurchaseForEarningEnabled,
          minPurchaseForEarning: data.cashbackConfig.minPurchaseForEarning,
          minPurchaseForRedemptionEnabled:
            data.cashbackConfig.minPurchaseForRedemptionEnabled,
          minPurchaseForRedemption:
            data.cashbackConfig.minPurchaseForRedemption,
          redemptionBalanceLimitEnabled:
            data.cashbackConfig.redemptionBalanceLimitEnabled,
          redemptionBalanceLimitAmount:
            data.cashbackConfig.redemptionBalanceLimitAmount,
          redemptionBalanceLimitPercentage:
            data.cashbackConfig.redemptionBalanceLimitPercentage,
          redemptionBillLimitEnabled:
            data.cashbackConfig.redemptionBillLimitEnabled,
          redemptionBillLimitAmount:
            data.cashbackConfig.redemptionBillLimitAmount,
          redemptionBillLimitPercentage:
            data.cashbackConfig.redemptionBillLimitPercentage,
        },
      });
    }

    if (section === "tierConfig" && data.tierConfig && existing.tierConfig) {
      await db.loyaltyTierConfig.update({
        where: { id: existing.tierConfig.id },
        data: {
          pointsPerRupee: data.tierConfig.pointsPerRupee,
          maxCashbackCapEnabled: data.tierConfig.maxCashbackCapEnabled,
          maxCashbackCap: data.tierConfig.maxCashbackCap,
        },
      });
    }

    if (section === "tiers" && data.tiers && existing.tierConfig) {
      await db.loyaltyTier.deleteMany({
        where: { tierConfigId: existing.tierConfig.id },
      });
      for (const tier of data.tiers) {
        await db.loyaltyTier.create({
          data: {
            tierConfigId: existing.tierConfig.id,
            name: tier.name,
            rank: tier.rank,
            minLifetimeSpend: tier.minLifetimeSpend,
            maxLifetimeSpend: tier.maxLifetimeSpend ?? null,
            cashbackPercentage: tier.cashbackPercentage ?? 0,
            minPurchaseForEarningEnabled:
              tier.minPurchaseForEarningEnabled ?? false,
            minPurchaseForEarning: tier.minPurchaseForEarning ?? null,
            minPurchaseForRedemptionEnabled:
              tier.minPurchaseForRedemptionEnabled ?? false,
            minPurchaseForRedemption: tier.minPurchaseForRedemption ?? null,
            maxCashbackCapEnabled: tier.maxCashbackCapEnabled ?? false,
            maxCashbackCap: tier.maxCashbackCap ?? null,
          },
        });
      }
    }

    if (
      section === "amountSpentConfig" &&
      data.amountSpentConfig &&
      existing.amountSpentConfig
    ) {
      await db.loyaltyAmountSpentConfig.update({
        where: { id: existing.amountSpentConfig.id },
        data: {
          pointsPerRupee: data.amountSpentConfig.pointsPerRupee,
          onFinalAmount: data.amountSpentConfig.onFinalAmount,
          maxPointsPerPurchase: data.amountSpentConfig.maxPointsPerPurchase,
        },
      });
    }

    if (
      section === "visitMadeConfig" &&
      data.visitMadeConfig &&
      existing.visitMadeConfig
    ) {
      await db.loyaltyVisitMadeConfig.update({
        where: { id: existing.visitMadeConfig.id },
        data: {
          pointsPerVisit: data.visitMadeConfig.pointsPerVisit,
          visitIntervalEnabled: data.visitMadeConfig.visitIntervalEnabled,
          visitIntervalValue: data.visitMadeConfig.visitIntervalValue,
          visitIntervalUnit: data.visitMadeConfig.visitIntervalUnit,
        },
      });
    }

    if (section === "rewardStages" && data.rewardStages != null) {
      if (existing.amountSpentConfig) {
        await db.loyaltyRewardStage.deleteMany({
          where: { amountSpentConfigId: existing.amountSpentConfig.id },
        });
        for (const stage of data.rewardStages) {
          await db.loyaltyRewardStage.create({
            data: {
              amountSpentConfigId: existing.amountSpentConfig.id,
              pointsRequired: stage.pointsRequired,
              rewardType: stage.rewardType,
              rewardName: stage.rewardName,
              freeItemSkuId: stage.freeItemSkuId ?? null,
              freeItemName: stage.freeItemName ?? null,
              percentageValue: stage.percentageValue ?? null,
              appliesToEntirePurchase: stage.appliesToEntirePurchase ?? true,
              specificProductIds: stage.specificProductIds ?? [],
              cashAmount: stage.cashAmount ?? null,
              minPurchaseForRedemptionEnabled:
                stage.minPurchaseForRedemptionEnabled ?? false,
              minPurchaseForRedemption: stage.minPurchaseForRedemption ?? null,
              maxDiscountCapEnabled: stage.maxDiscountCapEnabled ?? false,
              maxDiscountCap: stage.maxDiscountCap ?? null,
            },
          });
        }
      }
      if (existing.visitMadeConfig) {
        await db.loyaltyRewardStage.deleteMany({
          where: { visitMadeConfigId: existing.visitMadeConfig.id },
        });
        for (const stage of data.rewardStages) {
          await db.loyaltyRewardStage.create({
            data: {
              visitMadeConfigId: existing.visitMadeConfig.id,
              pointsRequired: stage.pointsRequired,
              rewardType: stage.rewardType,
              rewardName: stage.rewardName,
              freeItemSkuId: stage.freeItemSkuId ?? null,
              freeItemName: stage.freeItemName ?? null,
              percentageValue: stage.percentageValue ?? null,
              appliesToEntirePurchase: stage.appliesToEntirePurchase ?? true,
              specificProductIds: stage.specificProductIds ?? [],
              cashAmount: stage.cashAmount ?? null,
              minPurchaseForRedemptionEnabled:
                stage.minPurchaseForRedemptionEnabled ?? false,
              minPurchaseForRedemption: stage.minPurchaseForRedemption ?? null,
              maxDiscountCapEnabled: stage.maxDiscountCapEnabled ?? false,
              maxDiscountCap: stage.maxDiscountCap ?? null,
            },
          });
        }
      }
    }

    const updated = await fetchLoyalty(businessId);
    return NextResponse.json({ loyalty: mapLoyaltyResponse(updated) });
  } catch (error: unknown) {
    console.error("Failed to update loyalty settings:", error);
    return NextResponse.json(
      {
        loyalty: null,
        error:
          sanitizeErrorMessage(error) ||
          "Failed to update loyalty settings. Please try again.",
      },
      { status: 500 },
    );
  }
});
