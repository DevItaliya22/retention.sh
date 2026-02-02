import { withAdminAuth } from "@/lib/auth/middleware";
import { APP_CONSTANTS } from "@/lib/constants/app";
import { customerImportSchema } from "@/lib/schemas/customer";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { formatPhoneNumber } from "@/lib/utils/phone";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * Customer Import Flow:
 * 1. Format phone number using formatPhoneNumber (E.164)
 * 2. Check if User exists with that phone number:
 *    - If NO: Create User with role CUSTOMER, email as "formattedPhone@dy.com"
 * 3. Check if Customer exists for that User:
 *    - If NO: Create Customer with the real email from CSV
 * 4. Check if BusinessCustomer exists for this business + customer:
 *    - If NO: Create BusinessCustomer with tags, isBlocked, etc.
 *    - If YES: Skip (customer already exists in this business)
 */

export const POST = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const body = await request.json();

    const validation = validateSchema(customerImportSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, created: 0, failed: 0, errors: [] },
        { status: 400 },
      );
    }

    const { items } = validation.data;
    const businessId = context.business.id;

    let created = 0;
    const errors: { row: number; phone: string; message: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      const rowNum = i + 1;

      try {
        // Step 1: Format and validate phone number
        let formattedPhone: string;
        try {
          formattedPhone = formatPhoneNumber(item.phone);
        } catch (err) {
          errors.push({
            row: rowNum,
            phone: item.phone,
            message: "Invalid phone number format",
          });
          continue;
        }

        // Step 2: Find or create User
        let user = await db.user.findFirst({
          where: { phoneNumber: formattedPhone },
          include: { customer: true },
        });

        if (!user) {
          // Create new User with placeholder email
          const placeholderEmail = `${formattedPhone.replace("+", "")}@${APP_CONSTANTS.CUSTOMER_EMAIL_DOMAIN}`;

          user = await db.user.create({
            data: {
              name: item.name?.trim() || "Customer",
              phoneNumber: formattedPhone,
              phoneNumberVerified: false,
              email: placeholderEmail,
              emailVerified: false,
              role: "CUSTOMER",
            },
            include: { customer: true },
          });
        }

        // Step 3: Find or create Customer
        let customer = user.customer;

        if (!customer) {
          // Create Customer with real email (or empty string if not provided)
          customer = await db.customer.create({
            data: {
              userId: user.id,
              email: item.email?.trim() || "",
              addressLine1: item.addressLine1?.trim() || null,
              addressLine2: item.addressLine2?.trim() || null,
              city: item.city?.trim() || null,
              state: item.state?.trim() || null,
              country: item.country?.trim() || null,
              postalCode: item.postalCode?.trim() || null,
            },
          });
        } else {
          // Update Customer with new address info if provided
          const updateData: Record<string, unknown> = {};

          if (item.email?.trim() && !customer.email) {
            updateData.email = item.email.trim();
          }
          if (item.addressLine1?.trim() && !customer.addressLine1) {
            updateData.addressLine1 = item.addressLine1.trim();
          }
          if (item.addressLine2?.trim() && !customer.addressLine2) {
            updateData.addressLine2 = item.addressLine2.trim();
          }
          if (item.city?.trim() && !customer.city) {
            updateData.city = item.city.trim();
          }
          if (item.state?.trim() && !customer.state) {
            updateData.state = item.state.trim();
          }
          if (item.country?.trim() && !customer.country) {
            updateData.country = item.country.trim();
          }
          if (item.postalCode?.trim() && !customer.postalCode) {
            updateData.postalCode = item.postalCode.trim();
          }

          if (Object.keys(updateData).length > 0) {
            customer = await db.customer.update({
              where: { id: customer.id },
              data: updateData,
            });
          }
        }

        // Step 4: Check if BusinessCustomer already exists
        const existingBusinessCustomer = await db.businessCustomer.findUnique({
          where: {
            businessId_customerId: {
              businessId,
              customerId: customer.id,
            },
          },
        });

        if (existingBusinessCustomer) {
          errors.push({
            row: rowNum,
            phone: item.phone,
            message: "Customer already exists in this business",
          });
          continue;
        }

        // Parse tags from comma-separated string
        const tags: string[] = item.tags
          ? item.tags
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t.length > 0)
          : [];

        // Step 5: Create BusinessCustomer
        await db.businessCustomer.create({
          data: {
            businessId,
            customerId: customer.id,
            tags,
            isBlocked: item.isBlocked ?? false,
          },
        });

        created++;
      } catch (err) {
        errors.push({
          row: rowNum,
          phone: item.phone,
          message: sanitizeErrorMessage(err) ?? "Failed to import customer",
        });
      }
    }

    return NextResponse.json({
      created,
      failed: errors.length,
      errors: errors.slice(0, 20),
    });
  } catch (error: unknown) {
    console.error("Failed to import customers:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ??
          "Failed to import customers. Please try again.",
        created: 0,
        failed: 0,
        errors: [],
      },
      { status: 500 },
    );
  }
});
