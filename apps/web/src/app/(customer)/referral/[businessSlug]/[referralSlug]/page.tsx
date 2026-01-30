import { ReferralLandingPageClient } from "@/components/referral/ReferralLandingPageClient";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ businessSlug: string; referralSlug: string }>;
}): Promise<Metadata> {
  const { businessSlug } = await params;
  return generateRouteMetadata(`/referral/${businessSlug}/[referralSlug]`, {
    businessSlug,
  });
}

export default async function ReferralLandingPage({
  params,
}: {
  params: Promise<{ businessSlug: string; referralSlug: string }>;
}) {
  const { businessSlug, referralSlug } = await params;
  return (
    <ReferralLandingPageClient
      businessSlug={businessSlug}
      referralSlug={referralSlug}
    />
  );
}
