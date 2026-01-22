"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@reelo/db";
import { headers } from "next/headers";
import { z } from "zod";

import {
  addCashierSchema,
  updateBusinessSchema,
  updateCashierSchema,
} from "@/lib/schemas/business-settings";

export async function getBusinessSettings() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const admin = await prisma.admin.findUnique({
    where: { userId: session.user.id },
    include: {
      business: {
        include: {
          defaultBranding: true,
          cashiers: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!admin) {
    return null;
  }

  return {
    business: admin.business,
    cashiers: admin.business.cashiers.map((c) => ({
      id: c.id,
      name: c.user.name,
      email: c.user.email,
      linkSlug: c.cashierLinkSlug,
    })),
  };
}

export async function updateBusinessSettings(
  values: z.infer<typeof updateBusinessSchema>,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return { error: "Unauthorized", success: false };
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { userId: session.user.id },
    });

    if (!admin) {
      return { error: "Admin not found", success: false };
    }

    // Check if new slug is taken by another business
    const existingBusiness = await prisma.business.findFirst({
      where: {
        slug: values.businessSlug,
        NOT: { id: admin.businessId },
      },
    });

    if (existingBusiness) {
      return { error: "Slug is already taken", success: false };
    }

    await prisma.business.update({
      where: { id: admin.businessId },
      data: {
        name: values.businessName,
        slug: values.businessSlug,
        defaultPointsName: values.defaultPointsName,
        defaultCurrencySymbol: values.defaultCurrencySymbol,
        defaultCurrencyCode: values.defaultCurrencyCode,
        defaultBranding: {
          upsert: {
            create: {
              logo: values.logo,
              themeColor: values.themeColor,
            },
            update: {
              logo: values.logo,
              themeColor: values.themeColor,
            },
          },
        },
      },
    });

    return { success: true };
  } catch (error: any) {
    return {
      error: error.message || "Failed to update business",
      success: false,
    };
  }
}

export async function updateCashierSettings(
  values: z.infer<typeof updateCashierSchema>,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return { error: "Unauthorized", success: false };
  }

  try {
    if (!values.id) return { error: "Cashier ID required", success: false };

    const cashier = await prisma.cashier.findUnique({
      where: { id: values.id },
      include: { business: { include: { admins: true } } },
    });

    if (
      !cashier ||
      !cashier.business.admins.some((a) => a.userId === session.user.id)
    ) {
      return { error: "Unauthorized or Cashier not found", success: false };
    }

    // Check if new slug is taken
    if (values.cashierLinkSlug) {
      const existingSlug = await prisma.cashier.findFirst({
        where: {
          cashierLinkSlug: values.cashierLinkSlug,
          NOT: { id: values.id },
        },
      });
      if (existingSlug)
        return { error: "Cashier slug already taken", success: false };
    }

    await prisma.$transaction(async (tx) => {
      await tx.cashier.update({
        where: { id: values.id },
        data: {
          cashierLinkSlug: values.cashierLinkSlug,
        },
      });

      if (values.cashierName || values.cashierEmail) {
        await tx.user.update({
          where: { id: cashier.userId },
          data: {
            name: values.cashierName,
            email: values.cashierEmail,
          },
        });
      }
    });

    return { success: true };
  } catch (error: any) {
    return {
      error: error.message || "Failed to update cashier",
      success: false,
    };
  }
}

export async function addCashierSettings(
  values: z.infer<typeof addCashierSchema>,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return { error: "Unauthorized", success: false };
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { userId: session.user.id },
    });

    if (!admin) {
      return { error: "Admin not found", success: false };
    }

    // Check if cashier link slug exists
    const existingCashierSlug = await prisma.cashier.findUnique({
      where: { cashierLinkSlug: values.cashierLinkSlug },
    });

    if (existingCashierSlug) {
      return { error: "Cashier link slug already exists", success: false };
    }

    // Check if user already exists
    let cashierUser = await prisma.user.findUnique({
      where: { email: values.cashierEmail },
    });

    if (!cashierUser) {
      cashierUser = await prisma.user.create({
        data: {
          name: values.cashierName || "Cashier",
          email: values.cashierEmail,
          role: "CASHIER",
        },
      });
    } else if (cashierUser.role !== "CASHIER") {
      return {
        error: "User with this email already exists with a different role",
        success: false,
      };
    }

    const cashier = await prisma.cashier.create({
      data: {
        userId: cashierUser.id,
        businessId: admin.businessId,
        cashierLinkSlug: values.cashierLinkSlug!,
        password: values.cashierPassword,
      },
      include: {
        user: true,
      },
    });

    return {
      success: true,
      cashier: {
        id: cashier.id,
        name: cashierUser.name,
        email: cashierUser.email,
        linkSlug: cashier.cashierLinkSlug,
      },
    };
  } catch (error: any) {
    return { error: error.message || "Failed to add cashier", success: false };
  }
}
