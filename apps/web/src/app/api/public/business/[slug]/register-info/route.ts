import { slugParamSchema } from "@/lib/schemas/common";
import { validateSchema } from "@/lib/utils/error-handler";
import {
  type IsServiceEnabled,
  isServiceEnabled,
} from "@/lib/utils/service-enabled";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

/**
 * Public endpoint: returns registration bonus points and points name for the
 * loyalty login/register page. No auth required.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const resolved = await params;
    const validation = validateSchema(slugParamSchema, resolved);
    if (!validation.success) {
      return NextResponse.json(
        {
          registrationBonusPoints: 0,
          pointsName: "Points",
          error: validation.error,
        },
        { status: 400 },
      );
    }
    const { slug } = validation.data;

    const business = await db.business.findUnique({
      where: { slug },
      select: {
        registrationBonusPoints: true,
        defaultPointsName: true,
        isServiceEnabled: true,
      },
    });

    if (!business) {
      return NextResponse.json({
        registrationBonusPoints: 0,
        pointsName: "Points",
      });
    }

    const loyaltyEnabled = isServiceEnabled(
      business.isServiceEnabled as IsServiceEnabled | null | undefined,
      "loyalty",
    );
    return NextResponse.json({
      registrationBonusPoints: loyaltyEnabled
        ? (business.registrationBonusPoints ?? 0)
        : 0,
      pointsName: business.defaultPointsName ?? "Points",
    });
  } catch (error) {
    console.error("Failed to fetch register info:", error);
    return NextResponse.json({
      registrationBonusPoints: 0,
      pointsName: "Points",
    });
  }
}
