"use server"

import { prisma } from "@reelo/db";
import { auth } from "@/lib/auth/auth";
import { type WelcomeFormValues } from "@/lib/schemas/onboarding";
import { headers } from "next/headers";

export async function submitWelcomeForm(values: WelcomeFormValues) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) {
    return { error: "Unauthorized", success: false };
  }

  const userId = session.user.id;

  try {
    // Check if business slug already exists
    const existingBusiness = await prisma.business.findUnique({
      where: { slug: values.businessSlug }
    });

    if (existingBusiness) {
      return { error: "Business slug already exists. Please choose another one.", success: false };
    }

    // Create Business, Branding, Admin and Update User role in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create Business
      const business = await tx.business.create({
        data: {
          name: values.businessName,
          slug: values.businessSlug,
          defaultPointsName: values.defaultPointsName || "Points",
          defaultCurrencySymbol: values.defaultCurrencySymbol || "₹",
          defaultCurrencyCode: values.defaultCurrencyCode || "INR",
          defaultBranding: {
            create: {
              logo: values.logo,
              themeColor: values.themeColor,
            }
          }
        }
      });

      // 2. Link User as Admin
      await tx.admin.create({
        data: {
          userId: userId,
          businessId: business.id,
        }
      });

      // Update user role to ADMIN
      await tx.user.update({
        where: { id: userId },
        data: { role: "ADMIN" }
      });

      // 3. (Optional) Create Cashier
      if (values.createCashier && values.cashierEmail && values.cashierPassword && values.cashierLinkSlug) {
        // Check if cashier link slug exists
        const existingCashierSlug = await tx.cashier.findUnique({
          where: { cashierLinkSlug: values.cashierLinkSlug }
        });

        if (existingCashierSlug) {
          throw new Error("Cashier link slug already exists.");
        }

        // Check if user already exists
        let cashierUser = await tx.user.findUnique({
          where: { email: values.cashierEmail }
        });

        if (!cashierUser) {
          cashierUser = await tx.user.create({
            data: {
              name: values.cashierName || "Cashier",
              email: values.cashierEmail,
              role: "CASHIER",
            }
          });
        }

        await tx.cashier.create({
          data: {
            userId: cashierUser.id,
            businessId: business.id,
            cashierLinkSlug: values.cashierLinkSlug,
            password: values.cashierPassword,
          }
        });
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Welcome form submission error:", error);
    return { error: error.message || "Failed to complete setup", success: false };
  }
}
