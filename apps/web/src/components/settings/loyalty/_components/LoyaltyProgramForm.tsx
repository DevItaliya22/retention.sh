"use client";

import { AmountSpentConfigStep } from "@/components/settings/loyalty/amount-spent";
import {
  CashbackConfigStep,
  CashbackRedemptionLimitsStep,
} from "@/components/settings/loyalty/cashback";
import {
  BrandingStep,
  ChannelsTermsStep,
  ExpiryReminderStep,
  LoyaltyTypeStep,
  RewardStageEditorStep,
} from "@/components/settings/loyalty/common";
import {
  TierConfigStep,
  TierEditorStep,
} from "@/components/settings/loyalty/tier";
import { VisitMadeConfigStep } from "@/components/settings/loyalty/visit";
import { useCreateLoyaltyMutation } from "@/hooks/loyalty/useLoyaltySettings";
import { getLoyaltyFormDefaults } from "@/lib/constants/forms/loyalty";
import {
  DEFAULT_LOYALTY_PERCENTAGE,
  DEFAULT_LOYALTY_TIER_CASHBACK,
} from "@/lib/loyalty/form-defaults";
import type {
  LoyaltyCreateInput,
  LoyaltyRewardType,
} from "@/lib/schemas/loyalty";
import type {
  LoyaltyProgramFormValues,
  LoyaltyType,
} from "@/lib/schemas/loyalty-form";
import {
  amountSpentConfigStepSchema,
  brandingStepSchema,
  cashbackConfigStepSchema,
  cashbackRedemptionLimitsStepSchema,
  channelsTermsStepSchema,
  expiryStepSchema,
  loyaltyTypeStepSchema,
  rewardStagesStepSchema,
  tierConfigStepSchema,
  tierEditorStepSchema,
  visitMadeConfigStepSchema,
} from "@/lib/schemas/loyalty-form";
import { getErrorMessageFromResponse } from "@/lib/utils/error-handler";
import {
  Card,
  CardContent,
  FormNavigation,
  LinearMultiStepForm,
  StepContent,
  useLinearMultiStepFormStore,
  type LinearMultiStepFormConfig,
} from "@reelo/ui/components";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";

interface LoyaltyProgramFormProps {
  initialData: Record<string, unknown> | null;
  embedded?: boolean;
}

function buildSteps(
  type: LoyaltyType,
): LinearMultiStepFormConfig<LoyaltyProgramFormValues>["steps"] {
  const commonEnd = [
    {
      id: "expiry",
      title: "Expiry & Reminders",
      fields: ["pointReminderDays", "pointExpiryDays"],
      schema: expiryStepSchema,
      Component: ({
        stepIndex,
        totalSteps,
      }: {
        stepIndex: number;
        totalSteps: number;
      }) => (
        <StepContent
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          title="Expiry & Reminders"
          description="When to send reminders and when points expire."
        >
          <ExpiryReminderStep />
        </StepContent>
      ),
    },
    {
      id: "channels",
      title: "Communication & Terms",
      fields: [
        "whatsappEnabled",
        "emailEnabled",
        "smsEnabled",
        "termsAndConditions",
      ],
      schema: channelsTermsStepSchema,
      Component: ({
        stepIndex,
        totalSteps,
      }: {
        stepIndex: number;
        totalSteps: number;
      }) => (
        <StepContent
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          title="Communication & Terms"
          description="Notification channels and terms & conditions."
        >
          <ChannelsTermsStep />
        </StepContent>
      ),
    },
    {
      id: "branding",
      title: "Branding",
      fields: ["branding"],
      schema: brandingStepSchema,
      Component: ({
        stepIndex,
        totalSteps,
      }: {
        stepIndex: number;
        totalSteps: number;
      }) => (
        <StepContent
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          title="Branding"
          description="Customize appearance on customer-facing pages."
        >
          <BrandingStep />
        </StepContent>
      ),
    },
  ];

  switch (type) {
    case "CASHBACK":
      return [
        {
          id: "cashback-config",
          title: "Cashback Config",
          fields: [
            "cashbackPercentage",
            "onFinalAmount",
            "maxCashbackCap",
            "minPurchaseForEarningEnabled",
            "minPurchaseForEarning",
            "minPurchaseForRedemptionEnabled",
            "minPurchaseForRedemption",
            "allowSameBillRedemption",
          ],
          schema: cashbackConfigStepSchema,
          Component: ({
            stepIndex,
            totalSteps,
          }: {
            stepIndex: number;
            totalSteps: number;
          }) => (
            <StepContent
              stepIndex={stepIndex}
              totalSteps={totalSteps}
              title="Cashback Configuration"
              description="Configure how customers earn and redeem cashback."
              required
            >
              <CashbackConfigStep />
            </StepContent>
          ),
        },
        {
          id: "cashback-redemption",
          title: "Redemption Limits",
          fields: [
            "redemptionBalanceLimitEnabled",
            "redemptionBalanceLimitAmount",
            "redemptionBalanceLimitPercentage",
            "redemptionBillLimitEnabled",
            "redemptionBillLimitAmount",
            "redemptionBillLimitPercentage",
          ],
          schema: cashbackRedemptionLimitsStepSchema,
          Component: ({
            stepIndex,
            totalSteps,
          }: {
            stepIndex: number;
            totalSteps: number;
          }) => (
            <StepContent
              stepIndex={stepIndex}
              totalSteps={totalSteps}
              title="Redemption Limits"
              description="Cap how much customers can redeem at once."
            >
              <CashbackRedemptionLimitsStep />
            </StepContent>
          ),
        },
        ...commonEnd,
      ];
    case "TIER":
      return [
        {
          id: "tier-config",
          title: "Tier Config",
          fields: [
            "pointsPerRupee",
            "onFinalAmount",
            "allowSameBillRedemption",
          ],
          schema: tierConfigStepSchema,
          Component: ({
            stepIndex,
            totalSteps,
          }: {
            stepIndex: number;
            totalSteps: number;
          }) => (
            <StepContent
              stepIndex={stepIndex}
              totalSteps={totalSteps}
              title="Tier Configuration"
              description="Default points conversion (used when tier not resolved, e.g. preview)."
              required
            >
              <TierConfigStep />
            </StepContent>
          ),
        },
        {
          id: "tier-editor",
          title: "Tiers",
          fields: ["tiers"],
          schema: tierEditorStepSchema,
          Component: ({ stepIndex, totalSteps }) => (
            <StepContent
              stepIndex={stepIndex}
              totalSteps={totalSteps}
              title="Tier Definitions"
              description="Add tiers based on lifetime spending."
              required
            >
              <TierEditorStep />
            </StepContent>
          ),
        },
        ...commonEnd,
      ];
    case "AMOUNT_SPENT":
      return [
        {
          id: "amount-spent-config",
          title: "Amount Spent Config",
          fields: [
            "pointsPerRupee",
            "onFinalAmount",
            "maxPointsPerPurchase",
            "allowSameBillRedemption",
          ],
          schema: amountSpentConfigStepSchema,
          Component: ({ stepIndex, totalSteps }) => (
            <StepContent
              stepIndex={stepIndex}
              totalSteps={totalSteps}
              title="Points Configuration"
              description="How customers earn points per bill."
              required
            >
              <AmountSpentConfigStep />
            </StepContent>
          ),
        },
        {
          id: "reward-stages",
          title: "Reward Stages",
          fields: ["rewardStages"],
          schema: rewardStagesStepSchema,
          Component: ({ stepIndex, totalSteps }) => (
            <StepContent
              stepIndex={stepIndex}
              totalSteps={totalSteps}
              title="Reward Stages"
              description="Configure redeemable rewards."
            >
              <RewardStageEditorStep />
            </StepContent>
          ),
        },
        ...commonEnd,
      ];
    case "VISIT_MADE":
      return [
        {
          id: "visit-config",
          title: "Visit Config",
          fields: [
            "pointsPerVisit",
            "visitIntervalEnabled",
            "visitIntervalValue",
            "visitIntervalUnit",
            "allowSameBillRedemption",
          ],
          schema: visitMadeConfigStepSchema,
          Component: ({ stepIndex, totalSteps }) => (
            <StepContent
              stepIndex={stepIndex}
              totalSteps={totalSteps}
              title="Visit Configuration"
              description="How customers earn points per visit."
              required
            >
              <VisitMadeConfigStep />
            </StepContent>
          ),
        },
        {
          id: "reward-stages",
          title: "Reward Stages",
          fields: ["rewardStages"],
          schema: rewardStagesStepSchema,
          Component: ({ stepIndex, totalSteps }) => (
            <StepContent
              stepIndex={stepIndex}
              totalSteps={totalSteps}
              title="Reward Stages"
              description="Configure redeemable rewards."
            >
              <RewardStageEditorStep />
            </StepContent>
          ),
        },
        ...commonEnd,
      ];
    default:
      return [];
  }
}

function buildInitialValues(
  type: LoyaltyType,
): Partial<LoyaltyProgramFormValues> {
  return getLoyaltyFormDefaults(type);
}

function valuesToPayload(values: LoyaltyProgramFormValues): LoyaltyCreateInput {
  const terms = (values.termsAndConditions ?? [])
    .map((s) => (typeof s === "string" ? s : "").trim())
    .filter(Boolean);

  const common = {
    pointReminderDays: values.pointReminderDays ?? null,
    pointExpiryDays: values.pointExpiryDays ?? null,
    whatsappEnabled: values.whatsappEnabled ?? false,
    emailEnabled: values.emailEnabled ?? false,
    smsEnabled: values.smsEnabled ?? false,
    termsAndConditions: terms,
    branding: values.branding ?? null,
  };

  switch (values.loyaltyType) {
    case "CASHBACK":
      return {
        loyaltyType: "CASHBACK",
        ...common,
        cashbackConfig: {
          cashbackPercentage:
            values.cashbackPercentage ?? DEFAULT_LOYALTY_PERCENTAGE,
          onFinalAmount: values.onFinalAmount ?? false,
          maxCashbackCap: values.maxCashbackCap ?? null,
          minPurchaseForEarningEnabled:
            values.minPurchaseForEarningEnabled ?? false,
          minPurchaseForEarning: values.minPurchaseForEarning ?? null,
          minPurchaseForRedemptionEnabled:
            values.minPurchaseForRedemptionEnabled ?? false,
          minPurchaseForRedemption: values.minPurchaseForRedemption ?? null,
          redemptionBalanceLimitEnabled:
            values.redemptionBalanceLimitEnabled ?? false,
          redemptionBalanceLimitAmount:
            values.redemptionBalanceLimitAmount ?? null,
          redemptionBalanceLimitPercentage:
            values.redemptionBalanceLimitPercentage ?? null,
          redemptionBillLimitEnabled:
            values.redemptionBillLimitEnabled ?? false,
          redemptionBillLimitAmount: values.redemptionBillLimitAmount ?? null,
          redemptionBillLimitPercentage:
            values.redemptionBillLimitPercentage ?? null,
          allowSameBillRedemption: values.allowSameBillRedemption ?? false,
        },
      };
    case "TIER":
      return {
        loyaltyType: "TIER",
        ...common,
        tierConfig: {
          pointsPerRupee: values.pointsPerRupee ?? 1,
          onFinalAmount: values.onFinalAmount ?? false,
          allowSameBillRedemption: values.allowSameBillRedemption ?? false,
          tiers: (values.tiers ?? []).map((t) => ({
            name: t.name,
            rank: t.rank,
            minLifetimeSpend: t.minLifetimeSpend,
            maxLifetimeSpend: t.maxLifetimeSpend ?? null,
            cashbackPercentage:
              t.cashbackPercentage ?? DEFAULT_LOYALTY_TIER_CASHBACK,
            minPurchaseForRedemptionEnabled:
              t.minPurchaseForRedemptionEnabled ?? false,
            minPurchaseForRedemption: t.minPurchaseForRedemption ?? null,
            maxCashbackCapEnabled: t.maxCashbackCapEnabled ?? false,
            maxCashbackCap: t.maxCashbackCap ?? null,
          })),
        },
      };
    case "AMOUNT_SPENT":
      return {
        loyaltyType: "AMOUNT_SPENT",
        ...common,
        amountSpentConfig: {
          pointsPerRupee: values.pointsPerRupee ?? 1,
          onFinalAmount: values.onFinalAmount ?? false,
          maxPointsPerPurchase: values.maxPointsPerPurchase ?? null,
          allowSameBillRedemption: values.allowSameBillRedemption ?? true,
        },
        rewardStages: (values.rewardStages ?? []).map((s) => ({
          pointsRequired: s.pointsRequired,
          rewardType: s.rewardType as LoyaltyRewardType,
          rewardName: s.rewardName,
          freeItemSkuId: s.freeItemSkuId ?? null,
          freeItemName: s.freeItemName ?? null,
          percentageValue: s.percentageValue ?? null,
          appliesToEntirePurchase: s.appliesToEntirePurchase ?? true,
          specificProductIds: s.specificProductIds ?? [],
          cashAmount: s.cashAmount ?? null,
          minPurchaseForRedemptionEnabled:
            s.minPurchaseForRedemptionEnabled ?? false,
          minPurchaseForRedemption: s.minPurchaseForRedemption ?? null,
          maxDiscountCapEnabled: s.maxDiscountCapEnabled ?? false,
          maxDiscountCap: s.maxDiscountCap ?? null,
        })),
      };
    case "VISIT_MADE":
      return {
        loyaltyType: "VISIT_MADE",
        ...common,
        visitMadeConfig: {
          pointsPerVisit: values.pointsPerVisit ?? 1,
          visitIntervalEnabled: values.visitIntervalEnabled ?? false,
          visitIntervalValue: values.visitIntervalValue ?? null,
          visitIntervalUnit:
            (values.visitIntervalUnit as
              | "MINUTE"
              | "HOUR"
              | "DAY"
              | "WEEK"
              | "MONTH") ?? null,
          allowSameBillRedemption: values.allowSameBillRedemption ?? true,
        },
        rewardStages: (values.rewardStages ?? []).map((s) => ({
          pointsRequired: s.pointsRequired,
          rewardType: s.rewardType as LoyaltyRewardType,
          rewardName: s.rewardName,
          freeItemSkuId: s.freeItemSkuId ?? null,
          freeItemName: s.freeItemName ?? null,
          percentageValue: s.percentageValue ?? null,
          appliesToEntirePurchase: s.appliesToEntirePurchase ?? true,
          specificProductIds: s.specificProductIds ?? [],
          cashAmount: s.cashAmount ?? null,
          minPurchaseForRedemptionEnabled:
            s.minPurchaseForRedemptionEnabled ?? false,
          minPurchaseForRedemption: s.minPurchaseForRedemption ?? null,
          maxDiscountCapEnabled: s.maxDiscountCapEnabled ?? false,
          maxDiscountCap: s.maxDiscountCap ?? null,
        })),
      };
    default:
      throw new Error(`Unknown loyalty type: ${values.loyaltyType}`);
  }
}

const FORM_ID = "loyalty-program-form";

const TYPE_SELECTION_STEP = {
  id: "type",
  title: "Program Type",
  fields: ["loyaltyType"],
  schema: loyaltyTypeStepSchema,
  Component: ({
    stepIndex,
    totalSteps,
  }: {
    stepIndex: number;
    totalSteps: number;
  }) => (
    <StepContent
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      title="Choose your loyalty program type"
      description="Select one option. The type cannot be changed after creation."
      required
    >
      <LoyaltyTypeStep />
    </StepContent>
  ),
};

export function LoyaltyProgramForm({
  initialData: _initialData,
  embedded = false,
}: LoyaltyProgramFormProps) {
  void _initialData;
  const queryClient = useQueryClient();
  const createMutation = useCreateLoyaltyMutation();
  const mergeValues = useLinearMultiStepFormStore((s) => s.mergeValues);
  const [selectedType, setSelectedType] = useState<LoyaltyType | null>(null);

  const typeStepWithSubmit = useMemo(
    () => ({
      ...TYPE_SELECTION_STEP,
      onStepSubmit: async ({
        formId,
        values,
      }: {
        formId: string;
        values: LoyaltyProgramFormValues;
      }) => {
        const type = values.loyaltyType as LoyaltyType;
        flushSync(() => setSelectedType(type));
        mergeValues({
          formId,
          values: buildInitialValues(type),
        });
      },
    }),
    [mergeValues],
  );

  const stepsWithTypeSubmit = useMemo(
    () => [typeStepWithSubmit, ...buildSteps(selectedType ?? "CASHBACK")],
    [typeStepWithSubmit, selectedType],
  );

  const fullConfig: LinearMultiStepFormConfig<LoyaltyProgramFormValues> =
    useMemo(
      () => ({
        id: FORM_ID,
        title: "Set up Loyalty Program",
        steps: stepsWithTypeSubmit,
        onSubmit: async ({ values }) => {
          const payload = valuesToPayload(values);
          const result = await createMutation.mutateAsync(payload);

          if (result.loyalty) {
            toast.success("Loyalty program created successfully!");
            queryClient.invalidateQueries({ queryKey: ["loyalty-settings"] });
            queryClient.invalidateQueries({ queryKey: ["currentBusiness"] });
            return undefined;
          }
          const err = new Error(
            result.error ?? "Failed to create loyalty program",
          );
          toast.error(getErrorMessageFromResponse(err, err.message));
          throw err;
        },
      }),
      [stepsWithTypeSubmit, createMutation, queryClient],
    );

  const form = (
    <LinearMultiStepForm<LoyaltyProgramFormValues>
      key={FORM_ID}
      config={fullConfig}
      initialValues={{}}
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
