"use client";

import { cn } from "@reelo/ui/lib/utils";
import { forwardRef, type ReactNode } from "react";

/** Parses **bold** markers in text and returns React nodes with <strong> tags */
function renderBoldText(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-extrabold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export interface CampaignPreviewData {
  title: string | null;
  description: string | null;
  contactNumber: string | null;
  rewardValue: string | null;
  expiresAt: string | null;
  termsAndConditions: string[];
  maxRedemptionEnabled?: boolean;
  maxRedemptionAmount?: number | null;
  minPurchaseForEarningEnabled?: boolean;
  minPurchaseForEarning?: number | null;
  minPurchaseForRedemptionEnabled?: boolean;
  minPurchaseForRedemption?: number | null;
  instantCashbackRedeemable?: boolean;
  redemptionLimit?: string | null;
}

export interface CampaignPreviewBranding {
  logo: string | null;
  themeColor: string | null;
  textColor: string | null;
  bannerImage: string | null;
}

interface CampaignPreviewProps {
  data: CampaignPreviewData;
  branding: CampaignPreviewBranding;
  businessName?: string | null;
  className?: string;
}

const DEFAULT_THEME = "#7F4899";
const DEFAULT_TEXT = "#ffffff";

function formatExpiryDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

/**
 * Campaign card preview — matching Reelo campaign card design.
 *
 * Structure:
 * 1. Banner image (top ~35%)
 * 2. Curved themed section (bottom ~65%) with arc overlapping the banner
 * 3. Logo circle at the overlap point
 * 4. All content center-aligned: title, description, separator, expiry, terms, contact
 */
export const CampaignPreview = forwardRef<HTMLDivElement, CampaignPreviewProps>(
  function CampaignPreview({ data, branding, businessName, className }, ref) {
    const themeColor = branding.themeColor || DEFAULT_THEME;
    const textColor = branding.textColor || DEFAULT_TEXT;
    const bannerImage = branding.bannerImage;
    const logo = branding.logo;
    const title = data.title || "Your Campaign Title";
    const description =
      data.description || "Your campaign description goes here.";
    const contactNumber = data.contactNumber;
    const rewardValue = data.rewardValue;
    const expiryFormatted = formatExpiryDate(data.expiresAt);
    const terms = data.termsAndConditions;
    const maxRedemptionEnabled = data.maxRedemptionEnabled ?? false;
    const maxRedemptionAmount = data.maxRedemptionAmount;
    const minEarningEnabled = data.minPurchaseForEarningEnabled ?? false;
    const minEarningAmount = data.minPurchaseForEarning;
    const minRedemptionEnabled = data.minPurchaseForRedemptionEnabled ?? false;
    const minRedemptionAmount = data.minPurchaseForRedemption;
    const instantCashback = data.instantCashbackRedeemable ?? false;
    const redemptionLimit = data.redemptionLimit ?? "ONCE";

    // Build redemption line
    const redemptionLabel =
      redemptionLimit === "UNLIMITED"
        ? "This offer can be redeemed unlimited times."
        : redemptionLimit === "TWICE"
          ? "This offer can be redeemed twice per customer."
          : "This offer can be redeemed once per customer.";

    const hasLogo = !!logo;
    const hasBusinessName = !!businessName;

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full flex-col overflow-hidden rounded-2xl",
          className,
        )}
        style={{ backgroundColor: themeColor }}
      >
        {/* ===== BANNER ===== */}
        <div
          className="relative w-full"
          style={{
            height: 180,
            ...(bannerImage
              ? {
                  backgroundImage: `url(${bannerImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }
              : {
                  background:
                    "linear-gradient(135deg, #c8a882 0%, #a08060 50%, #7a6040 100%)",
                }),
          }}
        />

        {/* ===== CURVED THEMED SECTION ===== */}
        <div
          className="relative -mt-8 flex flex-col items-center px-6 pb-6"
          style={{
            backgroundColor: themeColor,
            borderTopLeftRadius: "2rem",
            borderTopRightRadius: "2rem",
            color: textColor,
          }}
        >
          {/* Logo circle — sits at the overlap */}
          {(hasLogo || hasBusinessName) && (
            <div
              className="-mt-12 mb-3 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] bg-white shadow-lg"
              style={{ borderColor: `${themeColor}` }}
            >
              {hasLogo ? (
                <img
                  src={logo!}
                  alt="Logo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span
                  className="text-lg font-bold"
                  style={{ color: themeColor }}
                >
                  {businessName!
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <h3 className="mt-2 text-center text-[1.85rem] leading-tight font-extrabold tracking-tight capitalize">
            {title}
          </h3>

          {/* Description */}
          <p className="mt-3 text-center text-[1rem] leading-relaxed whitespace-pre-wrap opacity-90">
            {description}
          </p>

          {/* Reward offer sentence — **text** rendered bold */}
          {rewardValue && (
            <p className="mt-2.5 text-center text-[0.95rem] leading-relaxed whitespace-pre-wrap opacity-90">
              {renderBoldText(rewardValue)}
            </p>
          )}

          {/* Separator + Expiry + Terms + Contact */}
          {(expiryFormatted || terms.length > 0 || contactNumber) && (
            <>
              {/* Separator line */}
              <div
                className="mx-auto my-5 w-4/5"
                style={{
                  height: 1,
                  backgroundColor: `${textColor}30`,
                }}
              />

              {/* Expiry */}
              {expiryFormatted && (
                <p className="text-center text-[1rem] font-extrabold tracking-wide">
                  Expires on {expiryFormatted}
                </p>
              )}

              {/* Terms */}
              {terms.length > 0 && (
                <div className="mt-3 space-y-1 text-center">
                  {terms.map((term) => (
                    <p
                      key={term}
                      className="text-[0.95rem] leading-relaxed opacity-90"
                    >
                      {term}
                    </p>
                  ))}
                </div>
              )}

              {/* Redemption info & constraints */}
              <div className="mt-5 space-y-1 text-center">
                <p className="text-[0.85rem] opacity-85">{redemptionLabel}</p>
                {maxRedemptionEnabled &&
                  maxRedemptionAmount != null &&
                  maxRedemptionAmount > 0 && (
                    <p className="text-[0.85rem] opacity-85">
                      Max discount up to ₹{maxRedemptionAmount}.
                    </p>
                  )}
                {minEarningEnabled &&
                  minEarningAmount != null &&
                  minEarningAmount > 0 && (
                    <p className="text-[0.85rem] opacity-85">
                      Min. purchase of ₹{minEarningAmount} required to earn
                      reward.
                    </p>
                  )}
                {minRedemptionEnabled &&
                  minRedemptionAmount != null &&
                  minRedemptionAmount > 0 && (
                    <p className="text-[0.85rem] opacity-85">
                      Min. purchase of ₹{minRedemptionAmount} required to
                      redeem.
                    </p>
                  )}
                {instantCashback && (
                  <p className="text-[0.85rem] opacity-85">
                    Cashback is instantly redeemable on the same bill.
                  </p>
                )}

                {/* Contact */}
                {contactNumber && (
                  <p className="mt-1 text-[0.85rem] opacity-85">
                    Call{" "}
                    <span className="font-bold underline decoration-1 underline-offset-2">
                      {contactNumber}
                    </span>{" "}
                    for more details
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  },
);
