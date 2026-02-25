import { withAdminAuth } from "@/lib/auth/middleware";
import { partnerCampaignCreateSchema } from "@/lib/schemas/partnership";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (_request: NextRequest, context) => {
  try {
    const campaigns = await db.partnerCampaign.findMany({
      where: {
        partnership: {
          members: { some: { businessId: context.business.id } },
        },
      },
      include: {
        createdByBusiness: { select: { id: true, name: true, slug: true } },
        partnership: {
          select: {
            id: true,
            status: true,
            members: {
              include: {
                business: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ items: campaigns });
  } catch (error) {
    console.error("Partner campaigns GET error:", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error), items: [] },
      { status: 500 },
    );
  }
});

export const POST = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const body = await request.json();
    const validation = validateSchema(partnerCampaignCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { partnershipId } = validation.data;

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

    if (partnership.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Cannot create campaigns for a dissolved partnership." },
        { status: 400 },
      );
    }

    if (!partnership.sharedCampaigns) {
      return NextResponse.json(
        { error: "Shared campaigns are not enabled for this partnership." },
        { status: 403 },
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

    const defaultBranding = await db.branding.findUnique({
      where: { businessId: context.business.id },
      select: {
        themeColor: true,
        textColor: true,
        logo: true,
        bannerImage: true,
      },
    });

    const campaign = await db.partnerCampaign.create({
      data: {
        partnershipId,
        createdByBusinessId: context.business.id,
        slug: `partner-${crypto.randomUUID()}`,
        status: "DRAFT",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        themeColor: defaultBranding?.themeColor ?? null,
        textColor: defaultBranding?.textColor ?? null,
        logo: defaultBranding?.logo ?? null,
        bannerImage: defaultBranding?.bannerImage ?? null,
      },
      select: { id: true, slug: true },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Partner campaign POST error:", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) },
      { status: 500 },
    );
  }
});
