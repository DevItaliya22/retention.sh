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
  DEMO_LOYALTY_TYPES,
} from "./constants";
import type {
  DemoAccountLog,
  DemoBillLog,
  DemoBillPlan,
  DemoCredentialLog,
  DemoReferralLog,
  DemoRunOptions,
} from "./types";

interface PreparedCustomer {
  userId: string;
  customerId: string;
  name: string;
  phoneNumber: string;
}

interface DemoAccountContext {
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
): Promise<DemoAccountContext> {
  const slugBase = generateSlug(
    `demo-${loyaltyType.toLowerCase()}-${runId}-${accountIndex}`,
  );
  const businessSlug = `${slugBase}-${Math.random().toString(36).slice(2, 7)}`;
  const businessName = `Demo ${loyaltyType.replace("_", " ")} ${runId}`;
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

  const adminEmail = `demo.admin.${loyaltyType.toLowerCase()}.${runId}@dy.com`;
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
      email: `cashier.user.${loyaltyType.toLowerCase()}.${runId}@dy.com`,
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

  const categories = await Promise.all([
    db.category.create({
      data: {
        businessId: business.id,
        name: "Beverages",
        description: "Drinks",
        sortOrder: 1,
      },
    }),
    db.category.create({
      data: {
        businessId: business.id,
        name: "Snacks",
        description: "Quick bites",
        sortOrder: 2,
      },
    }),
    db.category.create({
      data: {
        businessId: business.id,
        name: "Daily Essentials",
        description: "Essentials",
        sortOrder: 3,
      },
    }),
  ]);

  const skuSeed = [
    {
      sku: "BEV-01",
      name: "Cold Coffee",
      price: 180,
      categoryId: categories[0].id,
    },
    {
      sku: "BEV-02",
      name: "Fresh Juice",
      price: 130,
      categoryId: categories[0].id,
    },
    {
      sku: "SNK-01",
      name: "Protein Bar",
      price: 90,
      categoryId: categories[1].id,
    },
    { sku: "SNK-02", name: "Nachos", price: 110, categoryId: categories[1].id },
    {
      sku: "ESS-01",
      name: "Shampoo",
      price: 240,
      categoryId: categories[2].id,
    },
    {
      sku: "ESS-02",
      name: "Body Wash",
      price: 310,
      categoryId: categories[2].id,
    },
  ];

  const skus = [] as Array<{ id: string }>;
  for (const [idx, item] of skuSeed.entries()) {
    const created = await db.sku.create({
      data: {
        businessId: business.id,
        categoryId: item.categoryId,
        sku: `${item.sku}-${accountIndex}`,
        name: item.name,
        price: item.price + idx,
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
  const count = Math.min(customersPerAccount, names.length);

  const created = [] as PreparedCustomer[];
  await db.$transaction(async (tx) => {
    for (let i = 0; i < count; i += 1) {
      const phoneSeed = Number(
        `${runId.slice(-6)}${String(i + 1).padStart(2, "0")}`,
      );
      const phoneNumber = buildCustomerPhone(phoneSeed);
      const customer = await findOrCreateCustomer(tx, {
        businessId: account.businessId,
        name: required(names[i], `Missing customer name at index ${i}`),
        phoneNumber,
      });
      created.push(customer);
    }
  });

  account.customers = created;
}

async function createReferrals(
  account: DemoAccountContext,
): Promise<DemoReferralLog[]> {
  const referrals: DemoReferralLog[] = [];
  if (account.customers.length < 8) return referrals;

  const pairs: Array<[number, number]> = [
    [0, 6],
    [1, 7],
  ];

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
): Promise<DemoBillLog> {
  const customer = required(
    account.customers[plan.customerIndex],
    `Missing customer for plan index ${plan.customerIndex}`,
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
    const latestBill = await db.bill.findFirst({
      where: {
        businessId: account.businessId,
        customerId: customer.customerId,
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

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
      },
    });
  }
}

async function writeLogs(logs: DemoAccountLog[]) {
  const logsDir = path.join(process.cwd(), "demo", "logs");
  await fs.mkdir(logsDir, { recursive: true });

  for (const log of logs) {
    const fileName = `${log.loyaltyType.toLowerCase()}.json`;
    const filePath = path.join(logsDir, fileName);
    await fs.writeFile(filePath, JSON.stringify(log, null, 2), "utf8");
  }

  const credentials: DemoCredentialLog[] = logs.map((log) => ({
    runId: log.runId,
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
  await fs.writeFile(
    credentialsPath,
    JSON.stringify(credentials, null, 2),
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

  const allLogs: DemoAccountLog[] = [];

  for (let i = 0; i < DEMO_LOYALTY_TYPES.length; i += 1) {
    const loyaltyType = required(
      DEMO_LOYALTY_TYPES[i],
      `Missing loyalty type at index ${i}`,
    );
    logProgress(`starting account ${i + 1}/4 for loyalty type: ${loyaltyType}`);

    const account = await createBusinessStack(loyaltyType, runId, i + 1);
    await createCustomers(account, customersPerAccount, `${runId}${i}`);
    const referralsDone = await createReferrals(account);

    const plans = buildBillPlans(customersPerAccount, billsPerAccount);
    const billLogs: DemoBillLog[] = [];

    for (let billIndex = 0; billIndex < plans.length; billIndex += 1) {
      const plan = required(
        plans[billIndex],
        `Missing bill plan at index ${billIndex}`,
      );
      const log = await createBill(account, plan, billIndex);
      billLogs.push(log);
      logProgress(
        `${billIndex + 1}/${plans.length} bill created for ${account.businessSlug} (${loyaltyType})`,
      );
    }

    await normalizeWalletLastVisitAt(account);

    const feedbackResponsesCreated = billLogs.filter(
      (b) => b.hadFeedback,
    ).length;

    allLogs.push({
      runId,
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

    logProgress(`completed account ${i + 1}/4 for ${loyaltyType}`);
  }

  await writeLogs(allLogs);
  logProgress(
    `demo creation completed. logs written in ${path.join(process.cwd(), "demo", "logs")}`,
  );

  return allLogs;
}
