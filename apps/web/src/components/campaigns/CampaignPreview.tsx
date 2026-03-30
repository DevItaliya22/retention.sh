"use client";

import { useSignedImageUrl } from "@/hooks/storage/useSignedImageUrl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { forwardRef, useState } from "react";
import { CAMPAIGN_PREVIEW_TEMPLATES } from "./previews/config";
import type {
  CampaignPreviewBranding,
  CampaignPreviewData,
} from "./previews/types";

export type { CampaignPreviewBranding, CampaignPreviewData };

interface CampaignPreviewProps {
  data: CampaignPreviewData;
  branding: CampaignPreviewBranding;
  businessName?: string | null;
  className?: string;
  onFieldClick?: (fieldName: string) => void;
  /** When set, that preview region keeps the dashed outline (after click). */
  focusedField?: string | null;
}

export const CampaignPreview = forwardRef<HTMLDivElement, CampaignPreviewProps>(
  function CampaignPreview(
    { data, branding, businessName, className, onFieldClick, focusedField },
    ref,
  ) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const signedLogoUrl = useSignedImageUrl(branding.logo);
    const signedBannerUrl = useSignedImageUrl(branding.bannerImage);

    const prev = () =>
      setCurrentIndex((c) =>
        c > 0 ? c - 1 : CAMPAIGN_PREVIEW_TEMPLATES.length - 1,
      );
    const next = () =>
      setCurrentIndex((c) =>
        c < CAMPAIGN_PREVIEW_TEMPLATES.length - 1 ? c + 1 : 0,
      );

    const validIndex = currentIndex % CAMPAIGN_PREVIEW_TEMPLATES.length;
    const Template =
      CAMPAIGN_PREVIEW_TEMPLATES[validIndex]?.component ||
      CAMPAIGN_PREVIEW_TEMPLATES[0]!.component;
    const templateName =
      CAMPAIGN_PREVIEW_TEMPLATES[validIndex]?.name ||
      CAMPAIGN_PREVIEW_TEMPLATES[0]!.name;
    const resolvedBranding: CampaignPreviewBranding = {
      ...branding,
      logo: signedLogoUrl,
      bannerImage: signedBannerUrl,
    };

    return (
      <div className="flex w-full flex-col gap-4">
        {/* Template container (receives the ref so only this part is downloaded) */}
        <div className="relative w-full transition-all duration-300">
          <Template
            ref={ref}
            data={data}
            branding={resolvedBranding}
            businessName={businessName}
            className={className}
            onFieldClick={onFieldClick}
            focusedField={focusedField}
          />
        </div>

        {/* Navigation arrows underneath */}
        <div className="bg-background mt-2 flex w-full items-center justify-between rounded-lg border p-2 px-4 shadow-sm">
          <button
            type="button"
            onClick={prev}
            className="hover:bg-muted rounded-full p-2 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground mb-1 text-xs font-bold tracking-widest uppercase">
              Preview Style
            </span>
            <span className="text-sm font-semibold">{templateName}</span>
          </div>
          <button
            type="button"
            onClick={next}
            className="hover:bg-muted rounded-full p-2 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  },
);
