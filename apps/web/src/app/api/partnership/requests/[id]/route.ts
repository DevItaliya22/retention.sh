import { withAdminAuth } from "@/lib/auth/middleware";
import { respondPartnerRequestSchema } from "@/lib/schemas/partnership";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { writePartnershipLog } from "@/lib/utils/partnership-log";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const PATCH = withAdminAuth<{ id: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const body = await request.json();
      const validation = validateSchema(respondPartnerRequestSchema, body);
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const { action } = validation.data;
      const requestId = params.id as string;

      const partnerRequest = await db.partnerRequest.findUnique({
        where: { id: requestId },
        include: {
          senderBusiness: {
            select: {
              id: true,
              name: true,
              slug: true,
              maxPartnerAllowed: true,
            },
          },
          receiverBusiness: {
            select: {
              id: true,
              name: true,
              slug: true,
              maxPartnerAllowed: true,
            },
          },
        },
      });

      if (!partnerRequest) {
        return NextResponse.json(
          { error: "Partnership request not found." },
          { status: 404 },
        );
      }

      if (partnerRequest.receiverBusinessId !== context.business.id) {
        return NextResponse.json(
          { error: "You can only respond to requests sent to your business." },
          { status: 403 },
        );
      }

      if (partnerRequest.status !== "PENDING") {
        return NextResponse.json(
          { error: "This request has already been responded to." },
          { status: 400 },
        );
      }

      if (action === "reject") {
        const updated = await db.partnerRequest.update({
          where: { id: requestId },
          data: { status: "REJECTED" },
        });
        await writePartnershipLog({
          actorBusinessId: context.business.id,
          event: "REQUEST_REJECTED",
          partnerRequestId: requestId,
        });
        return NextResponse.json(updated);
      }

      if (action === "permanently_reject") {
        const updated = await db.partnerRequest.update({
          where: { id: requestId },
          data: { status: "PERMANENTLY_REJECTED" },
        });
        await writePartnershipLog({
          actorBusinessId: context.business.id,
          event: "REQUEST_PERMANENTLY_REJECTED",
          partnerRequestId: requestId,
        });
        return NextResponse.json(updated);
      }

      // action === "accept"
      const [senderActiveCount, receiverActiveCount] = await Promise.all([
        db.partnershipMember.count({
          where: {
            businessId: partnerRequest.senderBusinessId,
            partnership: { status: "ACTIVE" },
          },
        }),
        db.partnershipMember.count({
          where: {
            businessId: partnerRequest.receiverBusinessId,
            partnership: { status: "ACTIVE" },
          },
        }),
      ]);

      if (
        senderActiveCount >=
        (partnerRequest.senderBusiness.maxPartnerAllowed ?? 1)
      ) {
        return NextResponse.json(
          {
            error:
              "The sender business has reached their maximum number of partnerships.",
          },
          { status: 400 },
        );
      }

      if (
        receiverActiveCount >=
        (partnerRequest.receiverBusiness.maxPartnerAllowed ?? 1)
      ) {
        return NextResponse.json(
          {
            error:
              "Your business has reached the maximum number of partnerships.",
          },
          { status: 400 },
        );
      }

      // Create partnership with two members in a transaction
      const partnership = await db.businessPartnership.create({
        data: {
          status: "ACTIVE",
          members: {
            create: [
              { businessId: partnerRequest.senderBusinessId },
              { businessId: partnerRequest.receiverBusinessId },
            ],
          },
        },
        include: {
          members: {
            include: {
              business: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      });

      await db.partnerRequest.update({
        where: { id: requestId },
        data: {
          status: "ACCEPTED",
          partnershipId: partnership.id,
        },
      });

      await writePartnershipLog({
        actorBusinessId: context.business.id,
        event: "REQUEST_ACCEPTED",
        partnerRequestId: requestId,
        partnershipId: partnership.id,
      });

      return NextResponse.json(partnership);
    } catch (error) {
      console.error("Partnership request PATCH error:", error);
      return NextResponse.json(
        { error: sanitizeErrorMessage(error) },
        { status: 500 },
      );
    }
  },
);

// Move a permanently rejected request back to rejected status
export const PUT = withAdminAuth<{ id: string }>(
  async (_request: NextRequest, context, params) => {
    try {
      const requestId = params.id as string;

      const partnerRequest = await db.partnerRequest.findUnique({
        where: { id: requestId },
      });

      if (!partnerRequest) {
        return NextResponse.json(
          { error: "Partnership request not found." },
          { status: 404 },
        );
      }

      // Only the receiver (who permanently rejected) can un-permanent-reject
      if (partnerRequest.receiverBusinessId !== context.business.id) {
        return NextResponse.json(
          { error: "Only the business that rejected can change this status." },
          { status: 403 },
        );
      }

      if (partnerRequest.status !== "PERMANENTLY_REJECTED") {
        return NextResponse.json(
          { error: "This request is not permanently rejected." },
          { status: 400 },
        );
      }

      const updated = await db.partnerRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });

      await writePartnershipLog({
        actorBusinessId: context.business.id,
        event: "REQUEST_UN_PERMANENTLY_REJECTED",
        partnerRequestId: requestId,
      });

      return NextResponse.json(updated);
    } catch (error) {
      console.error("Partnership request PUT error:", error);
      return NextResponse.json(
        { error: sanitizeErrorMessage(error) },
        { status: 500 },
      );
    }
  },
);
