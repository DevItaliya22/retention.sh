import { withAdminAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export interface FeedbackDetailDto {
  id: string;
  rating: number | null;
  comment: string | null;
  howDidYouHear: string | null;
  selectedCategories: string[];
  selectedSelectionOptions: { id: string; label: string }[];
  createdAt: string;
  customerName: string;
  customerPhone: string | null;
  customerSlugId: string;
  bill: {
    id: string;
    billNumber: string;
    createdAt: string;
    finalAmount: number | null;
    userPaidAmount: number | null;
  } | null;
}

export const GET = withAdminAuth<{ id: string }>(
  async (_request: NextRequest, context, params) => {
    try {
      const id = params?.id as string | undefined;
      if (!id) {
        return NextResponse.json(
          { error: "Feedback ID required" },
          { status: 400 },
        );
      }
      const businessId = context.business.id;

      const response = await db.feedbackResponse.findFirst({
        where: { id, businessId },
        include: {
          businessCustomer: {
            include: {
              customer: { include: { user: true } },
            },
          },
          selectedSelectionOptions: { select: { id: true, label: true } },
        },
      });

      if (!response) {
        return NextResponse.json(
          { error: "Feedback not found" },
          { status: 404 },
        );
      }

      const link = await db.feedbackLink.findFirst({
        where: { feedbackResponseId: response.id },
        include: { bill: true },
      });

      const dto: FeedbackDetailDto = {
        id: response.id,
        rating: response.rating,
        comment: response.comment ?? null,
        howDidYouHear: response.howDidYouHear ?? null,
        selectedCategories: response.selectedCategories ?? [],
        selectedSelectionOptions:
          response.selectedSelectionOptions?.map((o) => ({
            id: o.id,
            label: o.label,
          })) ?? [],
        createdAt: response.createdAt.toISOString(),
        customerName:
          response.businessCustomer?.customer?.user?.name ?? "Unknown",
        customerPhone:
          response.businessCustomer?.customer?.user?.phoneNumber ?? null,
        customerSlugId: response.businessCustomer?.slugId ?? "",
        bill: link?.bill
          ? {
              id: link.bill.id,
              billNumber: link.bill.billNumber,
              createdAt: link.bill.createdAt.toISOString(),
              finalAmount: link.bill.finalAmount ?? null,
              userPaidAmount: link.bill.userPaidAmount ?? null,
            }
          : null,
      };

      return NextResponse.json(dto);
    } catch (error: unknown) {
      console.error("Failed to fetch feedback detail:", error);
      return NextResponse.json(
        {
          error:
            sanitizeErrorMessage(error) ?? "Failed to fetch feedback detail",
        },
        { status: 500 },
      );
    }
  },
);
