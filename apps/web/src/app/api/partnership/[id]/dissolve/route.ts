import { withAdminAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAdminAuth<{ id: string }>(
  async (_request: NextRequest, context, params) => {
    try {
      const partnershipId = params.id as string;

      const partnership = await db.businessPartnership.findUnique({
        where: { id: partnershipId },
        include: { members: true },
      });

      if (!partnership) {
        return NextResponse.json(
          { error: "Partnership not found." },
          { status: 404 },
        );
      }

      const isMember = partnership.members.some(
        (m) => m.businessId === context.business.id,
      );
      if (!isMember) {
        return NextResponse.json(
          { error: "You are not a member of this partnership." },
          { status: 403 },
        );
      }

      if (partnership.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "This partnership is already dissolved." },
          { status: 400 },
        );
      }

      await db.$transaction([
        db.businessPartnership.update({
          where: { id: partnershipId },
          data: { status: "DISSOLVED" },
        }),
        // Freeze any active partner campaigns
        db.partnerCampaign.updateMany({
          where: {
            partnershipId,
            status: { in: ["DRAFT", "SCHEDULED"] },
          },
          data: { status: "FAILED" },
        }),
      ]);

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Partnership dissolve error:", error);
      return NextResponse.json(
        { error: sanitizeErrorMessage(error) },
        { status: 500 },
      );
    }
  },
);
