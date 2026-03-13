import { withAdminAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth<{ id: string }>(
  async (_request: NextRequest, context, params) => {
    try {
      const partnershipId = params.id as string;

      // Verify caller is a member
      const partnership = await db.businessPartnership.findUnique({
        where: { id: partnershipId },
        select: { members: { select: { businessId: true } } },
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

      const logs = await db.partnershipEventLog.findMany({
        where: { partnershipId },
        include: {
          actorBusiness: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return NextResponse.json({ items: logs });
    } catch (error) {
      console.error("Partnership logs GET error:", error);
      return NextResponse.json(
        { error: sanitizeErrorMessage(error), items: [] },
        { status: 500 },
      );
    }
  },
);
