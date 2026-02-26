import { withAdminAuth } from "@/lib/auth/middleware";
import { updatePartnershipSettingsSchema } from "@/lib/schemas/partnership";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (_request: NextRequest, context) => {
  try {
    const business = await db.business.findUnique({
      where: { id: context.business.id },
      select: {
        receivePartnershipOffers: true,
      },
    });

    return NextResponse.json({
      receivePartnershipOffers: business?.receivePartnershipOffers ?? false,
    });
  } catch (error) {
    console.error("Partnership settings GET error:", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) },
      { status: 500 },
    );
  }
});

export const PUT = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const body = await request.json();
    const validation = validateSchema(updatePartnershipSettingsSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { receivePartnershipOffers } = validation.data;

    const updated = await db.business.update({
      where: { id: context.business.id },
      data: {
        ...(receivePartnershipOffers !== undefined && {
          receivePartnershipOffers,
        }),
      },
      select: {
        receivePartnershipOffers: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Partnership settings PUT error:", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) },
      { status: 500 },
    );
  }
});
