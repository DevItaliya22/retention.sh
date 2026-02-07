"use client";

import { usePublicReferralProgram } from "@/hooks/referral/useReferralProgram";
import { Button, Card, CardContent, Skeleton } from "@reelo/ui/components";
import { Share2 } from "lucide-react";
import { useMemo } from "react";

interface ReferralLandingPageClientProps {
  businessSlug: string;
  referralSlug: string;
}

export function ReferralLandingPageClient({
  businessSlug,
  referralSlug,
}: ReferralLandingPageClientProps) {
  const { data, isLoading, isError } = usePublicReferralProgram(businessSlug);

  const referralLink = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/referral/claim/${referralSlug}`;
    }
    return "";
  }, [referralSlug]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${data?.business?.name || "us"} and get rewards!`,
          text: `Check out ${data?.business?.name || "this"} referral program!`,
          url: referralLink,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(referralLink);
      alert("Link copied to clipboard!");
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !data?.referralProgram || !data?.business) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold">Referral Program Not Found</h1>
            <p className="text-muted-foreground mt-2">
              This referral program is not available or has been disabled.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { referralProgram, business } = data;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="space-y-6 p-6">
          {referralProgram.branding?.header && (
            <h1 className="text-center text-3xl font-bold">
              {referralProgram.branding.header}
            </h1>
          )}
          {referralProgram.branding?.subtitle && (
            <p className="text-muted-foreground text-center">
              {referralProgram.branding.subtitle}
            </p>
          )}

          <div className="space-y-4">
            <div>
              <h2 className="mb-2 text-xl font-semibold">What You Get</h2>
              <p className="text-muted-foreground">
                {referralProgram.existingCustomerBenefitValue}{" "}
                {referralProgram.existingCustomerBenefitType === "LOYALTY_BONUS"
                  ? business.defaultPointsName
                  : referralProgram.existingCustomerBenefitType ===
                      "CASH_DISCOUNT"
                    ? business.defaultCurrencySymbol
                    : ""}
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-xl font-semibold">
                What Your Friend Gets
              </h2>
              <p className="text-muted-foreground">
                {referralProgram.newCustomerBenefitValue}{" "}
                {referralProgram.newCustomerBenefitType === "LOYALTY_BONUS"
                  ? business.defaultPointsName
                  : referralProgram.newCustomerBenefitType === "CASH_DISCOUNT"
                    ? business.defaultCurrencySymbol
                    : ""}
              </p>
            </div>
          </div>

          {referralProgram.informationSections &&
            referralProgram.informationSections.length > 0 && (
              <div className="space-y-4">
                {referralProgram.informationSections.map((section, index) => (
                  <div key={index}>
                    <h3 className="mb-1 font-semibold">{section.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

          <div className="flex flex-col gap-2">
            <Button onClick={handleShare} className="w-full" size="lg">
              <Share2 className="mr-2 h-4 w-4" />
              Share with Friend
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = `/referral/claim/${referralSlug}`;
              }}
              className="w-full"
            >
              Claim Offer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
