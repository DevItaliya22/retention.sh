import { withAdminAuth } from "@/lib/auth/middleware";
import { customerSlugIdParamSchema } from "@/lib/schemas/customer";
import { r2KeyBuilders, uploadObject } from "@/lib/storage/r2";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const avatarQuerySchema = z.object({
  filename: z.string().max(255),
  contentType: z.string().max(255).optional(),
});

export const POST = withAdminAuth<{ slugId: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const paramValidation = validateSchema(customerSlugIdParamSchema, params);
      if (!paramValidation.success) {
        return NextResponse.json(
          { error: paramValidation.error, customer: null },
          { status: 400 },
        );
      }

      const url = new URL(request.url);
      const queryValidation = validateSchema(avatarQuerySchema, {
        filename: url.searchParams.get("filename"),
        contentType: url.searchParams.get("contentType") || undefined,
      });
      if (!queryValidation.success) {
        return NextResponse.json(
          { error: queryValidation.error, customer: null },
          { status: 400 },
        );
      }

      const { filename, contentType } = queryValidation.data;

      const businessCustomer = await db.businessCustomer.findFirst({
        where: {
          slugId: paramValidation.data.slugId,
          businessId: context.business.id,
        },
        include: {
          customer: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!businessCustomer) {
        return NextResponse.json(
          { error: "Customer not found", customer: null },
          { status: 404 },
        );
      }

      const buffer = Buffer.from(await request.arrayBuffer());

      const key = r2KeyBuilders.avatar(
        businessCustomer.customer.user.id,
        filename,
      );

      const uploaded = await uploadObject({
        key,
        body: buffer,
        contentType,
      });

      const updatedCustomer = await db.customer.update({
        where: { id: businessCustomer.customer.id },
        data: {
          avatarUrl: uploaded.url,
          avatarKey: uploaded.key,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
        },
      });

      const responseCustomer = {
        id: businessCustomer.slugId,
        slugId: businessCustomer.slugId,
        customerId: updatedCustomer.id,
        name: updatedCustomer.user.name,
        email: updatedCustomer.email,
        phone: updatedCustomer.user.phoneNumber,
        avatarUrl: updatedCustomer.avatarUrl,
      };

      return NextResponse.json({ customer: responseCustomer });
    } catch (error: unknown) {
      return NextResponse.json(
        {
          error:
            sanitizeErrorMessage(error) ||
            "Failed to upload avatar. Please try again.",
          customer: null,
        },
        { status: 500 },
      );
    }
  },
);
