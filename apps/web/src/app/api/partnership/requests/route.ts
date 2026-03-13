import { withAdminAuth } from "@/lib/auth/middleware";
import { sendPartnerRequestSchema } from "@/lib/schemas/partnership";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { writePartnershipLog } from "@/lib/utils/partnership-log";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const direction = searchParams.get("direction") ?? "incoming";

    if (direction === "incoming") {
      const requests = await db.partnerRequest.findMany({
        where: { receiverBusinessId: context.business.id },
        include: {
          senderBusiness: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ items: requests });
    }

    const requests = await db.partnerRequest.findMany({
      where: { senderBusinessId: context.business.id },
      include: {
        receiverBusiness: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items: requests });
  } catch (error) {
    console.error("Partnership requests GET error:", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error), items: [] },
      { status: 500 },
    );
  }
});

export const POST = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const body = await request.json();
    const validation = validateSchema(sendPartnerRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { targetBusinessSlug } = validation.data;

    if (targetBusinessSlug === context.business.slug) {
      return NextResponse.json(
        { error: "You cannot send a partnership request to yourself." },
        { status: 400 },
      );
    }

    const targetBusiness = await db.business.findUnique({
      where: { slug: targetBusinessSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        receivePartnershipOffers: true,
        maxPartnerAllowed: true,
      },
    });

    if (!targetBusiness) {
      return NextResponse.json(
        { error: "No business found with that slug." },
        { status: 404 },
      );
    }

    if (!targetBusiness.receivePartnershipOffers) {
      return NextResponse.json(
        { error: "This business is not accepting partnership offers." },
        { status: 403 },
      );
    }

    // Check if permanently rejected by target
    const permanentlyRejected = await db.partnerRequest.findFirst({
      where: {
        senderBusinessId: context.business.id,
        receiverBusinessId: targetBusiness.id,
        status: "PERMANENTLY_REJECTED",
      },
    });
    if (permanentlyRejected) {
      return NextResponse.json(
        {
          error:
            "This business has permanently rejected your partnership request. You cannot re-request.",
        },
        { status: 403 },
      );
    }

    // Check if already has a pending or active relationship
    const existing = await db.partnerRequest.findFirst({
      where: {
        OR: [
          {
            senderBusinessId: context.business.id,
            receiverBusinessId: targetBusiness.id,
            status: { in: ["PENDING", "ACCEPTED"] },
          },
          {
            senderBusinessId: targetBusiness.id,
            receiverBusinessId: context.business.id,
            status: { in: ["PENDING", "ACCEPTED"] },
          },
        ],
      },
      include: { partnership: { select: { status: true } } },
    });
    if (existing) {
      // Allow re-request if the linked partnership was dissolved
      const isDissolved =
        existing.status === "ACCEPTED" &&
        existing.partnership?.status === "DISSOLVED";

      if (isDissolved) {
        // Remove the stale accepted request so a fresh one can be created
        await db.partnerRequest.delete({ where: { id: existing.id } });
      } else {
        const msg =
          existing.status === "PENDING"
            ? "A partnership request already exists between these businesses."
            : "You already have an active partnership with this business.";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }

    // Check maxPartnerAllowed for both sides
    const [senderActiveCount, receiverActiveCount] = await Promise.all([
      db.partnershipMember.count({
        where: {
          businessId: context.business.id,
          partnership: { status: "ACTIVE" },
        },
      }),
      db.partnershipMember.count({
        where: {
          businessId: targetBusiness.id,
          partnership: { status: "ACTIVE" },
        },
      }),
    ]);

    const senderBusiness = await db.business.findUnique({
      where: { id: context.business.id },
      select: { maxPartnerAllowed: true },
    });

    if (senderActiveCount >= (senderBusiness?.maxPartnerAllowed ?? 1)) {
      return NextResponse.json(
        {
          error:
            "You have reached your maximum number of allowed partnerships.",
        },
        { status: 400 },
      );
    }

    if (receiverActiveCount >= targetBusiness.maxPartnerAllowed) {
      return NextResponse.json(
        {
          error:
            "The target business has reached their maximum number of allowed partnerships.",
        },
        { status: 400 },
      );
    }

    // Delete any old rejected request between these two (to allow re-request)
    await db.partnerRequest.deleteMany({
      where: {
        senderBusinessId: context.business.id,
        receiverBusinessId: targetBusiness.id,
        status: "REJECTED",
      },
    });

    const partnerRequest = await db.partnerRequest.create({
      data: {
        senderBusinessId: context.business.id,
        receiverBusinessId: targetBusiness.id,
        status: "PENDING",
      },
      include: {
        receiverBusiness: { select: { id: true, name: true, slug: true } },
      },
    });

    await writePartnershipLog({
      actorBusinessId: context.business.id,
      event: "REQUEST_SENT",
      partnerRequestId: partnerRequest.id,
      metadata: { targetBusinessSlug: targetBusiness.slug },
    });

    return NextResponse.json(partnerRequest, { status: 201 });
  } catch (error) {
    console.error("Partnership request POST error:", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) },
      { status: 500 },
    );
  }
});
