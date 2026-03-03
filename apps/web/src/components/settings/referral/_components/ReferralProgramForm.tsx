"use client";

import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import { useCreateReferralProgram } from "@/hooks/referral/useReferralProgram";
import {
  referralProgramStep1Schema,
  referralProgramStep2Schema,
  referralProgramStep3Schema,
  type ReferralProgramFormValues,
} from "@/lib/schemas/referral-form";
import { getErrorMessageFromResponse } from "@/lib/utils/error-handler";
import {
  Card,
  CardContent,
  FormNavigation,
  LinearMultiStepForm,
  StepContent,
  type LinearMultiStepFormConfig,
} from "@reelo/ui/components";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ReferralProgramStep1 } from "./ReferralProgramStep1";
import { ReferralProgramStep2 } from "./ReferralProgramStep2";
import { ReferralProgramStep3 } from "./ReferralProgramStep3";

interface ReferralProgramFormProps {
  initialData: any;
  /** When true, render without Card wrapper (e.g. embedded in settings). */
  embedded?: boolean;
}

export function ReferralProgramForm({
  initialData,
  embedded = false,
}: ReferralProgramFormProps) {
  const queryClient = useQueryClient();
  const { data: businessData } = useCurrentBusiness();
  const { mutateAsync: createReferralProgram } = useCreateReferralProgram();

  // Check if loyalty exists - we'll need to fetch it separately or include it in the query
  const hasLoyalty = true; // TODO: Add proper loyalty check

  const config: LinearMultiStepFormConfig<ReferralProgramFormValues> = {
    id: "referral-program-form",
    title: "Set up Referral Program",
    onSubmit: async ({ values }) => {
      try {
        const result = await createReferralProgram({
          newCustomerBenefitType: values.newCustomerBenefitType,
          newCustomerBenefitValue: values.newCustomerBenefitValue ?? 0,
          newCustomerBenefitExpiresInDays:
            values.newCustomerBenefitExpiresInDays || null,
          newCustomerFreeItemSkuId:
            values.newCustomerBenefitType === "FREE_ITEM_ON_NEXT_PURCHASE"
              ? values.newCustomerFreeItemSkuId || null
              : null,
          existingCustomerBenefitType: values.existingCustomerBenefitType,
          existingCustomerBenefitValue:
            values.existingCustomerBenefitValue ?? 0,
          existingCustomerBenefitExpiresInDays:
            values.existingCustomerBenefitExpiresInDays || null,
          existingCustomerFreeItemSkuId:
            values.existingCustomerBenefitType === "FREE_ITEM_ON_NEXT_PURCHASE"
              ? values.existingCustomerFreeItemSkuId || null
              : null,
          sendReminderToCustomer: values.sendReminderToCustomer,
          lockReferralPointsUntilFirstPurchase:
            values.lockReferralPointsUntilFirstPurchase ?? false,
          informationSections: [], // Information sections temporarily disabled
          branding: values.branding,
          termsAndConditionsNewCustomer:
            (values.termsAndConditionsNewCustomer ?? []).filter(
              (s) => s.trim().length > 0,
            ) || null,
          termsAndConditionsExistingCustomer:
            (values.termsAndConditionsExistingCustomer ?? []).filter(
              (s) => s.trim().length > 0,
            ) || null,
        });

        if (result.referralProgram) {
          toast.success("Referral program created successfully!");
          queryClient.invalidateQueries({ queryKey: ["referralProgram"] });
          return undefined;
        } else {
          throw new Error(result.error || "Failed to create referral program");
        }
      } catch (error: any) {
        const errorMessage = getErrorMessageFromResponse(
          error,
          "Failed to create referral program. Please try again.",
        );
        toast.error(errorMessage);
        throw error;
      }
    },
    disableNext: ({ stepId, values }) => {
      if (stepId === "step-1" && !hasLoyalty) {
        return true; // Disable if loyalty is not enabled
      }
      return false;
    },
    steps: [
      {
        id: "step-1",
        title: "How It Works",
        fields: [
          "newCustomerBenefitType",
          "newCustomerBenefitValue",
          "newCustomerFreeItemSkuId",
          "newCustomerBenefitExpiresInDays",
          "sendReminderToCustomer",
        ],
        schema: referralProgramStep1Schema,
        Component: ({ stepIndex, totalSteps }) => (
          <StepContent
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            title="New customer benefits"
            description="Set up rewards for customers who join through referrals."
            required
          >
            <ReferralProgramStep1 />
          </StepContent>
        ),
      },
      {
        id: "step-2",
        title: "Existing Customer Benefits",
        fields: [
          "existingCustomerBenefitType",
          "existingCustomerBenefitValue",
          "existingCustomerFreeItemSkuId",
          "existingCustomerBenefitExpiresInDays",
          "lockReferralPointsUntilFirstPurchase",
          "termsAndConditionsNewCustomer",
          "termsAndConditionsExistingCustomer",
        ],
        schema: referralProgramStep2Schema,
        Component: ({ stepIndex, totalSteps }) => (
          <StepContent
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            title="Existing customer benefits"
            description="Set up rewards for customers who refer others, and add terms."
            required
          >
            <ReferralProgramStep2 />
          </StepContent>
        ),
      },
      {
        id: "step-3",
        title: "Branding & Review",
        fields: ["branding"],
        schema: referralProgramStep3Schema,
        Component: ({ stepIndex, totalSteps }) => (
          <StepContent
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            title="Branding & review"
            description="Customize the appearance of your referral pages and review settings."
          >
            <ReferralProgramStep3 />
          </StepContent>
        ),
      },
    ],
  };

  const defaultValues: Partial<ReferralProgramFormValues> = initialData
    ? {
        newCustomerBenefitType: initialData.newCustomerBenefitType,
        newCustomerBenefitValue: initialData.newCustomerBenefitValue,
        newCustomerFreeItemSkuId:
          initialData.newCustomerFreeItemSkuId ??
          initialData.newCustomerFreeItemSku?.id ??
          null,
        newCustomerBenefitExpiresInDays:
          initialData.newCustomerBenefitExpiresInDays,
        existingCustomerBenefitType: initialData.existingCustomerBenefitType,
        existingCustomerBenefitValue: initialData.existingCustomerBenefitValue,
        existingCustomerFreeItemSkuId:
          initialData.existingCustomerFreeItemSkuId ??
          initialData.existingCustomerFreeItemSku?.id ??
          null,
        existingCustomerBenefitExpiresInDays:
          initialData.existingCustomerBenefitExpiresInDays,
        lockReferralPointsUntilFirstPurchase:
          initialData.lockReferralPointsUntilFirstPurchase ?? false,
        sendReminderToCustomer: initialData.sendReminderToCustomer,
        informationSections: initialData.informationSections || [],
        branding: initialData.branding,
        termsAndConditionsNewCustomer: Array.isArray(
          initialData.termsAndConditionsNewCustomer,
        )
          ? initialData.termsAndConditionsNewCustomer.map(
              (t: { id: string; content: string } | string) =>
                typeof t === "string" ? t : t.content,
            )
          : [],
        termsAndConditionsExistingCustomer: Array.isArray(
          initialData.termsAndConditionsExistingCustomer,
        )
          ? initialData.termsAndConditionsExistingCustomer.map(
              (t: { id: string; content: string } | string) =>
                typeof t === "string" ? t : t.content,
            )
          : [],
      }
    : {
        newCustomerBenefitType: "AMOUNT_CASHBACK",
        newCustomerBenefitValue: 100,
        newCustomerFreeItemSkuId: null,
        existingCustomerBenefitType: "AMOUNT_CASHBACK",
        existingCustomerBenefitValue: 50,
        existingCustomerFreeItemSkuId: null,
        lockReferralPointsUntilFirstPurchase: false,
        sendReminderToCustomer: false,
        informationSections: [],
        branding: null,
        termsAndConditionsNewCustomer: [],
        termsAndConditionsExistingCustomer: [],
      };

  if (!hasLoyalty) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2 text-center">
            <h3 className="text-lg font-semibold">Loyalty Program Required</h3>
            <p className="text-muted-foreground">
              You need to enable a loyalty program before setting up referrals.
              Please configure your loyalty program first.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const form = (
    <LinearMultiStepForm<ReferralProgramFormValues>
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
