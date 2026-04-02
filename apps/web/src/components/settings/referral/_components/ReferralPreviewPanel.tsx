"use client";

import { ReferralClaimPageClient } from "@/components/referral/ReferralClaimPageClient";
import { ReferralLandingPageClient } from "@/components/referral/ReferralLandingPageClient";
import type { ReferralProgram } from "@/hooks/referral/useReferralProgram";
import { useR2Upload } from "@/hooks/storage/useR2Upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@reelo/ui/components";
import { Smartphone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface ReferralPreviewBrandingValues {
  logo: string | null;
  bannerImage: string | null;
  themeColor: string | null;
  textColor: string | null;
  header: string | null;
  subtitle: string | null;
}

export function ReferralPreviewPanel({
  brandingValues,
  referralProgram,
  previewBusinessName,
}: {
  brandingValues: ReferralPreviewBrandingValues;
  referralProgram: ReferralProgram;
  previewBusinessName: string;
}) {
  const { getReadSignedUrl } = useR2Upload();
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("referral-page");

  const resolveKey = useCallback(
    (key: string | null) => {
      if (!key) return null;
      if (key.startsWith("blob:") || key.startsWith("http")) return key;
      return resolvedUrls[key] ?? null;
    },
    [resolvedUrls],
  );

  useEffect(() => {
    const keys = [brandingValues.logo, brandingValues.bannerImage].filter(
      (k): k is string =>
        !!k && !k.startsWith("blob:") && !k.startsWith("http"),
    );
    if (keys.length === 0) return;

    let cancelled = false;
    void Promise.all(
      keys.map(async (k) => {
        if (resolvedUrls[k]) return;
        try {
          const url = await getReadSignedUrl(k);
          if (!cancelled) {
            setResolvedUrls((prev) => ({ ...prev, [k]: url }));
          }
        } catch (_error) {
          // Ignore preview asset resolution failures and keep fallback state.
        }
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [
    brandingValues.logo,
    brandingValues.bannerImage,
    getReadSignedUrl,
    resolvedUrls,
  ]);

  const previewBranding = {
    logo: resolveKey(brandingValues.logo),
    bannerImage: resolveKey(brandingValues.bannerImage),
    themeColor: brandingValues.themeColor,
    textColor: brandingValues.textColor,
    header: brandingValues.header,
    subtitle: brandingValues.subtitle,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Smartphone className="text-muted-foreground size-4" />
        <p className="text-sm font-medium">Preview</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="referral-page" className="flex-1">
            Referral Page
          </TabsTrigger>
          <TabsTrigger value="claim-page" className="flex-1">
            Claim Page
          </TabsTrigger>
        </TabsList>

        <TabsContent value="referral-page" className="mt-3">
          <PhoneFrame>
            <ReferralLandingPageClient
              businessSlug="preview-business"
              referralSlug="preview-referral"
              previewMode
              previewBranding={previewBranding}
              previewProgram={referralProgram}
            />
          </PhoneFrame>
        </TabsContent>

        <TabsContent value="claim-page" className="mt-3">
          <PhoneFrame>
            <ReferralClaimPageClient
              referralSlug="preview-referral"
              previewMode
              previewBranding={previewBranding}
              previewProgram={referralProgram}
            />
          </PhoneFrame>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[340px]">
      <div className="overflow-hidden rounded-[2rem] border-[3px] border-zinc-300 shadow-xl dark:border-zinc-600">
        <div className="flex items-center justify-center bg-zinc-900 py-1.5">
          <div className="h-3 w-20 rounded-full bg-zinc-800" />
        </div>
        <div className="relative h-[560px] overflow-hidden bg-white">
          <div
            className="origin-top-left overflow-y-auto"
            style={{
              width: 430,
              height: 560 / 0.79,
              transform: "scale(0.79)",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
