import { withAdminAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { writePartnershipLog } from "@/lib/utils/partnership-log";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

const includeMembers = {
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
} as const;

// POST — submit an unlock request
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
          { error: "Partnership is not active." },
          { status: 400 },
        );
      }

      if (!partnership.settingsLocked) {
        return NextResponse.json(
          { error: "Settings are not locked." },
          { status: 400 },
        );
      }

      if (partnership.unlockRequestByBusinessId) {
        return NextResponse.json(
          { error: "An unlock request is already pending." },
          { status: 400 },
        );
      }

      const updated = await db.businessPartnership.update({
        where: { id: partnershipId },
        data: { unlockRequestByBusinessId: context.business.id },
        include: includeMembers,
      });

      await writePartnershipLog({
        actorBusinessId: context.business.id,
        event: "SETTINGS_UNLOCK_REQUESTED",
        partnershipId,
      });

      return NextResponse.json(updated);
    } catch (error) {
      console.error("Unlock request POST error:", error);
      return NextResponse.json(
        { error: sanitizeErrorMessage(error) },
        { status: 500 },
      );
    }
  },
);

// PATCH — respond to an unlock request (accept or reject)
export const PATCH = withAdminAuth<{ id: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const partnershipId = params.id as string;
      const body = (await request.json()) as { action?: string };
      const action = body?.action;

      if (action !== "accept" && action !== "reject") {
        return NextResponse.json(
          { error: "action must be 'accept' or 'reject'." },
          { status: 400 },
        );
      }

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

      if (!partnership.settingsLocked) {
        return NextResponse.json(
          { error: "Settings are not locked." },
          { status: 400 },
        );
      }

      if (!partnership.unlockRequestByBusinessId) {
        return NextResponse.json(
          { error: "No pending unlock request." },
          { status: 400 },
        );
      }

      // Only the OTHER partner (not the requester) can respond
      if (partnership.unlockRequestByBusinessId === context.business.id) {
        return NextResponse.json(
          { error: "You cannot respond to your own unlock request." },
          { status: 403 },
        );
      }

      const updated = await db.businessPartnership.update({
        where: { id: partnershipId },
        data:
          action === "accept"
            ? {
                settingsLocked: false,
                settingsLockedByBusinessId: null,
                unlockRequestByBusinessId: null,
              }
            : {
                unlockRequestByBusinessId: null,
              },
        include: includeMembers,
      });

      await writePartnershipLog({
        actorBusinessId: context.business.id,
        event:
          action === "accept"
            ? "SETTINGS_UNLOCK_ACCEPTED"
            : "SETTINGS_UNLOCK_REJECTED",
        partnershipId,
      });

      return NextResponse.json(updated);
    } catch (error) {
      console.error("Unlock request PATCH error:", error);
      return NextResponse.json(
        { error: sanitizeErrorMessage(error) },
        { status: 500 },
      );
    }
  },
);
