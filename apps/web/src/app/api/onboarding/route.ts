import { withAdminAuthOptionalBusiness } from "@/lib/auth/middleware";
import { FEEDBACK_FORM_DEFAULTS } from "@/lib/constants/forms/feedback";
import {
  type WelcomeFormValues,
  welcomeFormSchema,
} from "@/lib/schemas/onboarding";
import { buildCashierEmail } from "@/lib/utils/cashier-email";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { hashPassword } from "@/lib/utils/password";
import { DEFAULT_SERVICES_ON_CREATION } from "@/lib/utils/service-enabled";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAdminAuthOptionalBusiness(
  async (request: NextRequest, context, _params) => {
    try {
      const body = await request.json();

      const validation = validateSchema(welcomeFormSchema, body);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error, success: false },
          { status: 400 },
        );
      }
      const validatedData = validation.data as WelcomeFormValues;
      const userId = context.user.id;

      const existingBusiness = await db.business.findUnique({
        where: { slug: validatedData.businessSlug },
        include: { admins: { where: { userId: userId }, take: 1 } },
      });

      if (existingBusiness) {
        const userOwnsBusiness = existingBusiness.admins.length > 0;
        if (userOwnsBusiness) {
          return NextResponse.json({ success: true });
        }
        return NextResponse.json(
          {
            error: "Business slug already exists. Please choose another one.",
            success: false,
          },
          { status: 400 },
        );
      }

      await db.$transaction(async (tx) => {
        const industries =
          Array.isArray(validatedData.industries) &&
          validatedData.industries.length > 0
            ? validatedData.industries
            : [];

        const business = await tx.business.create({
          data: {
            name: validatedData.businessName,
            slug: validatedData.businessSlug,
            website: validatedData.website || null,
            defaultPointsName: validatedData.defaultPointsName || "Points",
            defaultCurrencySymbol: validatedData.defaultCurrencySymbol || "₹",
            defaultCurrencyCode: validatedData.defaultCurrencyCode || "INR",
            industries,
            isServiceEnabled: DEFAULT_SERVICES_ON_CREATION,
            defaultBranding: {
              create: {
                logo: validatedData.logo,
                themeColor: validatedData.themeColor,
              },
            },
          },
        });

        await tx.admin.create({
          data: {
            userId: userId,
            businessId: business.id,
          },
        });

        await tx.feedbackConfig.create({
          data: {
            businessId: business.id,
            positiveFollowUp: FEEDBACK_FORM_DEFAULTS.followUpMessage,
            negativeFollowUp: FEEDBACK_FORM_DEFAULTS.followUpMessage,
            selectionOptions: {
              create: FEEDBACK_FORM_DEFAULTS.selectionOptions.map(
                (label, idx) => ({
                  label,
                  seq: idx,
                }),
              ),
            },
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: { role: "ADMIN" },
        });

        if (
          validatedData.createCashier &&
          validatedData.cashierEmailLocalPart &&
          validatedData.cashierEmailSuffix &&
          validatedData.cashierPassword &&
          validatedData.cashierLinkSlug
        ) {
          const cashierEmail = buildCashierEmail(
            validatedData.cashierEmailLocalPart,
            validatedData.businessSlug,
            validatedData.cashierEmailSuffix,
          );

          const existingCashierSlug = await tx.cashier.findFirst({
            where: {
              cashierLinkSlug: validatedData.cashierLinkSlug,
              businessId: business.id,
            },
          });

          if (existingCashierSlug) {
            throw new Error("Cashier link slug already exists.");
          }

          const existingCashierEmail = await tx.cashier.findFirst({
            where: {
              businessId: business.id,
              email: cashierEmail,
            },
          });

          if (existingCashierEmail) {
            throw new Error(
              "A cashier with this email already exists in this business.",
            );
          }

          const cashierUser = await tx.user.create({
            data: {
              name: validatedData.cashierName || "Cashier",
              email: null,
              role: "CASHIER",
            },
          });

          const cashierPasswordHash = await hashPassword(
            validatedData.cashierPassword,
          );
          await tx.cashier.create({
            data: {
              userId: cashierUser.id,
              businessId: business.id,
              cashierLinkSlug: validatedData.cashierLinkSlug,
              email: cashierEmail,
              password: cashierPasswordHash,
            },
          });
        }
      });

      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      console.error("Onboarding error:", error);

      return NextResponse.json(
        {
          error:
            sanitizeErrorMessage(error) ||
            "Failed to complete setup. Please try again.",
          success: false,
        },
        { status: 500 },
      );
    }
  },
);
