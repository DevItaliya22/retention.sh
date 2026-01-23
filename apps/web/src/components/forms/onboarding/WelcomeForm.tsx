"use client";

import { BusinessStep } from "@/components/forms/onboarding/steps/BusinessStep";
import { CashierStep } from "@/components/forms/onboarding/steps/CashierStep";
import { ReviewStep } from "@/components/forms/onboarding/steps/ReviewStep";
import useOnboarding from "@/hooks/onboarding/useOnboarding";
import { useManageCashier } from "@/hooks/cashier/useManageCashier";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import {
  businessStepSchema,
  cashierStepSchema,
  type WelcomeFormValues,
} from "@/lib/schemas/onboarding";
import slugify from "slugify";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormNavigation,
  LinearMultiStepForm,
  type LinearMultiStepFormConfig,
} from "@reelo/ui/components";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface WelcomeFormProps {
  onCompleted?: () => void;
}

export function WelcomeForm({ onCompleted }: WelcomeFormProps) {
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

        const result = await submitOnboarding(businessData as WelcomeFormValues);
        if (result.success) {
          await queryClient.invalidateQueries({ queryKey: ["currentBusiness"] });
          
          const businessResult = await refetchCurrentBusiness();
          
          if (!businessResult.data?.business) {
            throw new Error("Business was created but could not be retrieved. Please refresh the page.");
          }
          
          if (values.createCashier && values.cashierEmail && values.cashierPassword && values.cashierLinkSlug) {
            try {
              await createCashier.mutateAsync({
                name: values.cashierName || "Cashier",
                email: values.cashierEmail,
                password: values.cashierPassword,
                cashierLinkSlug: values.cashierLinkSlug,
              });
            } catch (cashierError) {
              console.error("Failed to create cashier:", cashierError);
              const errorMessage = cashierError instanceof Error ? cashierError.message : "Failed to create cashier";
              toast.error(`Business created but failed to create cashier: ${errorMessage}. You can add one later.`);
            }
          }

          toast.success("Setup complete!");
          if (onCompleted) {
            onCompleted();
          } else {
            router.replace("/inbox");
          }
        } else {
          toast.error(result.error || "Something went wrong");
          throw new Error(result.error || "Something went wrong");
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
        toast.error(errorMessage);
        throw error;
      }
    },
    disableNext: ({ stepId, values }) => {
      if (stepId !== "business") return false;
      const slug = (values.businessSlug ?? "").trim();
      const normalized = slugify(slug, {
        lower: true,
        strict: true,
        trim: true,
      });
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
          "defaultPointsName",
          "defaultCurrencySymbol",
          "defaultCurrencyCode",
          "themeColor",
        ],
        schema: businessStepSchema,
        Component: () => (
          <Card className="border-none shadow-none">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Tell us about your business</CardTitle>
              <CardDescription>
                This information will be used to customize your customers'
                experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <BusinessStep />
            </CardContent>
          </Card>
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
        Component: () => (
          <Card className="border-none shadow-none">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Set up your team</CardTitle>
              <CardDescription>
                Add a cashier account so your team can start accepting points.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <CashierStep />
            </CardContent>
          </Card>
        ),
      },
      {
        id: "review",
        title: "Review",
        Component: () => <ReviewStep />,
      },
    ],
  };

  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to Reelo!
          </h1>
          <p className="text-muted-foreground text-lg">
            Let's get your business set up in just a few steps.
          </p>
        </div>

        <Card className="bg-card border-border shadow-xl backdrop-blur-sm">
          <CardContent className="p-8">
            <LinearMultiStepForm<WelcomeFormValues>
              config={config}
              initialValues={{
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
              }}
              navigationPosition="footer"
              NavigationComponent={FormNavigation}
              progressType="bar"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
