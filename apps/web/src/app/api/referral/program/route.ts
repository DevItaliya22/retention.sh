import { withAdminAuth } from "@/lib/auth/middleware";
import {
  createReferralProgramSchema,
  updateReferralProgramSchema,
} from "@/lib/schemas/referral";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import {
  type IsServiceEnabled,
  setServiceEnabled,
} from "@/lib/utils/service-enabled";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

export const GET = withAdminAuth(async (request, context) => {
  try {
    const referralProgram = await db.referralProgram.findUnique({
      where: { businessId: context.business.id },
      include: {
        termsAndConditionsNewCustomer: { orderBy: { createdAt: "asc" } },
        termsAndConditionsExistingCustomer: { orderBy: { createdAt: "asc" } },
        newCustomerFreeItemSku: { select: { id: true, name: true, sku: true } },
        existingCustomerFreeItemSku: {
          select: { id: true, name: true, sku: true },
        },
      },
    });

    if (!referralProgram) {
      return NextResponse.json({ referralProgram: null });
    }

    // Map relation to array of { id, content } for client
    const mapped = {
      ...referralProgram,
      termsAndConditionsNewCustomer:
        referralProgram.termsAndConditionsNewCustomer.map((t) => ({
          id: t.id,
          content: t.content,
        })),
      termsAndConditionsExistingCustomer:
        referralProgram.termsAndConditionsExistingCustomer.map((t) => ({
          id: t.id,
          content: t.content,
        })),
    };

    return NextResponse.json({ referralProgram: mapped });
  } catch (error: any) {
    console.error("Failed to fetch referral program:", error);
    return NextResponse.json(
      {
        referralProgram: null,
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch referral program. Please try again.",
      },
      { status: 500 },
    );
  }
});

export const POST = withAdminAuth(async (request, context) => {
  try {
    const body = await request.json();

    const validation = validateSchema(createReferralProgramSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { referralProgram: null, error: validation.error },
        { status: 400 },
      );
    }
    const validatedData = validation.data;

    const businessId = context.business.id;

    // Check if loyalty is enabled (required for referrals)
    // Use try-catch to handle cases where schema might not be fully migrated
    let hasLoyalty = false;
    try {
      const business = await db.business.findUnique({
        where: { id: businessId },
        select: {
          id: true,
          loyalty: {
            select: {
              id: true,
            },
          },
        },
      });
      hasLoyalty = !!business?.loyalty;
    } catch (error: any) {
      // If the loyalty relation doesn't exist in schema yet, we'll allow it for now
      // but log the error for debugging
      console.warn("Could not check loyalty status:", error);
      // For now, allow referrals without loyalty check if schema is not ready
      // Remove this once migrations are complete and loyalty is required
      hasLoyalty = true; // Temporarily allow
    }

    // Uncomment this once loyalty is properly set up and migrations are complete
    // if (!hasLoyalty) {
    //   return NextResponse.json(
    //     {
    //       referralProgram: null,
    //       error: "Loyalty program must be enabled before setting up referrals",
    //     },
    //     { status: 400 },
    //   );
    // }

    // Upsert referral program (without terms; we sync terms below)
    const createData = {
      businessId,
      isEnabled: true,
      newCustomerBenefitType: validatedData.newCustomerBenefitType,
      newCustomerBenefitValue:
        validatedData.newCustomerBenefitType === "AMOUNT_CASHBACK"
          ? (validatedData.newCustomerBenefitValue ?? 0)
          : 0,
      newCustomerBenefitExpiresInDays:
        validatedData.newCustomerBenefitExpiresInDays ?? null,
      newCustomerFreeItemSkuId:
        validatedData.newCustomerBenefitType === "FREE_ITEM_ON_NEXT_PURCHASE"
          ? (validatedData.newCustomerFreeItemSkuId ?? null)
          : null,
      existingCustomerBenefitType: validatedData.existingCustomerBenefitType,
      existingCustomerBenefitValue:
        validatedData.existingCustomerBenefitType === "AMOUNT_CASHBACK"
          ? (validatedData.existingCustomerBenefitValue ?? 0)
          : 0,
      existingCustomerBenefitExpiresInDays:
        validatedData.existingCustomerBenefitExpiresInDays ?? null,
      existingCustomerFreeItemSkuId:
        validatedData.existingCustomerBenefitType ===
        "FREE_ITEM_ON_NEXT_PURCHASE"
          ? (validatedData.existingCustomerFreeItemSkuId ?? null)
          : null,
      sendReminderToCustomer: validatedData.sendReminderToCustomer,
      whatsappEnabled: validatedData.whatsappEnabled ?? false,
      emailEnabled: validatedData.emailEnabled ?? false,
      smsEnabled: validatedData.smsEnabled ?? false,
      lockReferralPointsUntilFirstPurchase:
        validatedData.lockReferralPointsUntilFirstPurchase ?? false,
      informationSections: validatedData.informationSections as any,
      branding: validatedData.branding as any,
    };

    const referralProgram = await db.referralProgram.upsert({
      where: { businessId },
      create: createData,
      update: createData,
    });

    // Sync terms: replace all TermsAndConditions for this program
    const newTerms = validatedData.termsAndConditionsNewCustomer ?? [];
    const existingTerms =
      validatedData.termsAndConditionsExistingCustomer ?? [];

    await db.$transaction([
      db.termsAndConditions.deleteMany({
        where: { referralProgramNewCustomerId: referralProgram.id },
      }),
      db.termsAndConditions.deleteMany({
        where: { referralProgramExistingCustomerId: referralProgram.id },
      }),
      ...newTerms.map((content) =>
        db.termsAndConditions.create({
          data: {
            content,
            referralProgramNewCustomerId: referralProgram.id,
          },
        }),
      ),
      ...existingTerms.map((content) =>
        db.termsAndConditions.create({
          data: {
            content,
            referralProgramExistingCustomerId: referralProgram.id,
          },
        }),
      ),
    ]);

    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { isServiceEnabled: true },
    });
    const newServiceEnabled = setServiceEnabled(
      (business?.isServiceEnabled ?? null) as IsServiceEnabled | null,
      "referral",
      true,
    );
    await db.business.update({
      where: { id: businessId },
      data: { isServiceEnabled: newServiceEnabled },
    });

    // Refetch with terms included
    const updated = await db.referralProgram.findUnique({
      where: { businessId },
      include: {
        termsAndConditionsNewCustomer: { orderBy: { createdAt: "asc" } },
        termsAndConditionsExistingCustomer: { orderBy: { createdAt: "asc" } },
      },
    });
    const mapped = updated
      ? {
          ...updated,
          termsAndConditionsNewCustomer:
            updated.termsAndConditionsNewCustomer.map((t) => ({
              id: t.id,
              content: t.content,
            })),
          termsAndConditionsExistingCustomer:
            updated.termsAndConditionsExistingCustomer.map((t) => ({
              id: t.id,
              content: t.content,
            })),
        }
      : referralProgram;

    return NextResponse.json({ referralProgram: mapped });
  } catch (error: any) {
    console.error("Failed to create/update referral program:", error);
    return NextResponse.json(
      {
        referralProgram: null,
        error:
          sanitizeErrorMessage(error) ||
          "Failed to create referral program. Please try again.",
      },
      { status: 500 },
    );
  }
});

export const PUT = withAdminAuth(async (request, context) => {
  try {
    const body = await request.json();

    const validation = validateSchema(updateReferralProgramSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { referralProgram: null, error: validation.error },
        { status: 400 },
      );
    }
    const validatedData = validation.data;

    const businessId = context.business.id;

    const existing = await db.referralProgram.findUnique({
      where: { businessId },
    });

    if (!existing) {
      return NextResponse.json(
        {
          referralProgram: null,
          error: "Referral program not found. Create it first.",
        },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (validatedData.newCustomerBenefitType != null) {
      updateData.newCustomerBenefitType = validatedData.newCustomerBenefitType;
      updateData.newCustomerBenefitValue =
        validatedData.newCustomerBenefitType === "AMOUNT_CASHBACK"
          ? (validatedData.newCustomerBenefitValue ?? 0)
          : 0;
      updateData.newCustomerFreeItemSkuId =
        validatedData.newCustomerBenefitType === "FREE_ITEM_ON_NEXT_PURCHASE"
          ? (validatedData.newCustomerFreeItemSkuId ?? null)
          : null;
    }
    if (
      validatedData.newCustomerBenefitValue != null &&
      validatedData.newCustomerBenefitType === "AMOUNT_CASHBACK"
    )
      updateData.newCustomerBenefitValue =
        validatedData.newCustomerBenefitValue;
    if (
      validatedData.newCustomerFreeItemSkuId !== undefined &&
      validatedData.newCustomerBenefitType === "FREE_ITEM_ON_NEXT_PURCHASE"
    )
      updateData.newCustomerFreeItemSkuId =
        validatedData.newCustomerFreeItemSkuId ?? null;
    if (validatedData.newCustomerBenefitExpiresInDays !== undefined)
      updateData.newCustomerBenefitExpiresInDays =
        validatedData.newCustomerBenefitExpiresInDays ?? null;
    if (validatedData.existingCustomerBenefitType != null) {
      updateData.existingCustomerBenefitType =
        validatedData.existingCustomerBenefitType;
      updateData.existingCustomerBenefitValue =
        validatedData.existingCustomerBenefitType === "AMOUNT_CASHBACK"
          ? (validatedData.existingCustomerBenefitValue ?? 0)
          : 0;
      updateData.existingCustomerFreeItemSkuId =
        validatedData.existingCustomerBenefitType ===
        "FREE_ITEM_ON_NEXT_PURCHASE"
          ? (validatedData.existingCustomerFreeItemSkuId ?? null)
          : null;
    }
    if (
      validatedData.existingCustomerBenefitValue != null &&
      validatedData.existingCustomerBenefitType === "AMOUNT_CASHBACK"
    )
      updateData.existingCustomerBenefitValue =
        validatedData.existingCustomerBenefitValue;
    if (
      validatedData.existingCustomerFreeItemSkuId !== undefined &&
      validatedData.existingCustomerBenefitType === "FREE_ITEM_ON_NEXT_PURCHASE"
    )
      updateData.existingCustomerFreeItemSkuId =
        validatedData.existingCustomerFreeItemSkuId ?? null;
    if (validatedData.existingCustomerBenefitExpiresInDays !== undefined)
      updateData.existingCustomerBenefitExpiresInDays =
        validatedData.existingCustomerBenefitExpiresInDays ?? null;
    if (validatedData.sendReminderToCustomer !== undefined)
      updateData.sendReminderToCustomer = validatedData.sendReminderToCustomer;
    if (validatedData.whatsappEnabled !== undefined)
      updateData.whatsappEnabled = validatedData.whatsappEnabled;
    if (validatedData.emailEnabled !== undefined)
      updateData.emailEnabled = validatedData.emailEnabled;
    if (validatedData.smsEnabled !== undefined)
      updateData.smsEnabled = validatedData.smsEnabled;
    if (validatedData.lockReferralPointsUntilFirstPurchase !== undefined)
      updateData.lockReferralPointsUntilFirstPurchase =
        validatedData.lockReferralPointsUntilFirstPurchase;
    if (validatedData.informationSections !== undefined)
      updateData.informationSections = validatedData.informationSections;
    if (validatedData.branding !== undefined)
      updateData.branding = validatedData.branding;

    const referralProgram = await db.referralProgram.update({
      where: { businessId },
      data: updateData as any,
    });

    // Sync terms when provided
    if (validatedData.termsAndConditionsNewCustomer !== undefined) {
      await db.termsAndConditions.deleteMany({
        where: { referralProgramNewCustomerId: referralProgram.id },
      });
      const newTerms = validatedData.termsAndConditionsNewCustomer ?? [];
      for (const content of newTerms) {
        await db.termsAndConditions.create({
          data: {
            content,
            referralProgramNewCustomerId: referralProgram.id,
          },
        });
      }
    }
    if (validatedData.termsAndConditionsExistingCustomer !== undefined) {
      await db.termsAndConditions.deleteMany({
        where: { referralProgramExistingCustomerId: referralProgram.id },
      });
      const existingTerms =
        validatedData.termsAndConditionsExistingCustomer ?? [];
      for (const content of existingTerms) {
        await db.termsAndConditions.create({
          data: {
            content,
            referralProgramExistingCustomerId: referralProgram.id,
          },
        });
      }
    }

    // Refetch with terms
    const updated = await db.referralProgram.findUnique({
      where: { businessId },
      include: {
        termsAndConditionsNewCustomer: { orderBy: { createdAt: "asc" } },
        termsAndConditionsExistingCustomer: { orderBy: { createdAt: "asc" } },
      },
    });
    const mapped = updated
      ? {
          ...updated,
          termsAndConditionsNewCustomer:
            updated.termsAndConditionsNewCustomer.map((t) => ({
              id: t.id,
              content: t.content,
            })),
          termsAndConditionsExistingCustomer:
            updated.termsAndConditionsExistingCustomer.map((t) => ({
              id: t.id,
              content: t.content,
            })),
        }
      : referralProgram;

    return NextResponse.json({ referralProgram: mapped });
  } catch (error: any) {
    console.error("Failed to update referral program:", error);
    return NextResponse.json(
      {
        referralProgram: null,
        error:
          sanitizeErrorMessage(error) ||
          "Failed to update referral program. Please try again.",
      },
      { status: 500 },
    );
  }
});
