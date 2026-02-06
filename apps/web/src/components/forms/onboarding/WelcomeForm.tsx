"use client";

import { BusinessStep } from "@/components/forms/onboarding/steps/BusinessStep";
import { CashierStep } from "@/components/forms/onboarding/steps/CashierStep";
import { ReviewStep } from "@/components/forms/onboarding/steps/ReviewStep";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import { useManageCashier } from "@/hooks/cashier/useManageCashier";
import useOnboarding from "@/hooks/onboarding/useOnboarding";
import {
  businessStepSchema,
  cashierStepSchema,
  type WelcomeFormValues,
} from "@/lib/schemas/onboarding";
import { getErrorMessageFromResponse } from "@/lib/utils/error-handler";
import { generateSlug } from "@/lib/utils/slug";
import {
  FormNavigation,
  LinearMultiStepForm,
  StepContent,
  type LinearMultiStepFormConfig,
} from "@reelo/ui/components";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface WelcomeFormProps {
  onCompleted?: () => void;
  embedded?: boolean;
}

export function WelcomeForm({
  onCompleted,
  embedded = false,
}: WelcomeFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutateAsync: submitOnboarding } = useOnboarding();
  const { create: createCashier } = useManageCashier();
  const { refetch: refetchCurrentBusiness } = useCurrentBusiness();

  const config: LinearMultiStepFormConfig<WelcomeFormValues> = {
    id: "welcome-form",
    title: "Setup your business",
    onSubmit: async ({ values }) => {
      try {
        const businessData = {
          businessName: values.businessName,
          businessSlug: values.businessSlug,
          defaultPointsName: values.defaultPointsName,
          defaultCurrencySymbol: values.defaultCurrencySymbol,
          defaultCurrencyCode: values.defaultCurrencyCode,
          themeColor: values.themeColor,
          logo: values.logo,
          createCashier: false,
        };

        const result = await submitOnboarding(
          businessData as WelcomeFormValues,
        );
        if (result.success) {
          await queryClient.invalidateQueries({
            queryKey: ["currentBusiness"],
          });

          const businessResult = await refetchCurrentBusiness();

          if (!businessResult.data?.business) {
            throw new Error(
              "Business was created but could not be retrieved. Please refresh the page.",
            );
          }

          if (
            values.createCashier &&
            values.cashierEmail &&
            values.cashierPassword &&
            values.cashierLinkSlug
          ) {
            try {
              await createCashier.mutateAsync({
                name: values.cashierName || "Cashier",
                email: values.cashierEmail,
                password: values.cashierPassword,
                cashierLinkSlug: values.cashierLinkSlug,
              });
              const payload = {
                email: values.cashierEmail,
                password: values.cashierPassword,
              };
              const blob = new Blob([JSON.stringify(payload, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `cashier-credentials-${values.cashierEmail.replace(/@.*/, "")}.json`;
              a.click();
              URL.revokeObjectURL(url);
            } catch (cashierError) {
              console.error("Failed to create cashier:", cashierError);
              const errorMessage = getErrorMessageFromResponse(
                cashierError,
                "Failed to create cashier",
              );
              toast.error(
                `Business created but failed to create cashier: ${errorMessage}. You can add one later.`,
              );
            }
          }

          toast.success("Setup complete!");
          if (onCompleted) {
            onCompleted();
          } else {
            router.replace("/inbox");
          }
        } else {
          const errorMsg = getErrorMessageFromResponse(
            result.error,
            "Something went wrong. Please try again.",
          );
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }
      } catch (error: unknown) {
        const errorMessage = getErrorMessageFromResponse(
          error,
          "Something went wrong. Please try again.",
        );
        toast.error(errorMessage);
        throw error;
      }
    },
    disableNext: ({ stepId, values }) => {
      if (stepId !== "business") return false;
      const slug = (values.businessSlug ?? "").trim();
      const normalized = generateSlug(slug);
      const isValid =
        normalized.length >= 2 &&
        /^[a-z0-9-]+$/.test(normalized) &&
        !normalized.startsWith("-");
      if (!isValid) return true;
      if (values.businessSlugAvailable === false) return true;
      return false;
    },
    steps: [
      {
        id: "business",
        title: "Business Info",
        fields: [
          "businessName",
          "businessSlug",
          "businessSlugAvailable",
          "defaultPointsName",
          "defaultCurrencySymbol",
          "defaultCurrencyCode",
          "themeColor",
        ],
        schema: businessStepSchema,
        Component: ({ stepIndex, totalSteps }) => (
          <StepContent
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            title="Tell us about your business"
            description="This information will be used to customize your customers' experience."
            required
          >
            <BusinessStep />
          </StepContent>
        ),
      },
      {
        id: "cashier",
        title: "Team Setup",
        fields: [
          "createCashier",
          "cashierName",
          "cashierEmail",
          "cashierPassword",
          "cashierLinkSlug",
        ],
        schema: cashierStepSchema,
        Component: ({ stepIndex, totalSteps }) => (
          <StepContent
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            title="Set up your team"
            description="Add a cashier account so your team can start accepting points. You can skip this and do it later."
          >
            <CashierStep />
          </StepContent>
        ),
      },
      {
        id: "review",
        title: "Review",
        Component: () => <ReviewStep />,
      },
    ],
  };

  const formInitialValues = {
    businessName: "",
    businessSlug: "",
    businessSlugAvailable: false,
    defaultPointsName: "Points",
    defaultCurrencySymbol: "₹",
    defaultCurrencyCode: "INR",
    createCashier: false,
    cashierName: "",
    cashierEmail: "",
    cashierPassword: "",
    cashierLinkSlug: "",
  };

  if (embedded) {
    return (
      <div className="min-h-[80vh] w-full">
        <LinearMultiStepForm<WelcomeFormValues>
          config={config}
          initialValues={formInitialValues}
          navigationPosition="footer"
          NavigationComponent={FormNavigation}
          progressType="bar"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <LinearMultiStepForm<WelcomeFormValues>
        config={config}
        initialValues={formInitialValues}
        navigationPosition="footer"
        NavigationComponent={FormNavigation}
        progressType="bar"
      />
    </div>
  );
}
