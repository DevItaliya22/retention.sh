import { withAdminAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { writePartnershipLog } from "@/lib/utils/partnership-log";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAdminAuth<{ id: string }>(
  async (_request: NextRequest, context, params) => {
    try {
      const partnershipId = params.id as string;

      const partnership = await db.businessPartnership.findUnique({
        where: { id: partnershipId },
        include: { members: { select: { businessId: true } } },
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
          { error: "Cannot lock a dissolved partnership." },
          { status: 400 },
        );
      }

      if (partnership.settingsLocked) {
        return NextResponse.json(
          { error: "Settings are already locked." },
          { status: 400 },
        );
      }

      const updated = await db.businessPartnership.update({
        where: { id: partnershipId },
        data: {
          settingsLocked: true,
          settingsLockedByBusinessId: context.business.id,
          unlockRequestByBusinessId: null,
        },
        include: {
          members: {
            include: {
              business: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  loyalty: { select: { loyaltyType: true } },
                },
              },
            },
          },
        },
      });

      await writePartnershipLog({
        actorBusinessId: context.business.id,
        event: "SETTINGS_LOCKED",
        partnershipId,
      });

      return NextResponse.json(updated);
    } catch (error) {
      console.error("Partnership lock error:", error);
      return NextResponse.json(
        { error: sanitizeErrorMessage(error) },
        { status: 500 },
      );
    }
  },
);
