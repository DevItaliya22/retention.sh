"use client";

import { cn } from "@reelo/ui/lib/utils";
import { forwardRef } from "react";
import { InteractiveField } from "./InteractiveField";
import { type CampaignTemplateProps } from "./types";
import { DEFAULT_THEME, formatExpiryDate, renderBoldText } from "./utils";

export const Template9 = forwardRef<HTMLDivElement, CampaignTemplateProps>(
  function Template9(
    { data, branding, businessName, className, onFieldClick },
    ref,
  ) {
    const themeColor = branding.themeColor || DEFAULT_THEME;

    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full flex-col rounded-none border-4 bg-[#FAFAFA] text-[#2C2C2C] shadow-md",
          className,
        )}
        style={{ borderColor: themeColor }}
      >
        <div className="m-2 flex h-full flex-col items-center justify-center border border-[#E0E0E0] p-8 text-center">
          <div className="mb-8 border-b border-[#2C2C2C] px-6 pb-2">
            <InteractiveField fieldName="title" onClick={onFieldClick}>
              <h2 className="font-serif text-3xl tracking-widest uppercase">
                {data.title || "Elegant"}
              </h2>
            </InteractiveField>
          </div>

          <InteractiveField fieldName="description" onClick={onFieldClick}>
            <p className="mb-10 max-w-[85%] font-serif text-lg leading-relaxed text-[#666666] italic">
              {data.description}
            </p>
          </InteractiveField>

          {data.rewardValue && (
            <InteractiveField fieldName="offerStatement" onClick={onFieldClick}>
              <p
                className="font-serif text-2xl font-medium tracking-wide"
                style={{ color: themeColor }}
              >
                {renderBoldText(data.rewardValue)}
              </p>
            </InteractiveField>
          )}

          <div className="mt-12 flex w-full flex-col items-center space-y-4">
            <div className="mb-4 h-px w-16 bg-[#2C2C2C]" />

            {data.expiresAt && (
              <InteractiveField fieldName="expiresAt" onClick={onFieldClick}>
                <p className="font-serif text-xs tracking-widest text-[#888888] uppercase">
                  Expires // {formatExpiryDate(data.expiresAt)}
                </p>
              </InteractiveField>
            )}

            <InteractiveField
              fieldName="maxRedemptionEnabled"
              onClick={onFieldClick}
              className="w-full"
            >
              <div className="w-full space-y-1 border-t border-b border-[#E0E0E0] px-4 py-4 text-center font-serif text-sm text-[#444]">
                <p>
                  {data.redemptionLimit === "MULTIPLE"
                    ? "Redeemable multiple times"
                    : "Redeemable once per customer"}
                </p>
                {data.maxRedemptionEnabled &&
                  data.maxRedemptionAmount != null &&
                  data.maxRedemptionAmount > 0 && (
                    <p className="font-semibold text-[#222]">
                      Max discount upto ₹{data.maxRedemptionAmount}
                    </p>
                  )}
                {data.minPurchaseForEarningEnabled &&
                  data.minPurchaseForEarning != null &&
                  data.minPurchaseForEarning > 0 && (
                    <p className="font-semibold text-[#222]">
                      Min. purchase of ₹{data.minPurchaseForEarning} to earn
                    </p>
                  )}
                {data.minPurchaseForRedemptionEnabled &&
                  data.minPurchaseForRedemption != null &&
                  data.minPurchaseForRedemption > 0 && (
                    <p className="font-semibold text-[#222]">
                      Min. purchase of ₹{data.minPurchaseForRedemption} to
                      redeem
                    </p>
                  )}
                {data.instantCashbackRedeemable && (
                  <p className="font-semibold text-[#222]">
                    Instantly redeemable
                  </p>
                )}
              </div>
            </InteractiveField>

            {data.termsAndConditions.length > 0 && (
              <InteractiveField
                fieldName="termsAndConditions"
                onClick={onFieldClick}
              >
                <div className="w-full space-y-1 pt-2 text-center font-serif text-[11px] text-[#666] opacity-80">
                  {data.termsAndConditions.map((t, i) => (
                    <p key={i}>* {t}</p>
                  ))}
                </div>
              </InteractiveField>
            )}

            {data.contactNumber && (
              <InteractiveField
                fieldName="contactNumber"
                onClick={onFieldClick}
              >
                <p className="mt-2 font-serif text-xs text-[#888888] italic">
                  Call {data.contactNumber}
                </p>
              </InteractiveField>
            )}
          </div>
        </div>
      </div>
    );
  },
);
