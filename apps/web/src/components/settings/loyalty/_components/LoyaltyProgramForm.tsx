"use client";

import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import { getErrorMessageFromResponse } from "@/lib/utils/error-handler";
import {
  loyaltyProgramStep1Schema,
  loyaltyProgramStep2Schema,
  loyaltyProgramStep3Schema,
  loyaltyProgramStep4Schema,
  type LoyaltyProgramFormValues,
} from "@/lib/schemas/loyalty-form";
import {
  Card,
  CardContent,
  FormNavigation,
  LinearMultiStepForm,
  StepContent,
  type LinearMultiStepFormConfig,
} from "@reelo/ui/components";
import { fetcher } from "@/lib/fetcher";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LoyaltyProgramStep1 } from "./LoyaltyProgramStep1";
import { LoyaltyProgramStep2 } from "./LoyaltyProgramStep2";
import { LoyaltyProgramStep3 } from "./LoyaltyProgramStep3";
import { LoyaltyProgramStep4 } from "./LoyaltyProgramStep4";

interface LoyaltyProgramFormProps {
  initialData: Record<string, unknown> | null;
  embedded?: boolean;
}

interface LoyaltySettingsResponse {
  loyalty: unknown;
  error?: string;
}

export function LoyaltyProgramForm({
  initialData,
  embedded = false,
}: LoyaltyProgramFormProps) {
  const queryClient = useQueryClient();
  const { data: businessData } = useCurrentBusiness();

  const config: LinearMultiStepFormConfig<LoyaltyProgramFormValues> = {
    id: "loyalty-program-form",
    title: "Set up Loyalty Program",
    onSubmit: async ({ values }) => {
      const terms = (values.termsAndConditions ?? [])
        .map((s) => (typeof s === "string" ? s : "").trim())
        .filter(Boolean);
      const payload = {
        earningPercentage: values.earningPercentage ?? 0,
        earnPointsOnPaidAmountOnly: values.earnPointsOnPaidAmountOnly ?? true,
        cashbackInFinalAmount: values.cashbackInFinalAmount ?? false,
        cashbackBranding: values.cashbackBranding ?? null,
        minPurchaseForEarning: values.minPurchaseForEarning ?? 0,
        minPurchaseForRedemption: values.minPurchaseForRedemption ?? 0,
        upperLimitBillAmount: values.upperLimitBillAmount ?? null,
        upperLimitClaimableAmount: values.upperLimitClaimableAmount ?? null,
        pointReminderDays: values.pointReminderDays ?? null,
        pointExpiryDays: values.pointExpiryDays ?? null,
        whatsappEnabled: values.whatsappEnabled ?? false,
        emailEnabled: values.emailEnabled ?? false,
        smsEnabled: values.smsEnabled ?? false,
        termsAndConditions: terms.length > 0 ? terms : undefined,
        branding: values.branding ?? null,
      };

      const result = await fetcher<LoyaltySettingsResponse>("/api/loyalty", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (result.loyalty) {
        toast.success("Loyalty program created successfully!");
        queryClient.invalidateQueries({ queryKey: ["loyalty-settings"] });
        queryClient.invalidateQueries({ queryKey: ["currentBusiness"] });
        return undefined;
      }
      const err = new Error(result.error ?? "Failed to create loyalty program");
      toast.error(getErrorMessageFromResponse(err, err.message));
      throw err;
    },
    steps: [
      {
        id: "step-1",
        title: "Earning & Redemption",
        fields: [
          "earningPercentage",
          "cashbackBranding",
          "minPurchaseForEarning",
          "minPurchaseForRedemption",
          "earnPointsOnPaidAmountOnly",
        ],
        schema: loyaltyProgramStep1Schema,
        Component: ({ stepIndex, totalSteps }) => (
          <StepContent
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            title="Earning & Redemption"
            description="Configure how customers earn and redeem points."
            required
          >
            <LoyaltyProgramStep1 />
          </StepContent>
        ),
      },
      {
        id: "step-2",
        title: "Limits & Expiry",
        fields: [
          "upperLimitBillAmount",
          "upperLimitClaimableAmount",
          "pointReminderDays",
          "pointExpiryDays",
        ],
        schema: loyaltyProgramStep2Schema,
        Component: ({ stepIndex, totalSteps }) => (
          <StepContent
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            title="Limits & Expiry"
            description="Set caps and expiry for points."
          >
            <LoyaltyProgramStep2 />
          </StepContent>
        ),
      },
      {
        id: "step-3",
        title: "Communication & Terms",
        fields: [
          "whatsappEnabled",
          "emailEnabled",
          "smsEnabled",
          "termsAndConditions",
        ],
        schema: loyaltyProgramStep3Schema,
        Component: ({ stepIndex, totalSteps }) => (
          <StepContent
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            title="Communication & Terms"
            description="Notification channels and terms & conditions."
          >
            <LoyaltyProgramStep3 />
          </StepContent>
        ),
      },
      {
        id: "step-4",
        title: "Branding",
        fields: ["branding"],
        schema: loyaltyProgramStep4Schema,
        Component: ({ stepIndex, totalSteps }) => (
          <StepContent
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            title="Branding"
            description="Customize appearance on customer-facing pages."
          >
            <LoyaltyProgramStep4 />
          </StepContent>
        ),
      },
    ],
  };

  const defaultValues: Partial<LoyaltyProgramFormValues> = initialData
    ? {
        earningPercentage: (initialData.earningPercentage as number) ?? 0,
        earnPointsOnPaidAmountOnly:
          (initialData.earnPointsOnPaidAmountOnly as boolean) ?? true,
        cashbackInFinalAmount:
          (initialData.cashbackInFinalAmount as boolean) ?? false,
        cashbackBranding: (initialData.cashbackBranding as string) ?? null,
        minPurchaseForEarning:
          (initialData.minPurchaseForEarning as number) ?? 0,
        minPurchaseForRedemption:
          (initialData.minPurchaseForRedemption as number) ?? 0,
        upperLimitBillAmount:
          (initialData.upperLimitBillAmount as number) ?? null,
        upperLimitClaimableAmount:
          (initialData.upperLimitClaimableAmount as number) ?? null,
        pointReminderDays: (initialData.pointReminderDays as number) ?? null,
        pointExpiryDays: (initialData.pointExpiryDays as number) ?? null,
        whatsappEnabled: (initialData.whatsappEnabled as boolean) ?? false,
        emailEnabled: (initialData.emailEnabled as boolean) ?? false,
        smsEnabled: (initialData.smsEnabled as boolean) ?? false,
        termsAndConditions: Array.isArray(initialData.termsAndConditions)
          ? (initialData.termsAndConditions as string[])
          : [""],
        branding:
          (initialData.branding as LoyaltyProgramFormValues["branding"]) ??
          null,
      }
    : {
        earningPercentage: 0,
        earnPointsOnPaidAmountOnly: true,
        cashbackInFinalAmount: false,
        cashbackBranding: null,
        minPurchaseForEarning: 0,
        minPurchaseForRedemption: 0,
        upperLimitBillAmount: null,
        upperLimitClaimableAmount: null,
        pointReminderDays: null,
        pointExpiryDays: null,
        whatsappEnabled: false,
        emailEnabled: false,
        smsEnabled: false,
        termsAndConditions: [""],
        branding: {
          logo: null,
          themeColor: null,
          textColor: null,
          bannerImage: null,
          header: null,
          subtitle: null,
        },
      };

  const form = (
    <LinearMultiStepForm<LoyaltyProgramFormValues>
      config={config}
      initialValues={defaultValues}
      navigationPosition="footer"
      NavigationComponent={FormNavigation}
      progressType="bar"
    />
  );

  if (embedded) {
    return <div className="min-h-[80vh] w-full">{form}</div>;
  }

  return (
    <Card className="bg-card border-border shadow-xl">
      <CardContent className="p-8">{form}</CardContent>
    </Card>
  );
}
