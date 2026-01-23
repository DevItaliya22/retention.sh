"use client";

import { BusinessStep } from "@/components/forms/onboarding/steps/BusinessStep";
import { CashierStep } from "@/components/forms/onboarding/steps/CashierStep";
import { ReviewStep } from "@/components/forms/onboarding/steps/ReviewStep";
import useOnboarding from "@/hooks/onboarding/useOnboarding";
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

  const config: LinearMultiStepFormConfig<WelcomeFormValues> = {
    id: "welcome-form",
    title: "Setup your business",
    onSubmit: async ({ values }) => {
      try {
        const result = await submitOnboarding(values);
        if (result.success) {
          await queryClient.invalidateQueries({ queryKey: ["currentBusiness"] });
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
      } catch (error: any) {
        toast.error(error.message || "Something went wrong");
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
