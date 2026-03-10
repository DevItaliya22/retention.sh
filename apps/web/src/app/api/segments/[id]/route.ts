import { withAdminAuth } from "@/lib/auth/middleware";
import { updateSegmentSchema } from "@/lib/schemas/segment";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth<{ id: string }>(
  async (_request: NextRequest, context, params) => {
    try {
      const id = typeof params.id === "string" ? params.id : params.id?.[0];
      if (!id) {
        return NextResponse.json(
          { error: "Segment ID required" },
          { status: 400 },
        );
      }

      const segment = await db.segment.findFirst({
        where: {
          id,
          businessId: context.business.id,
        },
      });

      if (!segment) {
        return NextResponse.json(
          { error: "Segment not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(segment);
    } catch (error: unknown) {
      console.error("Failed to fetch segment:", error);
      return NextResponse.json(
        {
          error: sanitizeErrorMessage(error) || "Failed to fetch segment.",
        },
        { status: 500 },
      );
    }
  },
);

export const PUT = withAdminAuth<{ id: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const id = typeof params.id === "string" ? params.id : params.id?.[0];
      if (!id) {
        return NextResponse.json(
          { error: "Segment ID required" },
          { status: 400 },
        );
      }

      const body = await request.json();
      const validation = validateSchema(updateSegmentSchema, body);
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const existing = await db.segment.findFirst({
        where: {
          id,
          businessId: context.business.id,
        },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "Segment not found" },
          { status: 404 },
        );
      }

      const data = validation.data;

      if (data.name && data.name !== existing.name) {
        const nameConflict = await db.segment.findFirst({
          where: {
            businessId: context.business.id,
            name: data.name,
            id: { not: id },
          },
        });
        if (nameConflict) {
          return NextResponse.json(
            { error: "A segment with this name already exists" },
            { status: 409 },
          );
        }
      }
      if (data.slug && data.slug !== existing.slug) {
        const slugConflict = await db.segment.findFirst({
          where: {
            businessId: context.business.id,
            slug: data.slug,
            id: { not: id },
          },
        });
        if (slugConflict) {
          return NextResponse.json(
            { error: "A segment with this slug already exists" },
            { status: 409 },
          );
        }
      }

      const segment = await db.segment.update({
        where: { id },
        data: {
          ...(data.name != null && { name: data.name }),
          ...(data.slug != null && { slug: data.slug }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.proTip !== undefined && { proTip: data.proTip }),
          ...(data.sortOrder != null && { sortOrder: data.sortOrder }),
          ...(data.recencyOperator !== undefined && {
            recencyOperator: data.recencyOperator,
          }),
          ...(data.recencyValue !== undefined && {
            recencyValue: data.recencyValue,
          }),
          ...(data.recencyValue2 !== undefined && {
            recencyValue2: data.recencyValue2,
          }),
          ...(data.recencyUnit !== undefined && {
            recencyUnit: data.recencyUnit,
          }),
          ...(data.frequencyOperator !== undefined && {
            frequencyOperator: data.frequencyOperator,
          }),
          ...(data.frequencyValue !== undefined && {
            frequencyValue: data.frequencyValue,
          }),
          ...(data.frequencyValue2 !== undefined && {
            frequencyValue2: data.frequencyValue2,
          }),
          ...(data.monetaryUnit !== undefined && {
            monetaryUnit: data.monetaryUnit,
          }),
          ...(data.monetaryOperator !== undefined && {
            monetaryOperator: data.monetaryOperator,
          }),
          ...(data.monetaryValue !== undefined && {
            monetaryValue: data.monetaryValue,
          }),
          ...(data.monetaryValue2 !== undefined && {
            monetaryValue2: data.monetaryValue2,
          }),
        },
      });

      return NextResponse.json(segment);
    } catch (error: unknown) {
      console.error("Failed to update segment:", error);
      return NextResponse.json(
        {
          error: sanitizeErrorMessage(error) || "Failed to update segment.",
        },
        { status: 500 },
      );
    }
  },
);

export const DELETE = withAdminAuth<{ id: string }>(
  async (_request: NextRequest, context, params) => {
    try {
      const id = typeof params.id === "string" ? params.id : params.id?.[0];
      if (!id) {
        return NextResponse.json(
          { error: "Segment ID required" },
          { status: 400 },
        );
      }

      const existing = await db.segment.findFirst({
        where: {
          id,
          businessId: context.business.id,
        },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "Segment not found" },
          { status: 404 },
        );
      }

      if (existing.isSystem) {
        return NextResponse.json(
          { error: "System segments cannot be deleted" },
          { status: 403 },
        );
      }

      await db.segment.delete({ where: { id } });
      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      console.error("Failed to delete segment:", error);
      return NextResponse.json(
        {
          error: sanitizeErrorMessage(error) || "Failed to delete segment.",
        },
        { status: 500 },
      );
    }
  },
);
