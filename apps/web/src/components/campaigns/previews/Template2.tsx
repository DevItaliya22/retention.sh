"use client";

import { cn } from "@reelo/ui/lib/utils";
import { forwardRef } from "react";
import { InteractiveField } from "./InteractiveField";
import { type CampaignTemplateProps } from "./types";
import { DEFAULT_THEME, formatExpiryDate, renderBoldText } from "./utils";

export const Template2 = forwardRef<HTMLDivElement, CampaignTemplateProps>(
  function Template2(
    { data, branding, businessName, className, onFieldClick },
    ref,
  ) {
    const themeColor = branding.themeColor || DEFAULT_THEME;
    const bannerImage = branding.bannerImage;
    const logo = branding.logo;
    const title = data.title || "Your Campaign Title";
    const description =
      data.description || "Your campaign description goes here.";
    const expiryFormatted = formatExpiryDate(data.expiresAt);
    const terms = data.termsAndConditions;

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full flex-col overflow-hidden rounded-md border bg-white text-slate-800",
          className,
        )}
      >
        <InteractiveField
          fieldName="bannerImage"
          onClick={onFieldClick}
          className="!m-0 !p-0"
        >
          <div
            className="w-full"
            style={{
              height: 200,
              ...(bannerImage
                ? {
                    backgroundImage: `url(${bannerImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : { background: themeColor }),
            }}
          />
        </InteractiveField>

        <div className="flex flex-col p-6">
          <div className="mb-4 flex items-center gap-4">
            {(logo || businessName) && (
              <InteractiveField fieldName="logo" onClick={onFieldClick}>
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded border bg-gray-50">
                  {logo ? (
                    <img
                      src={logo}
                      alt="Logo"
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-xl font-bold text-gray-400">
                      {businessName
                        ?.split(" ")
                        .map((w) => w[0])
                        .join("")}
                    </span>
                  )}
                </div>
              </InteractiveField>
            )}
            <div>
              <InteractiveField fieldName="title" onClick={onFieldClick}>
                <h3
                  className="text-xl font-bold tracking-tight"
                  style={{ color: themeColor }}
                >
                  {title}
                </h3>
              </InteractiveField>
            </div>
          </div>

          <InteractiveField fieldName="description" onClick={onFieldClick}>
            <p className="mb-4 text-sm leading-relaxed text-gray-600">
              {description}
            </p>
          </InteractiveField>

          {data.rewardValue && (
            <InteractiveField fieldName="offerStatement" onClick={onFieldClick}>
              <div
                className="mb-4 rounded-lg p-4 text-center text-lg font-medium tracking-tight shadow-sm"
                style={{
                  backgroundColor: `${themeColor}15`,
                  color: themeColor,
                }}
              >
                {renderBoldText(data.rewardValue)}
              </div>
            </InteractiveField>
          )}

          {expiryFormatted && (
            <InteractiveField fieldName="expiresAt" onClick={onFieldClick}>
              <p className="mb-4 w-full text-center text-sm font-semibold text-gray-800">
                Valid until {expiryFormatted}
              </p>
            </InteractiveField>
          )}

          {terms.length > 0 && (
            <InteractiveField
              fieldName="termsAndConditions"
              onClick={onFieldClick}
            >
              <ul className="mb-4 list-disc space-y-1 pl-4 text-xs text-gray-500">
                {terms.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </InteractiveField>
          )}

          <InteractiveField
            fieldName="maxRedemptionEnabled"
            onClick={onFieldClick}
          >
            <div className="mt-2 space-y-1 rounded-lg border bg-slate-50 p-3 text-center text-xs text-slate-500">
              <p>
                {data.redemptionLimit === "MULTIPLE"
                  ? "Redeemable multiple times."
                  : "Redeemable once per customer."}
              </p>
              {data.maxRedemptionEnabled &&
                data.maxRedemptionAmount != null &&
                data.maxRedemptionAmount > 0 && (
                  <p className="font-medium text-slate-700">
                    Max discount upto ₹{data.maxRedemptionAmount}.
                  </p>
                )}
              {data.minPurchaseForEarningEnabled &&
                data.minPurchaseForEarning != null &&
                data.minPurchaseForEarning > 0 && (
                  <p className="font-medium text-slate-700">
                    Min. purchase of ₹{data.minPurchaseForEarning} to earn.
                  </p>
                )}
              {data.minPurchaseForRedemptionEnabled &&
                data.minPurchaseForRedemption != null &&
                data.minPurchaseForRedemption > 0 && (
                  <p className="font-medium text-slate-700">
                    Min. purchase of ₹{data.minPurchaseForRedemption} to redeem.
                  </p>
                )}
              {data.instantCashbackRedeemable && (
                <p className="font-medium text-slate-700">
                  Instantly redeemable on the same bill.
                </p>
              )}
            </div>
          </InteractiveField>

          <InteractiveField fieldName="contactNumber" onClick={onFieldClick}>
            {data.contactNumber && (
              <p className="mt-4 text-center text-xs font-semibold text-gray-500">
                Contact: {data.contactNumber}
              </p>
            )}
          </InteractiveField>
        </div>
      </div>
    );
  },
);
