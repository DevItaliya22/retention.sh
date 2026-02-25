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
        maxPartnerAllowed: true,
      },
    });

    return NextResponse.json({
      receivePartnershipOffers: business?.receivePartnershipOffers ?? false,
      maxPartnerAllowed: business?.maxPartnerAllowed ?? 1,
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

    const { receivePartnershipOffers, maxPartnerAllowed } = validation.data;

    if (maxPartnerAllowed !== undefined) {
      const activeCount = await db.partnershipMember.count({
        where: {
          businessId: context.business.id,
          partnership: { status: "ACTIVE" },
        },
      });
      if (maxPartnerAllowed < activeCount) {
        return NextResponse.json(
          {
            error: `Cannot set max partners to ${maxPartnerAllowed} — you already have ${activeCount} active partnership(s).`,
          },
          { status: 400 },
        );
      }
    }

    const updated = await db.business.update({
      where: { id: context.business.id },
      data: {
        ...(receivePartnershipOffers !== undefined && {
          receivePartnershipOffers,
        }),
        ...(maxPartnerAllowed !== undefined && { maxPartnerAllowed }),
      },
      select: {
        receivePartnershipOffers: true,
        maxPartnerAllowed: true,
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
