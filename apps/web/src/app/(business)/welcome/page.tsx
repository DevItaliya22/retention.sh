"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@reelo/ui/components";
import { 
  LinearMultiStepForm, 
  FormNavigation, 
  type LinearMultiStepFormConfig 
} from "@reelo/ui/components";
import { 
  welcomeFormSchema, 
  businessStepSchema, 
  cashierStepSchema, 
  type WelcomeFormValues 
} from "@/lib/schemas/onboarding";
import { BusinessStep } from "@/components/forms/onboarding/steps/BusinessStep";
import { CashierStep } from "@/components/forms/onboarding/steps/CashierStep";
import { ReviewStep } from "@/components/forms/onboarding/steps/ReviewStep";
import { submitWelcomeForm } from "@/lib/actions/onboarding";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function WelcomePage() {
  const router = useRouter();

  const config: LinearMultiStepFormConfig<WelcomeFormValues> = {
    id: "welcome-form",
    title: "Setup your business",
    onSubmit: async ({ values }) => {
      const result = await submitWelcomeForm(values);
      if (result.success) {
        toast.success("Setup complete!");
        router.push("/inbox");
        router.refresh();
      } else {
        toast.error(result.error || "Something went wrong");
      }
    },
    steps: [
      {
        id: "business",
        title: "Business Info",
        fields: ["businessName", "businessSlug", "defaultPointsName", "defaultCurrencySymbol", "defaultCurrencyCode", "themeColor"],
        schema: businessStepSchema,
        Component: () => (
          <Card className="border-none shadow-none">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Tell us about your business</CardTitle>
              <CardDescription>
                This information will be used to customize your customers' experience.
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
        fields: ["createCashier", "cashierName", "cashierEmail", "cashierPassword", "cashierLinkSlug"],
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
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
        <div className="w-full max-w-4xl space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Welcome to Reelo!</h1>
                <p className="text-muted-foreground text-lg">Let's get your business set up in just a few steps.</p>
            </div>
            
            <Card className="shadow-xl bg-card border-border backdrop-blur-sm">
                <CardContent className="p-8">
                    <LinearMultiStepForm<WelcomeFormValues>
                        config={config}
                        initialValues={{
                            businessName: "",
                            businessSlug: "",
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
                        showProgressStepper={true}
                    />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
