import { withAdminAuth } from "@/lib/auth/middleware";
import { createSegmentSchema } from "@/lib/schemas/segment";
import { seedDefaultSegments } from "@/lib/segmentation";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (_request: NextRequest, context) => {
  try {
    const businessId = context.business.id;
    let segments = await db.segment.findMany({
      where: { businessId },
      orderBy: { sortOrder: "asc" },
    });

    if (segments.length === 0) {
      await seedDefaultSegments(businessId);
      segments = await db.segment.findMany({
        where: { businessId },
        orderBy: { sortOrder: "asc" },
      });
    }

    return NextResponse.json({ items: segments });
  } catch (error: unknown) {
    console.error("Failed to fetch segments:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed to fetch segments.",
        items: [],
      },
      { status: 500 },
    );
  }
});

export const POST = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const body = await request.json();
    const validation = validateSchema(createSegmentSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const businessId = context.business.id;
    const data = validation.data;

    const existing = await db.segment.findFirst({
      where: {
        businessId,
        OR: [{ name: data.name }, { slug: data.slug }],
      },
    });
    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.name === data.name
              ? "A segment with this name already exists"
              : "A segment with this slug already exists",
        },
        { status: 409 },
      );
    }

    const segment = await db.segment.create({
      data: {
        businessId,
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        proTip: data.proTip ?? null,
        sortOrder: data.sortOrder ?? 0,
        isSystem: false,
        recencyOperator: data.recencyOperator ?? null,
        recencyValue: data.recencyValue ?? null,
        recencyValue2: data.recencyValue2 ?? null,
        recencyUnit: data.recencyUnit ?? "DAYS",
        frequencyOperator: data.frequencyOperator ?? null,
        frequencyValue: data.frequencyValue ?? null,
        frequencyValue2: data.frequencyValue2 ?? null,
        monetaryUnit: data.monetaryUnit ?? "RATIO",
        monetaryOperator: data.monetaryOperator ?? null,
        monetaryValue: data.monetaryValue ?? null,
        monetaryValue2: data.monetaryValue2 ?? null,
      },
    });

    return NextResponse.json(segment);
  } catch (error: unknown) {
    console.error("Failed to create segment:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed to create segment.",
      },
      { status: 500 },
    );
  }
});
