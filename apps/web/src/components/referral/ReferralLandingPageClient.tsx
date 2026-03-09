"use client";

import { usePublicReferralProgram } from "@/hooks/referral/useReferralProgram";
import { Skeleton } from "@reelo/ui/components";
import { Gift, MoveRight, Share2, Sparkles } from "lucide-react";
import { useMemo } from "react";

interface ReferralLandingPageClientProps {
  businessSlug: string;
  referralSlug: string;
}

const DEFAULT_THEME_COLOR = "#0f766e";
const DEFAULT_TEXT_COLOR = "#f8fafc";
const pageWrapClass =
  "flex min-h-screen items-center justify-center bg-white p-4 font-sans sm:p-6";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const value = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{3,8}$/.test(value)) return null;
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value.slice(0, 6);
  const num = Number.parseInt(normalized, 16);
  if (!Number.isFinite(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance >= 0.62;
}

function getContrastTextColor(bgColor: string): string {
  return isLightColor(bgColor) ? "#0f172a" : "#f8fafc";
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
        console.error("Error sharing:", error);
      }
    } else {
      await navigator.clipboard.writeText(referralLink);
      alert("Link copied to clipboard!");
    }
  };

  if (isError || (!isLoading && (!data?.referralProgram || !data?.business))) {
    return (
      <div className={pageWrapClass}>
        <div className="w-full max-w-[420px] rounded-[32px] border border-white/10 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <span className="text-2xl">😕</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Offer Not Found</h1>
          <p className="mt-2 text-[15px] text-slate-600">
            This referral program is no longer available.
          </p>
        </div>
      </div>
    );
  }

  const loading = isLoading && !data;
  const themeColor =
    (data?.referralProgram?.branding?.themeColor as string | undefined) ||
    DEFAULT_THEME_COLOR;
  const textColor =
    (data?.referralProgram?.branding?.textColor as string | undefined) ||
    getContrastTextColor(themeColor);
  const branding = data?.referralProgram?.branding;
  const bannerImage = branding?.bannerImage;
  const logo = branding?.logo;
  const header =
    (branding?.header as string | undefined) ||
    "Welcome to our Referral Program";
  const subtitle =
    (branding?.subtitle as string | undefined) ||
    "Share with friends and earn exclusive rewards.";
  const business = data?.business;
  const referralProgram = data?.referralProgram;

  const youGetText =
    referralProgram && business
      ? referralProgram.existingCustomerBenefitType === "AMOUNT_CASHBACK"
        ? `${business.defaultCurrencySymbol}${referralProgram.existingCustomerBenefitValue} Cashback`
        : referralProgram.existingCustomerBenefitType ===
            "FREE_ITEM_ON_NEXT_PURCHASE"
          ? `Free ${referralProgram.existingCustomerFreeItemSku?.name ?? "Item"}`
          : "Exclusive Reward"
      : null;
  const friendGetsText =
    referralProgram && business
      ? referralProgram.newCustomerBenefitType === "AMOUNT_CASHBACK"
        ? `${business.defaultCurrencySymbol}${referralProgram.newCustomerBenefitValue} Cashback`
        : referralProgram.newCustomerBenefitType ===
            "FREE_ITEM_ON_NEXT_PURCHASE"
          ? `Free ${referralProgram.newCustomerFreeItemSku?.name ?? "Item"}`
          : "Exclusive Reward"
      : null;

  return (
    <div className={pageWrapClass}>
      <div className="flex w-full max-w-[420px] flex-col overflow-hidden rounded-[32px] bg-white shadow-xl">
        {/* Top Header Block - Uses Theme Color Heavily */}
        <div
          className="relative px-8 pt-12 pb-[4.5rem] text-center"
          style={{ backgroundColor: themeColor }}
        >
          {bannerImage && (
            <>
              <div className="absolute inset-0 z-0">
                <img
                  src={bannerImage}
                  alt="Banner"
                  className="h-full w-full object-cover"
                />
              </div>
              <div
                className="absolute inset-0 z-0"
                style={{ backgroundColor: themeColor, opacity: 0.85 }}
              />
            </>
          )}

          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-5 h-20 w-20 rounded-full border border-white/20 bg-white p-0.5 shadow-lg">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white">
                {loading ? (
                  <Skeleton className="h-full w-full rounded-full" />
                ) : logo ? (
                  <img
                    src={logo}
                    alt="Logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-300">
                    {(business?.name || "B").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <h1
              className="mb-2 text-[26px] leading-tight font-bold tracking-tight"
              style={{ color: textColor }}
            >
              {header}
            </h1>
            <p
              className="max-w-[300px] text-[15px] leading-relaxed"
              style={{ color: textColor, opacity: 0.9 }}
            >
              {subtitle}
            </p>
          </div>
        </div>

        {/* Content Area - Overlaps the theme-colored header */}
        <div className="relative z-20 -mt-8 flex flex-col rounded-t-[32px] bg-white px-6 pb-6">
          {/* Rewards Sections that pop up into the header */}
          <div className="relative -mt-8 mb-8 overflow-hidden rounded-[24px] border border-gray-100/80 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-4 border-b border-gray-100/80 bg-gray-50/50 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm">
                <Gift
                  size={20}
                  strokeWidth={2.5}
                  style={{ color: themeColor }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-[12px] font-semibold tracking-wider text-gray-400 uppercase">
                  You Get
                </p>
                <div
                  className="inline-flex max-w-full items-center rounded-full px-3 py-1 text-[14px] font-semibold"
                  style={{
                    backgroundColor: `${themeColor}12`,
                    color: themeColor,
                  }}
                >
                  {youGetText == null ? (
                    <Skeleton className="h-5 w-32 rounded-full bg-gray-200" />
                  ) : (
                    youGetText
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm">
                <Sparkles
                  size={20}
                  strokeWidth={2.5}
                  style={{ color: themeColor }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-[12px] font-semibold tracking-wider text-gray-400 uppercase">
                  Friend Gets
                </p>
                <div
                  className="inline-flex max-w-full items-center rounded-full px-3 py-1 text-[14px] font-semibold"
                  style={{
                    backgroundColor: `${themeColor}12`,
                    color: themeColor,
                  }}
                >
                  {friendGetsText == null ? (
                    <Skeleton className="h-5 w-32 rounded-full bg-gray-200" />
                  ) : (
                    friendGetsText
                  )}
                </div>
              </div>
            </div>
          </div>

          {referralProgram?.informationSections &&
            referralProgram.informationSections.length > 0 && (
              <div className="mb-8 space-y-4 px-2">
                {referralProgram.informationSections.map((section) => (
                  <div key={section.title} className="text-left">
                    <h3 className="mb-1 text-[14px] font-bold text-gray-900">
                      {section.title}
                    </h3>
                    <p className="text-[14px] leading-relaxed text-gray-500">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

          <div className="mt-auto space-y-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={handleShare}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] text-[14px] font-medium transition-colors active:opacity-90 disabled:pointer-events-none"
              style={{ backgroundColor: themeColor, color: textColor }}
            >
              <Share2 size={18} />
              Share with friend
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                window.location.href = `/referral/claim/${referralSlug}`;
              }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border text-[14px] font-medium transition-colors hover:bg-gray-50 active:opacity-90 disabled:pointer-events-none"
              style={{ borderColor: `${themeColor}30`, color: themeColor }}
            >
              Claim Offer
              <MoveRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
