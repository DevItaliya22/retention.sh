import { applyCampaignForBill } from "@/lib/actions/campaign";
import {
  applyLoyaltyForBill,
  unlockReferrerRewardIfFirstBill,
} from "@/lib/actions/loyalty";
import { APP_CONSTANTS } from "@/lib/constants/app";
import { seedDefaultSegments } from "@/lib/segmentation/seed";
import { hashPassword } from "@/lib/utils/password";
import { generateSlug } from "@/lib/utils/slug";
import {
  db,
  type LoyaltyType,
  type Prisma,
  TransactionSource,
  TransactionType,
  TransactionValueKind,
} from "@reelo/db";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  CAMPAIGN_REWARDS,
  DEFAULT_BILLS_PER_ACCOUNT,
  DEFAULT_CUSTOMERS_PER_ACCOUNT,
  DEMO_CUSTOMER_PROFILES,
} from "./constants";
import type {
  DemoAccountLog,
  DemoBillLog,
  DemoBillPlan,
  DemoCredentialLog,
  DemoReferralLog,
  DemoRunOptions,
  DemoScenarioKey,
} from "./types";

interface PreparedCustomer {
  userId: string;
  customerId: string;
  name: string;
  phoneNumber: string;
}

interface DemoAccountContext {
  accountKey: string;
  loyaltyType: LoyaltyType;
  businessId: string;
  businessName: string;
  businessSlug: string;
  adminUserId: string;
  adminEmail: string;
  adminPassword: string;
  cashierUserId: string;
  cashierId: string;
  cashierEmail: string;
  cashierPassword: string;
  skuIds: string[];
  rewardStageIds: string[];
  customers: PreparedCustomer[];
}

interface BusinessStackOptions {
  accountKey: string;
  categoryCount?: number;
  skuCount?: number;
}

interface AccountScenario {
  accountKey: DemoScenarioKey;
  loyaltyType: LoyaltyType;
  bills: number;
  customers: number;
  categoryCount: number;
  skuCount: number;
  referralPairs: number;
  largeData?: boolean;
}

interface CreateBillOverrides {
  forceCustomerIndex?: number;
  redeemFromPartnerBusinessId?: string;
  redeemPartnerCashback?: number;
}

function logProgress(message: string) {
  console.log(message);
}

function required<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
}

function makeRunId() {
  return new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);
}

function toIsoWithOffset(daysAgo: number, hourOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(10 + (hourOffset % 8), 5 + (hourOffset % 50), 0, 0);
  return d.toISOString();
}

function buildBillPlans(
  customersPerAccount: number,
  billsPerAccount: number,
): DemoBillPlan[] {
  const plans: DemoBillPlan[] = [];
  const profileCount = Math.min(
    customersPerAccount,
    DEMO_CUSTOMER_PROFILES.length,
  );

  for (
    let customerIndex = 0;
    customerIndex < profileCount;
    customerIndex += 1
  ) {
    const profile = required(
      DEMO_CUSTOMER_PROFILES[customerIndex],
      `Missing customer profile at index ${customerIndex}`,
    );
    for (let i = 0; i < profile.dayOffsets.length; i += 1) {
      const daysAgo = required(
        profile.dayOffsets[i],
        `Missing day offset at index ${i}`,
      );
      const targetFinalAmount = required(
        profile.billAmounts[i],
        `Missing bill amount at index ${i}`,
      );
      plans.push({
        customerIndex,
        daysAgo,
        targetFinalAmount,
        storeDiscount: i % 2 === 0 ? 50 : 0,
        taxes: i % 3 === 0 ? [18] : i % 3 === 1 ? [12, 6] : [],
        shouldCreateFeedback: i % 3 === 0,
      });
    }
  }

  plans.sort((a, b) => b.daysAgo - a.daysAgo);
  return plans.slice(0, billsPerAccount);
}

function buildLargeBillPlans(
  customersPerAccount: number,
  billsPerAccount: number,
): DemoBillPlan[] {
  const plans: DemoBillPlan[] = [];

  for (let i = 0; i < billsPerAccount; i += 1) {
    const customerIndex = i % customersPerAccount;
    const primaryBucket = i % 10;
    const daysAgo =
      primaryBucket < 6
        ? i % 45 // recent: 0–44 days
        : primaryBucket < 8
          ? 46 + (i % 120) // mid: 46–165 days
          : 366 + (i % 183); // old (lost): 366–548 days — must exceed 365 for Lost segment

    const baseAmount =
      primaryBucket < 6
        ? 1800 + (i % 25) * 160
        : primaryBucket < 8
          ? 900 + (i % 20) * 120
          : 300 + (i % 12) * 70;

    plans.push({
      customerIndex,
      daysAgo: primaryBucket < 8 ? Math.min(364, daysAgo) : daysAgo,
      targetFinalAmount: baseAmount,
      storeDiscount: i % 4 === 0 ? 80 : i % 5 === 0 ? 120 : 0,
      taxes: i % 3 === 0 ? [18] : i % 3 === 1 ? [12, 6] : [],
      shouldCreateFeedback: i % 9 === 0,
    });
  }

  plans.sort((a, b) => b.daysAgo - a.daysAgo);
  return plans;
}

function campaignWindow() {
  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() - 1);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return { startsAt, expiresAt };
}

async function createBusinessStack(
  loyaltyType: LoyaltyType,
  runId: string,
  accountIndex: number,
  options: BusinessStackOptions,
): Promise<DemoAccountContext> {
  const slugBase = generateSlug(
    `demo-${options.accountKey}-${runId}-${accountIndex}`,
  );
  const businessSlug = `${slugBase}-${Math.random().toString(36).slice(2, 7)}`;
  const businessName = `Demo ${options.accountKey.replace(/_/g, " ")} ${runId}`;
  const adminPassword = "DemoAdmin@123";
  const cashierPassword = "DemoCashier@123";

  const business = await db.business.create({
    data: {
      name: businessName,
      slug: businessSlug,
      isServiceEnabled: {
        loyalty: true,
        referral: true,
        feedback: true,
      } as Prisma.JsonObject,
      defaultPointsName: "Points",
      defaultCurrencyCode: "INR",
      defaultCurrencySymbol: "₹",
      nextBillNumber: 1,
    },
  });

  const adminEmail = `demo.admin.${options.accountKey}.${runId}@dy.com`;
  const adminUser = await db.user.create({
    data: {
      name: `Demo Admin ${loyaltyType}`,
      email: adminEmail,
      emailVerified: true,
      role: "ADMIN",
    },
  });

  await db.account.create({
    data: {
      id: crypto.randomUUID(),
      accountId: adminUser.id,
      providerId: "credential",
      userId: adminUser.id,
      password: await hashPassword(adminPassword),
    },
  });

  await db.admin.create({
    data: {
      userId: adminUser.id,
      businessId: business.id,
    },
  });

  const cashierEmail = `demo.cashier@${businessSlug}.dy.com`;
  const cashierUser = await db.user.create({
    data: {
      name: `Demo Cashier ${loyaltyType}`,
      email: `cashier.user.${options.accountKey}.${runId}@dy.com`,
      emailVerified: true,
      role: "CASHIER",
    },
  });

  const hashedPassword = await hashPassword(cashierPassword);
  const cashier = await db.cashier.create({
    data: {
      userId: cashierUser.id,
      businessId: business.id,
      email: cashierEmail,
      cashierLinkSlug: `${businessSlug}-main`,
      password: hashedPassword,
      isActive: true,
    },
  });

  const branding = await db.branding.create({
    data: {
      businessId: business.id,
      themeColor: "#0f766e",
      textColor: "#0f172a",
      header: `${businessName} Loyalty`,
      subtitle: "Demo loyalty setup",
    },
  });

  await db.business.update({
    where: { id: business.id },
    data: { defaultBranding: { connect: { id: branding.id } } },
  });

  const categoryCount = options.categoryCount ?? 3;
  const skuCount = options.skuCount ?? 6;
  const categories: Array<{ id: string }> = [];
  for (let i = 0; i < categoryCount; i += 1) {
    const category = await db.category.create({
      data: {
        businessId: business.id,
        name: `Category ${i + 1}`,
        description: `Demo category ${i + 1}`,
        sortOrder: i + 1,
      },
      select: { id: true },
    });
    categories.push(category);
  }

  const skus: Array<{ id: string }> = [];
  for (let idx = 0; idx < skuCount; idx += 1) {
    const category = required(
      categories[idx % categories.length],
      `Missing category for SKU ${idx}`,
    );
    const created = await db.sku.create({
      data: {
        businessId: business.id,
        categoryId: category.id,
        sku: `SKU-${String(idx + 1).padStart(3, "0")}-${accountIndex}`,
        name: `Demo Item ${idx + 1}`,
        price: 80 + ((idx * 17) % 450),
        isActive: true,
      },
      select: { id: true },
    });
    skus.push(created);
  }

  const rewardStageIds = await createLoyaltySetup(
    business.id,
    loyaltyType,
    branding.id,
    skus.map((s) => s.id),
  );

  const firstSku = required(skus[0], "Expected first SKU").id;
  const secondSku = required(skus[1], "Expected second SKU").id;
  await createReferralAndFeedbackSetup(
    business.id,
    branding.id,
    firstSku,
    secondSku,
  );
  await createCampaignSetup(business.id, loyaltyType, runId);
  await seedDefaultSegments(business.id);

  return {
    accountKey: options.accountKey,
    loyaltyType,
    businessId: business.id,
    businessName,
    businessSlug,
    adminUserId: adminUser.id,
    adminEmail,
    adminPassword,
    cashierUserId: cashierUser.id,
    cashierId: cashier.id,
    cashierEmail,
    cashierPassword,
    skuIds: skus.map((s) => s.id),
    rewardStageIds,
    customers: [],
  };
}

async function createLoyaltySetup(
  businessId: string,
  loyaltyType: LoyaltyType,
  brandingId: string,
  skuIds: string[],
): Promise<string[]> {
  const loyalty = await db.loyalty.create({
    data: {
      businessId,
      loyaltyType,
      brandingId,
      whatsappEnabled: false,
      emailEnabled: false,
      smsEnabled: false,
      pointExpiryDays: 365,
      pointReminderDays: 15,
    },
  });

  await db.termsAndConditions.createMany({
    data: [
      { loyaltyId: loyalty.id, content: "Demo program terms apply." },
      { loyaltyId: loyalty.id, content: "Rewards are for demo usage only." },
    ],
    skipDuplicates: true,
  });

  if (loyaltyType === "CASHBACK") {
    await db.loyaltyCashbackConfig.create({
      data: {
        loyaltyId: loyalty.id,
        cashbackPercentage: 8,
        onFinalAmount: true,
        maxCashbackCap: 800,
        minPurchaseForEarningEnabled: false,
        minPurchaseForRedemptionEnabled: true,
        minPurchaseForRedemption: 250,
        redemptionBalanceLimitEnabled: true,
        redemptionBalanceLimitPercentage: 40,
        redemptionBillLimitEnabled: true,
        redemptionBillLimitPercentage: 30,
        allowSameBillRedemption: false,
      },
    });
    return [];
  }

  if (loyaltyType === "TIER") {
    const tierConfig = await db.loyaltyTierConfig.create({
      data: {
        loyaltyId: loyalty.id,
        pointsPerRupee: 1,
        onFinalAmount: true,
        allowSameBillRedemption: false,
      },
    });

    await db.loyaltyTier.createMany({
      data: [
        {
          tierConfigId: tierConfig.id,
          name: "Silver",
          rank: 1,
          minLifetimeSpend: 0,
          maxLifetimeSpend: 10000,
          cashbackPercentage: 4,
          minPurchaseForRedemptionEnabled: false,
        },
        {
          tierConfigId: tierConfig.id,
          name: "Gold",
          rank: 2,
          minLifetimeSpend: 10001,
          maxLifetimeSpend: 30000,
          cashbackPercentage: 7,
          minPurchaseForRedemptionEnabled: true,
          minPurchaseForRedemption: 300,
        },
        {
          tierConfigId: tierConfig.id,
          name: "Platinum",
          rank: 3,
          minLifetimeSpend: 30001,
          maxLifetimeSpend: null,
          cashbackPercentage: 10,
          minPurchaseForRedemptionEnabled: true,
          minPurchaseForRedemption: 500,
        },
      ],
    });

    return [];
  }

  if (loyaltyType === "AMOUNT_SPENT") {
    const config = await db.loyaltyAmountSpentConfig.create({
      data: {
        loyaltyId: loyalty.id,
        pointsPerRupee: 1,
        onFinalAmount: false,
        allowSameBillRedemption: true,
        maxPointsPerPurchase: 5000,
      },
    });

    const stages = await Promise.all([
      db.loyaltyRewardStage.create({
        data: {
          amountSpentConfigId: config.id,
          pointsRequired: 400,
          rewardType: "CASH_DISCOUNT",
          rewardName: "Rs 80 Off",
          cashAmount: 80,
          minPurchaseForRedemptionEnabled: true,
          minPurchaseForRedemption: 300,
        },
        select: { id: true },
      }),
      db.loyaltyRewardStage.create({
        data: {
          amountSpentConfigId: config.id,
          pointsRequired: 700,
          rewardType: "PERCENTAGE_DISCOUNT",
          rewardName: "10% Off",
          percentageValue: 10,
          appliesToEntirePurchase: true,
          minPurchaseForRedemptionEnabled: true,
          minPurchaseForRedemption: 500,
          maxDiscountCapEnabled: true,
          maxDiscountCap: 200,
        },
        select: { id: true },
      }),
      db.loyaltyRewardStage.create({
        data: {
          amountSpentConfigId: config.id,
          pointsRequired: 1000,
          rewardType: "FREE_ITEM",
          rewardName: "Free Demo Item",
          freeItemSkuId: skuIds[0] ?? null,
          freeItemName: "Demo Free Item",
        },
        select: { id: true },
      }),
    ]);

    return stages.map((s) => s.id);
  }

  const visitConfig = await db.loyaltyVisitMadeConfig.create({
    data: {
      loyaltyId: loyalty.id,
      pointsPerVisit: 50,
      visitIntervalEnabled: false,
      allowSameBillRedemption: true,
    },
  });

  const stages = await Promise.all([
    db.loyaltyRewardStage.create({
      data: {
        visitMadeConfigId: visitConfig.id,
        pointsRequired: 100,
        rewardType: "CASH_DISCOUNT",
        rewardName: "Rs 60 Off",
        cashAmount: 60,
        minPurchaseForRedemptionEnabled: true,
        minPurchaseForRedemption: 250,
      },
      select: { id: true },
    }),
    db.loyaltyRewardStage.create({
      data: {
        visitMadeConfigId: visitConfig.id,
        pointsRequired: 200,
        rewardType: "PERCENTAGE_DISCOUNT",
        rewardName: "8% Off",
        percentageValue: 8,
        appliesToEntirePurchase: true,
        minPurchaseForRedemptionEnabled: true,
        minPurchaseForRedemption: 350,
        maxDiscountCapEnabled: true,
        maxDiscountCap: 150,
      },
      select: { id: true },
    }),
    db.loyaltyRewardStage.create({
      data: {
        visitMadeConfigId: visitConfig.id,
        pointsRequired: 300,
        rewardType: "FREE_ITEM",
        rewardName: "Free Visit Gift",
        freeItemSkuId: skuIds[1] ?? null,
        freeItemName: "Visit Gift",
      },
      select: { id: true },
    }),
  ]);

  return stages.map((s) => s.id);
}

async function createReferralAndFeedbackSetup(
  businessId: string,
  brandingId: string,
  newCustomerFreeSkuId: string,
  existingCustomerFreeSkuId: string,
) {
  const referralProgram = await db.referralProgram.create({
    data: {
      businessId,
      isEnabled: true,
      newCustomerBenefitType: "AMOUNT_CASHBACK",
      newCustomerBenefitValue: 50,
      existingCustomerBenefitType: "AMOUNT_CASHBACK",
      existingCustomerBenefitValue: 75,
      lockReferralPointsUntilFirstPurchase: true,
      informationSections: [
        {
          title: "How referral works",
          content: "Share referral link. New customer joins. Both get rewards.",
        },
      ] as unknown as Prisma.JsonArray,
      branding: {
        themeColor: "#0f766e",
      } as Prisma.JsonObject,
      newCustomerFreeItemSkuId: newCustomerFreeSkuId,
      existingCustomerFreeItemSkuId: existingCustomerFreeSkuId,
      whatsappEnabled: false,
      emailEnabled: false,
      smsEnabled: false,
    },
  });

  await db.termsAndConditions.createMany({
    data: [
      {
        content: "Referral reward is valid for demo only.",
        referralProgramNewCustomerId: referralProgram.id,
      },
      {
        content: "Referrer reward unlocks on referred first purchase.",
        referralProgramExistingCustomerId: referralProgram.id,
      },
    ],
    skipDuplicates: true,
  });

  const feedbackConfig = await db.feedbackConfig.create({
    data: {
      businessId,
      brandingId,
      timing: "IMMEDIATELY",
      collectionChannel: "CASHIER_PORTAL",
      feedbackRewardEnabled: true,
      rewardAmount: 25,
      positiveFollowUp: "Thanks for your feedback.",
      negativeFollowUp: "Thanks, we will improve.",
      askForOnlineReviews: false,
      isHowDidYouHearEnabled: true,
    },
  });

  await db.feedbackSelectionOption.createMany({
    data: [
      { configId: feedbackConfig.id, label: "Service", seq: 1 },
      { configId: feedbackConfig.id, label: "Product Quality", seq: 2 },
      { configId: feedbackConfig.id, label: "Value", seq: 3 },
    ],
    skipDuplicates: true,
  });
}

async function createCampaignSetup(
  businessId: string,
  loyaltyType: LoyaltyType,
  runId: string,
) {
  const { startsAt, expiresAt } = campaignWindow();

  for (let i = 0; i < CAMPAIGN_REWARDS.length; i += 1) {
    const reward = required(
      CAMPAIGN_REWARDS[i],
      `Missing campaign reward at index ${i}`,
    );
    await db.campaign.create({
      data: {
        businessId,
        slug: `demo-${loyaltyType.toLowerCase()}-${runId}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        title: reward.title,
        description: `${reward.title} for ${loyaltyType}`,
        rewardType: reward.rewardType,
        rewardValue: reward.rewardValue,
        status: "ACTIVE",
        startsAt,
        expiresAt,
        minPurchaseForEarningEnabled: reward.rewardType !== "NO_REWARD",
        minPurchaseForEarning: reward.rewardType === "NO_REWARD" ? null : 200,
        minPurchaseForRedemptionEnabled: reward.rewardType !== "NO_REWARD",
        minPurchaseForRedemption:
          reward.rewardType === "NO_REWARD" ? null : 150,
        instantCashbackRedeemable:
          reward.rewardType !== "FREE_ITEM" &&
          reward.rewardType !== "NO_REWARD",
        maxRedemptionEnabled:
          reward.rewardType !== "FREE_ITEM" &&
          reward.rewardType !== "NO_REWARD",
        maxRedemptionAmount:
          reward.rewardType === "PERCENTAGE_DISCOUNT"
            ? 300
            : reward.rewardType === "CASH_DISCOUNT"
              ? 120
              : null,
        termsAndConditions: ["Demo campaign terms"],
      },
    });
  }
}

function buildCustomerPhone(seed: number): string {
  const base = 7000000000 + (seed % 999999999);
  return `+91${String(base).slice(0, 10)}`;
}

async function findOrCreateCustomer(
  tx: Prisma.TransactionClient,
  params: {
    name: string;
    phoneNumber: string;
    businessId: string;
  },
): Promise<PreparedCustomer> {
  const tempEmail = `${params.phoneNumber}@${APP_CONSTANTS.CUSTOMER_EMAIL_DOMAIN}`;

  let user = await tx.user.findUnique({
    where: { phoneNumber: params.phoneNumber },
    include: { customer: true },
  });

  if (!user) {
    user = await tx.user.create({
      data: {
        name: params.name,
        phoneNumber: params.phoneNumber,
        email: tempEmail,
        role: "CUSTOMER",
        phoneNumberVerified: false,
        emailVerified: false,
      },
      include: { customer: true },
    });
  }

  const customer =
    user.customer ??
    (await tx.customer.create({
      data: {
        userId: user.id,
        email: tempEmail,
      },
    }));

  const existingBusinessCustomer = await tx.businessCustomer.findUnique({
    where: {
      businessId_customerId: {
        businessId: params.businessId,
        customerId: customer.id,
      },
    },
  });

  if (!existingBusinessCustomer) {
    await tx.businessCustomer.create({
      data: {
        businessId: params.businessId,
        customerId: customer.id,
      },
    });

    await tx.wallet.create({
      data: {
        businessId: params.businessId,
        customerId: customer.id,
      },
    });
  }

  return {
    userId: user.id,
    customerId: customer.id,
    name: params.name,
    phoneNumber: params.phoneNumber,
  };
}

async function createCustomers(
  account: DemoAccountContext,
  customersPerAccount: number,
  runId: string,
) {
  const names = DEMO_CUSTOMER_PROFILES.map((p) => p.name);
  const count = customersPerAccount;

  const created = [] as PreparedCustomer[];
  await db.$transaction(async (tx) => {
    for (let i = 0; i < count; i += 1) {
      const phoneSeed = Number(
        `${runId.slice(-6)}${String(i + 1).padStart(2, "0")}`,
      );
      const phoneNumber = buildCustomerPhone(phoneSeed);
      const customer = await findOrCreateCustomer(tx, {
        businessId: account.businessId,
        name: names[i] ?? `Demo Customer ${i + 1}`,
        phoneNumber,
      });
      created.push(customer);
    }
  });

  account.customers = created;
}

async function createReferrals(
  account: DemoAccountContext,
  pairCount = 2,
): Promise<DemoReferralLog[]> {
  const referrals: DemoReferralLog[] = [];
  if (account.customers.length < 4) return referrals;

  const maxPairs = Math.min(
    pairCount,
    Math.floor((account.customers.length - 1) / 2),
  );
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < maxPairs; i += 1) {
    pairs.push([i, i + maxPairs + 1]);
  }

  await db.$transaction(async (tx) => {
    for (const [referrerIndex, referredIndex] of pairs) {
      const referrer = required(
        account.customers[referrerIndex],
        `Missing referrer at index ${referrerIndex}`,
      );
      const referred = required(
        account.customers[referredIndex],
        `Missing referred at index ${referredIndex}`,
      );

      await tx.businessCustomer.update({
        where: {
          businessId_customerId: {
            businessId: account.businessId,
            customerId: referred.customerId,
          },
        },
        data: {
          referredByBusinessId: account.businessId,
          referredByCustomerId: referrer.customerId,
        },
      });

      const referralLog = await tx.referralLog.create({
        data: {
          slug: crypto.randomUUID(),
          referrerBusinessId: account.businessId,
          referrerCustomerId: referrer.customerId,
          newCustomerPhone: referred.phoneNumber,
          newCustomerName: referred.name,
          becameCustomer: true,
          referredBusinessId: account.businessId,
          referredCustomerId: referred.customerId,
        },
      });

      await tx.wallet.update({
        where: {
          businessId_customerId: {
            businessId: account.businessId,
            customerId: referrer.customerId,
          },
        },
        data: {
          cashbackBalance: { increment: 75 },
        },
      });

      await tx.transaction.create({
        data: {
          businessId: account.businessId,
          customerId: referrer.customerId,
          valueKind: TransactionValueKind.CASHBACK,
          amount: 75,
          type: TransactionType.EARNED,
          source: TransactionSource.REFERRAL,
          description: "Demo referral cashback for referrer",
          metadata: {
            referralLogId: referralLog.id,
            lockUntilFirstPurchase: true,
          } as Prisma.JsonObject,
        },
      });

      await tx.wallet.update({
        where: {
          businessId_customerId: {
            businessId: account.businessId,
            customerId: referred.customerId,
          },
        },
        data: {
          cashbackBalance: { increment: 50 },
        },
      });

      await tx.transaction.create({
        data: {
          businessId: account.businessId,
          customerId: referred.customerId,
          valueKind: TransactionValueKind.CASHBACK,
          amount: 50,
          type: TransactionType.EARNED,
          source: TransactionSource.REFERRAL,
          description: "Demo referral cashback for new customer",
          metadata: {
            referralLogId: referralLog.id,
          } as Prisma.JsonObject,
        },
      });

      referrals.push({
        referrer: `${referrer.name} (${referrer.phoneNumber})`,
        referred: `${referred.name} (${referred.phoneNumber})`,
        referralLogId: referralLog.id,
      });
    }
  });

  for (const r of referrals) {
    logProgress(`referral done from: ${r.referrer} to: ${r.referred}`);
  }

  return referrals;
}

function buildLineItems(
  skuIds: string[],
  subtotal: number,
): Array<{ skuId: string; qty: number; unitPrice: number }> {
  const first = required(skuIds[0], "At least one SKU is required");
  const second = skuIds[1] ?? first;
  const third = skuIds[2] ?? first;

  const firstValue = Math.floor(subtotal * 0.5 * 100) / 100;
  const secondValue = Math.floor(subtotal * 0.3 * 100) / 100;
  const thirdValue =
    Math.floor((subtotal - firstValue - secondValue) * 100) / 100;

  return [
    { skuId: first, qty: 1, unitPrice: firstValue },
    { skuId: second, qty: 1, unitPrice: secondValue },
    { skuId: third, qty: 1, unitPrice: Math.max(0, thirdValue) },
  ];
}

async function createFeedbackResponse(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    billId: string;
    createdAt: Date;
  },
): Promise<void> {
  const link = await tx.feedbackLink.findUnique({
    where: { billId: params.billId },
    include: {
      config: {
        include: {
          selectionOptions: { orderBy: { seq: "asc" }, take: 2 },
        },
      },
    },
  });

  if (!link?.config || link.feedbackResponseId) return;

  const response = await tx.feedbackResponse.create({
    data: {
      configId: link.config.id,
      businessId: params.businessId,
      customerId: params.customerId,
      rating: 4,
      comment: "Great demo experience.",
      howDidYouHear: "Referral",
      selectedCategories: ["Service", "Product"],
      selectedSelectionOptions: {
        connect: link.config.selectionOptions.map((o) => ({ id: o.id })),
      },
      createdAt: params.createdAt,
      updatedAt: params.createdAt,
    },
  });

  await tx.feedbackLink.update({
    where: { id: link.id },
    data: {
      feedbackResponseId: response.id,
      updatedAt: params.createdAt,
    },
  });

  if (
    link.config.feedbackRewardEnabled &&
    (link.config.rewardAmount ?? 0) > 0
  ) {
    const rewardAmount = Number(link.config.rewardAmount ?? 0);

    await tx.wallet.update({
      where: {
        businessId_customerId: {
          businessId: params.businessId,
          customerId: params.customerId,
        },
      },
      data: {
        cashbackBalance: { increment: rewardAmount },
      },
    });

    await tx.transaction.create({
      data: {
        businessId: params.businessId,
        customerId: params.customerId,
        feedbackResponseId: response.id,
        valueKind: TransactionValueKind.CASHBACK,
        amount: rewardAmount,
        type: TransactionType.EARNED,
        source: TransactionSource.FEEDBACK,
        description: "Feedback reward cashback",
        createdAt: params.createdAt,
        updatedAt: params.createdAt,
      },
    });
  }
}

async function createBill(
  account: DemoAccountContext,
  plan: DemoBillPlan,
  billIndex: number,
  overrides?: CreateBillOverrides,
): Promise<DemoBillLog> {
  const customerIndex = overrides?.forceCustomerIndex ?? plan.customerIndex;
  const customer = required(
    account.customers[customerIndex],
    `Missing customer for plan index ${customerIndex}`,
  );
  const taxSum = plan.taxes.reduce((sum, t) => sum + t, 0);
  const subtotal = Math.max(
    1,
    plan.targetFinalAmount + plan.storeDiscount - taxSum,
  );
  const lineItems = buildLineItems(account.skuIds, subtotal);

  const createdAt = new Date(toIsoWithOffset(plan.daysAgo, billIndex));

  const result = await db.$transaction(async (tx) => {
    const business = await tx.business.findUniqueOrThrow({
      where: { id: account.businessId },
      select: { nextBillNumber: true },
    });

    const billNumber = String(business.nextBillNumber);

    const bill = await tx.bill.create({
      data: {
        billNumber,
        businessId: account.businessId,
        customerId: customer.customerId,
        cashierId: account.cashierId,
        subtotal,
        storeDiscount: plan.storeDiscount,
        tax: plan.taxes,
        finalAmount: plan.targetFinalAmount,
        userPaidAmount: plan.targetFinalAmount,
        paymentMethod: billIndex % 2 === 0 ? "CARD" : "UPI",
        notes: `demo-bill-${billIndex + 1}`,
        lineItems: {
          create: lineItems,
        },
      },
    });

    await tx.business.update({
      where: { id: account.businessId },
      data: { nextBillNumber: { increment: 1 } },
    });

    const feedbackConfig = await tx.feedbackConfig.findUnique({
      where: { businessId: account.businessId },
      select: { id: true },
    });

    await tx.feedbackLink.create({
      data: {
        billId: bill.id,
        configId: feedbackConfig?.id ?? null,
      },
    });

    const walletBefore = await tx.wallet.findUnique({
      where: {
        businessId_customerId: {
          businessId: account.businessId,
          customerId: customer.customerId,
        },
      },
      select: {
        cashbackBalance: true,
        amountSpentBalance: true,
        visitPointsBalance: true,
      },
    });

    let redeemCashbackRequested: number | null = null;
    let redeemPointsRequested: number | null = null;
    let rewardStageId: string | null = null;

    if (account.loyaltyType === "CASHBACK" || account.loyaltyType === "TIER") {
      const balance = Number(walletBefore?.cashbackBalance ?? 0);
      if (billIndex % 6 === 0 && balance >= 60) {
        redeemCashbackRequested = Math.min(120, Math.floor(balance * 0.25));
      }
    } else {
      const pointsBalance =
        account.loyaltyType === "AMOUNT_SPENT"
          ? Number(walletBefore?.amountSpentBalance ?? 0)
          : Number(walletBefore?.visitPointsBalance ?? 0);

      if (
        billIndex % 4 === 0 &&
        account.rewardStageIds.length > 0 &&
        pointsBalance >= 100
      ) {
        rewardStageId =
          account.rewardStageIds[
            (billIndex / 4) % account.rewardStageIds.length
          ] ?? null;
      } else if (billIndex % 3 === 0 && pointsBalance >= 50) {
        redeemPointsRequested = Math.min(150, Math.floor(pointsBalance * 0.3));
      }
    }

    const campaignResult = await applyCampaignForBill(tx, {
      businessId: account.businessId,
      customerId: customer.customerId,
      billId: bill.id,
      billAmount: plan.targetFinalAmount,
    });

    const amountAfterCampaign = Math.max(
      0,
      plan.targetFinalAmount - campaignResult.totalDiscount,
    );

    const loyalty = await applyLoyaltyForBill(tx, {
      businessId: account.businessId,
      customerId: customer.customerId,
      billId: bill.id,
      billAmount: amountAfterCampaign,
      billSubtotal: subtotal,
      redeemCashbackRequested,
      redeemPointsRequested,
      rewardStageId,
      redeemFromPartnerBusinessId:
        overrides?.redeemFromPartnerBusinessId ?? null,
      redeemPartnerCashback: overrides?.redeemPartnerCashback ?? null,
      deferEarn: false,
    });

    const updatedBill = await tx.bill.update({
      where: { id: bill.id },
      data: {
        campaignId: campaignResult.primaryCampaignId ?? null,
        campaignDiscountAmount: campaignResult.totalDiscount || null,
        cashbackAmount: loyalty.cashbackAmount ?? null,
        cashbackRedeemedAmount: loyalty.cashbackRedeemedAmount ?? null,
        partnerRedeemedAmount: loyalty.partnerRedeemedAmount ?? null,
        userPaidAmount: loyalty.finalAmount,
      },
    });

    await unlockReferrerRewardIfFirstBill(tx, {
      businessId: account.businessId,
      customerId: customer.customerId,
    });

    await tx.bill.update({
      where: { id: bill.id },
      data: {
        createdAt,
        updatedAt: createdAt,
      },
    });

    await tx.transaction.updateMany({
      where: { billId: bill.id },
      data: {
        createdAt,
        updatedAt: createdAt,
      },
    });

    await tx.feedbackLink.updateMany({
      where: { billId: bill.id },
      data: {
        createdAt,
        updatedAt: createdAt,
      },
    });

    let hadFeedback = false;
    if (plan.shouldCreateFeedback) {
      await createFeedbackResponse(tx, {
        businessId: account.businessId,
        customerId: customer.customerId,
        billId: bill.id,
        createdAt,
      });
      hadFeedback = true;
    }

    return {
      billNumber,
      billId: bill.id,
      customerName: customer.name,
      customerPhone: customer.phoneNumber,
      createdAt: createdAt.toISOString(),
      targetFinalAmount: plan.targetFinalAmount,
      userPaidAmount: Number(
        updatedBill.userPaidAmount ?? plan.targetFinalAmount,
      ),
      cashbackEarned: updatedBill.cashbackAmount ?? null,
      cashbackRedeemed: updatedBill.cashbackRedeemedAmount ?? null,
      campaignDiscount: updatedBill.campaignDiscountAmount ?? null,
      hadFeedback,
    } satisfies DemoBillLog;
  });

  return result;
}

async function normalizeWalletLastVisitAt(account: DemoAccountContext) {
  for (const customer of account.customers) {
    const [latestBill, billCount] = await Promise.all([
      db.bill.findFirst({
        where: {
          businessId: account.businessId,
          customerId: customer.customerId,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      db.bill.count({
        where: {
          businessId: account.businessId,
          customerId: customer.customerId,
        },
      }),
    ]);

    if (!latestBill) continue;

    await db.wallet.update({
      where: {
        businessId_customerId: {
          businessId: account.businessId,
          customerId: customer.customerId,
        },
      },
      data: {
        lastVisitAt: latestBill.createdAt,
        // For CASHBACK loyalty, visitCount is never incremented during bill
        // processing (only TIER/VISIT_MADE update it). Sync it from actual
        // bill count so frequency-based RFM segments (VIP, Loyal, etc.) work.
        visitCount: billCount,
      },
    });
  }
}

function mergeCustomers(
  account: DemoAccountContext,
  customers: PreparedCustomer[],
) {
  const seen = new Set(account.customers.map((c) => c.customerId));
  for (const customer of customers) {
    if (seen.has(customer.customerId)) continue;
    account.customers.push(customer);
    seen.add(customer.customerId);
  }
}

async function createPartnershipBetween(
  left: DemoAccountContext,
  right: DemoAccountContext,
) {
  const existing = await db.businessPartnership.findFirst({
    where: {
      status: "ACTIVE",
      AND: [
        { members: { some: { businessId: left.businessId } } },
        { members: { some: { businessId: right.businessId } } },
      ],
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  await db.business.updateMany({
    where: { id: { in: [left.businessId, right.businessId] } },
    data: { receivePartnershipOffers: true },
  });

  const partnership = await db.businessPartnership.create({
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
    select: { id: true },
  });

  return partnership.id;
}

async function createSharedPartnerCustomers(
  left: DemoAccountContext,
  right: DemoAccountContext,
  count: number,
  runId: string,
): Promise<PreparedCustomer[]> {
  const shared: PreparedCustomer[] = [];

  await db.$transaction(async (tx) => {
    for (let i = 0; i < count; i += 1) {
      const phoneSeed = Number(
        `${runId.slice(-6)}${String(81 + i).padStart(3, "0")}`,
      );
      const phoneNumber = buildCustomerPhone(phoneSeed);
      const name = `Partner Shared ${i + 1}`;
      const leftCustomer = await findOrCreateCustomer(tx, {
        businessId: left.businessId,
        name,
        phoneNumber,
      });
      const rightCustomer = await findOrCreateCustomer(tx, {
        businessId: right.businessId,
        name,
        phoneNumber,
      });
      shared.push(leftCustomer);
      mergeCustomers(right, [rightCustomer]);
    }
  });

  mergeCustomers(left, shared);
  return shared;
}

async function createPartnerInterchangeBills(
  left: DemoAccountContext,
  right: DemoAccountContext,
  leftLog: DemoAccountLog,
  rightLog: DemoAccountLog,
  sharedCustomers: PreparedCustomer[],
) {
  const createPartnerRedeemBillWithFallback = async (
    account: DemoAccountContext,
    plan: DemoBillPlan,
    billIndex: number,
    customerIndex: number,
    partnerBusinessId: string,
    preferredAmounts: number[],
  ) => {
    // Always append 0 as final fallback: when campaign cashback takes precedence
    // over loyalty earning, the partner wallet may be empty (₹0). In that case
    // we still create the bill — just without partner redemption — so the demo
    // seed does not crash.
    const amounts = preferredAmounts.includes(0)
      ? preferredAmounts
      : [...preferredAmounts, 0];
    let lastError: unknown = null;
    for (const amount of amounts) {
      try {
        // amount === 0 means skip partner redemption entirely (pass null so
        // applyLoyaltyForBill skips the partner block).
        return await createBill(account, plan, billIndex, {
          forceCustomerIndex: customerIndex,
          redeemFromPartnerBusinessId:
            amount > 0 ? partnerBusinessId : undefined,
          redeemPartnerCashback: amount > 0 ? amount : undefined,
        });
      } catch (error) {
        lastError = error;
        const message =
          error instanceof Error ? error.message : "unknown partner error";
        if (
          !message.includes("exceeds allowed limit") &&
          !message.includes("Insufficient partner cashback")
        ) {
          throw error;
        }
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("Failed to create partner redeem bill");
  };

  // Build partner wallet balances at both stores first.
  for (let i = 0; i < sharedCustomers.length; i += 1) {
    const shared = required(sharedCustomers[i], `Missing shared customer ${i}`);
    const leftIndex = left.customers.findIndex(
      (c) => c.customerId === shared.customerId,
    );
    const rightIndex = right.customers.findIndex(
      (c) => c.customerId === shared.customerId,
    );
    if (leftIndex < 0 || rightIndex < 0) continue;

    const earnPlan: DemoBillPlan = {
      customerIndex: leftIndex,
      daysAgo: 20 + (i % 15),
      targetFinalAmount: 2600 + (i % 6) * 140,
      storeDiscount: 0,
      taxes: [18],
      shouldCreateFeedback: false,
    };

    const leftEarnBill = await createBill(left, earnPlan, 5000 + i * 2);
    leftLog.bills.push(leftEarnBill);
    leftLog.billsCreated += 1;

    const rightEarnPlan: DemoBillPlan = {
      ...earnPlan,
      customerIndex: rightIndex,
      daysAgo: 18 + (i % 12),
      targetFinalAmount: 2400 + (i % 5) * 150,
    };
    const rightEarnBill = await createBill(right, rightEarnPlan, 6000 + i * 2);
    rightLog.bills.push(rightEarnBill);
    rightLog.billsCreated += 1;
  }

  // Redeem partner balances in both directions.
  const redemptionLoops = Math.min(12, sharedCustomers.length);
  for (let i = 0; i < redemptionLoops; i += 1) {
    const shared = required(
      sharedCustomers[i],
      `Missing shared customer for redemption ${i}`,
    );
    const leftIndex = left.customers.findIndex(
      (c) => c.customerId === shared.customerId,
    );
    const rightIndex = right.customers.findIndex(
      (c) => c.customerId === shared.customerId,
    );
    if (leftIndex < 0 || rightIndex < 0) continue;

    const leftRedeemPlan: DemoBillPlan = {
      customerIndex: leftIndex,
      daysAgo: 8 + (i % 7),
      targetFinalAmount: 1700 + i * 60,
      storeDiscount: 0,
      taxes: [18],
      shouldCreateFeedback: i % 3 === 0,
    };
    const leftRedeemBill = await createPartnerRedeemBillWithFallback(
      left,
      leftRedeemPlan,
      7000 + i * 2,
      leftIndex,
      right.businessId,
      [100, 80, 60, 40, 25, 15, 10],
    );
    leftLog.bills.push(leftRedeemBill);
    leftLog.billsCreated += 1;
    if (leftRedeemBill.hadFeedback) leftLog.feedbackResponsesCreated += 1;

    const rightRedeemPlan: DemoBillPlan = {
      customerIndex: rightIndex,
      daysAgo: 7 + (i % 6),
      targetFinalAmount: 1650 + i * 55,
      storeDiscount: 0,
      taxes: [18],
      shouldCreateFeedback: i % 4 === 0,
    };
    const rightRedeemBill = await createPartnerRedeemBillWithFallback(
      right,
      rightRedeemPlan,
      8000 + i * 2,
      rightIndex,
      left.businessId,
      [90, 70, 50, 35, 20, 12, 8],
    );
    rightLog.bills.push(rightRedeemBill);
    rightLog.billsCreated += 1;
    if (rightRedeemBill.hadFeedback) rightLog.feedbackResponsesCreated += 1;

    logProgress(
      `partner redeem done: ${left.businessSlug} <- ${right.businessSlug} and ${right.businessSlug} <- ${left.businessSlug}`,
    );
  }
}

async function writeLogs(logs: DemoAccountLog[]) {
  const logsDir = path.join(process.cwd(), "demo", "logs");
  await fs.mkdir(logsDir, { recursive: true });

  for (const log of logs) {
    const fileName = `${log.accountKey}.json`;
    const filePath = path.join(logsDir, fileName);
    await fs.writeFile(filePath, JSON.stringify(log, null, 2), "utf8");
  }

  const credentials: DemoCredentialLog[] = logs.map((log) => ({
    runId: log.runId,
    accountKey: log.accountKey,
    loyaltyType: log.loyaltyType,
    businessName: log.businessName,
    businessSlug: log.businessSlug,
    adminUserId: log.adminUserId,
    adminEmail: log.adminEmail,
    adminPassword: log.adminPassword,
    cashierUserId: log.cashierUserId,
    cashierId: log.cashierId,
    cashierEmail: log.cashierEmail,
    cashierPassword: log.cashierPassword,
  }));

  const credentialsPath = path.join(logsDir, "credentials.json");
  let existingCredentials: DemoCredentialLog[] = [];
  try {
    const raw = await fs.readFile(credentialsPath, "utf8");
    const parsed = JSON.parse(raw) as DemoCredentialLog[];
    if (Array.isArray(parsed)) {
      existingCredentials = parsed;
    }
  } catch {
    existingCredentials = [];
  }

  const merged = [...existingCredentials, ...credentials];
  const deduped = new Map<string, DemoCredentialLog>();
  for (const item of merged) {
    deduped.set(`${item.runId}:${item.accountKey}`, item);
  }

  await fs.writeFile(
    credentialsPath,
    JSON.stringify([...deduped.values()], null, 2),
    "utf8",
  );
}

export async function createDemoAccounts(
  options: DemoRunOptions = {},
): Promise<DemoAccountLog[]> {
  const runId = makeRunId();
  const billsPerAccount = options.billsPerAccount ?? DEFAULT_BILLS_PER_ACCOUNT;
  const customersPerAccount =
    options.customersPerAccount ?? DEFAULT_CUSTOMERS_PER_ACCOUNT;

  const allScenarios: AccountScenario[] = [
    {
      accountKey: "cashback",
      loyaltyType: "CASHBACK",
      bills: billsPerAccount,
      customers: customersPerAccount,
      categoryCount: 3,
      skuCount: 6,
      referralPairs: 2,
    },
    {
      accountKey: "tier",
      loyaltyType: "TIER",
      bills: billsPerAccount,
      customers: customersPerAccount,
      categoryCount: 3,
      skuCount: 6,
      referralPairs: 2,
    },
    {
      accountKey: "amount_spent",
      loyaltyType: "AMOUNT_SPENT",
      bills: billsPerAccount,
      customers: customersPerAccount,
      categoryCount: 3,
      skuCount: 6,
      referralPairs: 2,
    },
    {
      accountKey: "visit_made",
      loyaltyType: "VISIT_MADE",
      bills: billsPerAccount,
      customers: customersPerAccount,
      categoryCount: 3,
      skuCount: 6,
      referralPairs: 2,
    },
    {
      accountKey: "cashback_large",
      loyaltyType: "CASHBACK",
      bills: 1100,
      customers: 120,
      categoryCount: 12,
      skuCount: 100,
      referralPairs: 20,
      largeData: true,
    },
    {
      accountKey: "partner_left",
      loyaltyType: "CASHBACK",
      bills: 30,
      customers: 20,
      categoryCount: 4,
      skuCount: 12,
      referralPairs: 4,
    },
    {
      accountKey: "partner_right",
      loyaltyType: "CASHBACK",
      bills: 30,
      customers: 20,
      categoryCount: 4,
      skuCount: 12,
      referralPairs: 4,
    },
  ];

  const selectedScenarioKeys =
    options.scenarioKeys && options.scenarioKeys.length > 0
      ? new Set(options.scenarioKeys)
      : null;
  const scenarios = selectedScenarioKeys
    ? allScenarios.filter((s) => selectedScenarioKeys.has(s.accountKey))
    : allScenarios;

  const allLogs: DemoAccountLog[] = [];
  const accountByKey = new Map<string, DemoAccountContext>();
  const logByKey = new Map<string, DemoAccountLog>();

  for (
    let scenarioIndex = 0;
    scenarioIndex < scenarios.length;
    scenarioIndex += 1
  ) {
    const scenario = required(
      scenarios[scenarioIndex],
      `Missing scenario at index ${scenarioIndex}`,
    );
    const loyaltyType = scenario.loyaltyType;
    logProgress(
      `starting account ${scenarioIndex + 1}/${scenarios.length} for loyalty type: ${loyaltyType} (${scenario.accountKey})`,
    );

    const account = await createBusinessStack(
      loyaltyType,
      runId,
      allLogs.length + 1,
      {
        accountKey: scenario.accountKey,
        categoryCount: scenario.categoryCount,
        skuCount: scenario.skuCount,
      },
    );
    await createCustomers(
      account,
      scenario.customers,
      `${runId}${allLogs.length}`,
    );
    const referralsDone = await createReferrals(
      account,
      scenario.referralPairs,
    );

    const plans = scenario.largeData
      ? buildLargeBillPlans(scenario.customers, scenario.bills)
      : buildBillPlans(scenario.customers, scenario.bills);
    const billLogs: DemoBillLog[] = [];

    for (let billIndex = 0; billIndex < plans.length; billIndex += 1) {
      const plan = required(
        plans[billIndex],
        `Missing bill plan at index ${billIndex}`,
      );
      const log = await createBill(account, plan, billIndex);
      billLogs.push(log);
      logProgress(
        `${billIndex + 1}/${plans.length} bill created for ${account.businessSlug} (${scenario.accountKey})`,
      );
    }

    await normalizeWalletLastVisitAt(account);

    const feedbackResponsesCreated = billLogs.filter(
      (b) => b.hadFeedback,
    ).length;

    allLogs.push({
      runId,
      accountKey: scenario.accountKey,
      loyaltyType,
      businessId: account.businessId,
      businessName: account.businessName,
      businessSlug: account.businessSlug,
      adminUserId: account.adminUserId,
      adminEmail: account.adminEmail,
      adminPassword: account.adminPassword,
      cashierUserId: account.cashierUserId,
      cashierId: account.cashierId,
      cashierEmail: account.cashierEmail,
      cashierPassword: account.cashierPassword,
      customersCreated: account.customers.length,
      billsCreated: billLogs.length,
      campaignsCreated: CAMPAIGN_REWARDS.length,
      feedbackResponsesCreated,
      referralsDone,
      bills: billLogs,
    });
    accountByKey.set(scenario.accountKey, account);
    logByKey.set(
      scenario.accountKey,
      required(allLogs[allLogs.length - 1], "Missing just-pushed log"),
    );

    logProgress(
      `completed account ${scenarioIndex + 1}/${scenarios.length} for ${scenario.accountKey}`,
    );
  }

  const partnerLeft = accountByKey.get("partner_left");
  const partnerRight = accountByKey.get("partner_right");
  const partnerLeftLog = logByKey.get("partner_left");
  const partnerRightLog = logByKey.get("partner_right");
  if (partnerLeft && partnerRight && partnerLeftLog && partnerRightLog) {
    await createPartnershipBetween(partnerLeft, partnerRight);
    const shared = await createSharedPartnerCustomers(
      partnerLeft,
      partnerRight,
      16,
      runId,
    );
    await createPartnerInterchangeBills(
      partnerLeft,
      partnerRight,
      partnerLeftLog,
      partnerRightLog,
      shared,
    );
    await normalizeWalletLastVisitAt(partnerLeft);
    await normalizeWalletLastVisitAt(partnerRight);
    logProgress("partner accounts configured with cross-business redemptions");
  }

  await writeLogs(allLogs);
  logProgress(
    `demo creation completed. logs written in ${path.join(process.cwd(), "demo", "logs")}`,
  );

  return allLogs;
}
