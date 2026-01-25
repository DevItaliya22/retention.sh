import { auth } from "@/lib/auth/auth";
import {
  type WelcomeFormValues,
  welcomeFormSchema,
} from "@/lib/schemas/onboarding";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { prisma } from "@reelo/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validatedData = welcomeFormSchema.parse(body) as WelcomeFormValues;
    const userId = session.user.id;

    const existingBusiness = await prisma.business.findUnique({
      where: { slug: validatedData.businessSlug },
    });

    if (existingBusiness) {
      return NextResponse.json(
        {
          error: "Business slug already exists. Please choose another one.",
          success: false,
        },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: validatedData.businessName,
          slug: validatedData.businessSlug,
          defaultPointsName: validatedData.defaultPointsName || "Points",
          defaultCurrencySymbol: validatedData.defaultCurrencySymbol || "₹",
          defaultCurrencyCode: validatedData.defaultCurrencyCode || "INR",
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

      await tx.user.update({
        where: { id: userId },
        data: { role: "ADMIN" },
      });

      if (
        validatedData.createCashier &&
        validatedData.cashierEmail &&
        validatedData.cashierPassword &&
        validatedData.cashierLinkSlug
      ) {
        const existingCashierSlug = await tx.cashier.findFirst({
          where: {
            cashierLinkSlug: validatedData.cashierLinkSlug,
            businessId: business.id,
          },
        });

        if (existingCashierSlug) {
          throw new Error("Cashier link slug already exists.");
        }

        let cashierUser = await tx.user.findUnique({
          where: { email: validatedData.cashierEmail },
        });

        if (!cashierUser) {
          cashierUser = await tx.user.create({
            data: {
              name: validatedData.cashierName || "Cashier",
              email: validatedData.cashierEmail,
              role: "CASHIER",
            },
          });
        }

        await tx.cashier.create({
          data: {
            userId: cashierUser.id,
            businessId: business.id,
            cashierLinkSlug: validatedData.cashierLinkSlug,
            password: validatedData.cashierPassword,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Onboarding error:", error);

    if (error.name === "ZodError") {
      const zodErrors = error.errors || [];
      const firstError = zodErrors[0];
      const errorMessage = firstError
        ? `${firstError.path.join(".")}: ${firstError.message}`
        : "Invalid form data";

      return NextResponse.json(
        { error: errorMessage, success: false },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Failed to complete setup. Please try again.", success: false },
      { status: 500 },
    );
  }
}
