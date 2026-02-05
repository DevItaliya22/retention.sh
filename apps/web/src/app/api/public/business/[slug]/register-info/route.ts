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
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({
        registrationBonusPoints: 0,
        pointsName: "Points",
      });
    }

    const business = await db.business.findUnique({
      where: { slug },
      select: {
        registrationBonusPoints: true,
        defaultPointsName: true,
      },
    });

    if (!business) {
      return NextResponse.json({
        registrationBonusPoints: 0,
        pointsName: "Points",
      });
    }

    return NextResponse.json({
      registrationBonusPoints: business.registrationBonusPoints ?? 0,
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
