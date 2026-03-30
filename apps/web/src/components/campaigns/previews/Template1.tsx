"use client";

import { cn } from "@reelo/ui/lib/utils";
import { forwardRef } from "react";
import { InteractiveField } from "./InteractiveField";
import { type CampaignTemplateProps } from "./types";
import {
  DEFAULT_TEXT,
  DEFAULT_THEME,
  formatExpiryDate,
  renderBoldText,
} from "./utils";

export const Template1 = forwardRef<HTMLDivElement, CampaignTemplateProps>(
  function Template1(
    { data, branding, businessName, className, onFieldClick, focusedField },
    ref,
  ) {
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

    // Limits
    const maxRedemptionEnabled = data.maxRedemptionEnabled ?? false;
    const maxRedemptionAmount = data.maxRedemptionAmount;
    const minEarningEnabled = data.minPurchaseForEarningEnabled ?? false;
    const minEarningAmount = data.minPurchaseForEarning;
    const minRedemptionEnabled = data.minPurchaseForRedemptionEnabled ?? false;
    const minRedemptionAmount = data.minPurchaseForRedemption;
    const instantCashback = data.instantCashbackRedeemable ?? false;
    const redemptionLimit = data.redemptionLimit ?? "ONCE";

    const redemptionLabel =
      redemptionLimit === "MULTIPLE"
        ? "This offer can be redeemed multiple times per customer."
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
        <InteractiveField
          fieldName="bannerImage"
          onClick={onFieldClick}
          className="!m-0 !p-0"
          isFocused={focusedField === "bannerImage"}
        >
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
        </InteractiveField>

        <div
          className="relative -mt-8 flex flex-col items-center px-6 pb-6"
          style={{
            backgroundColor: themeColor,
            borderTopLeftRadius: "2rem",
            borderTopRightRadius: "2rem",
            color: textColor,
          }}
        >
          {(hasLogo || hasBusinessName) && (
            <InteractiveField
              fieldName="logo"
              onClick={onFieldClick}
              className="z-10 -mt-12 mb-3"
              isFocused={focusedField === "logo"}
            >
              <div
                className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] bg-white shadow-lg"
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
            </InteractiveField>
          )}

          <InteractiveField
            fieldName="title"
            onClick={onFieldClick}
            isFocused={focusedField === "title"}
          >
            <h3 className="mt-2 text-center text-[1.85rem] leading-tight font-extrabold tracking-tight capitalize">
              {title}
            </h3>
          </InteractiveField>

          <InteractiveField
            fieldName="description"
            onClick={onFieldClick}
            isFocused={focusedField === "description"}
          >
            <p className="mt-3 text-center text-[1rem] leading-relaxed whitespace-pre-wrap opacity-90">
              {description}
            </p>
          </InteractiveField>

          {rewardValue && (
            <InteractiveField
              fieldName="offerStatement"
              onClick={onFieldClick}
              isFocused={focusedField === "offerStatement"}
            >
              <p className="mt-2.5 text-center text-[0.95rem] leading-relaxed whitespace-pre-wrap opacity-90">
                {renderBoldText(rewardValue)}
              </p>
            </InteractiveField>
          )}

          {(expiryFormatted || terms.length > 0 || contactNumber) && (
            <>
              <div
                className="mx-auto my-5 w-4/5"
                style={{ height: 1, backgroundColor: `${textColor}30` }}
              />

              {expiryFormatted && (
                <InteractiveField
                  fieldName="expiresAt"
                  onClick={onFieldClick}
                  isFocused={focusedField === "expiresAt"}
                >
                  <p className="text-center text-[1rem] font-extrabold tracking-wide">
                    Offer valid till {expiryFormatted}
                  </p>
                </InteractiveField>
              )}

              {terms.length > 0 && (
                <InteractiveField
                  fieldName="termsAndConditions"
                  onClick={onFieldClick}
                  isFocused={focusedField === "termsAndConditions"}
                >
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
                </InteractiveField>
              )}

              <InteractiveField
                fieldName="maxRedemptionEnabled"
                onClick={onFieldClick}
                isFocused={focusedField === "maxRedemptionEnabled"}
              >
                <div className="mt-5 space-y-1 text-center">
                  <p className="text-[0.85rem] opacity-85">{redemptionLabel}</p>
                  {maxRedemptionEnabled &&
                    maxRedemptionAmount != null &&
                    maxRedemptionAmount > 0 && (
                      <p className="text-[0.85rem] opacity-85">
                        <span className="font-semibold">
                          Max discount up to ₹{maxRedemptionAmount}
                        </span>
                        .
                      </p>
                    )}
                  {minEarningEnabled &&
                    minEarningAmount != null &&
                    minEarningAmount > 0 && (
                      <p className="text-[0.85rem] opacity-85">
                        <span className="font-semibold">
                          Min. purchase of ₹{minEarningAmount}
                        </span>{" "}
                        required to earn reward.
                      </p>
                    )}
                  {minRedemptionEnabled &&
                    minRedemptionAmount != null &&
                    minRedemptionAmount > 0 && (
                      <p className="text-[0.85rem] opacity-85">
                        <span className="font-semibold">
                          Min. purchase of ₹{minRedemptionAmount}
                        </span>{" "}
                        required to redeem.
                      </p>
                    )}
                  {instantCashback && (
                    <p className="text-[0.85rem] opacity-85">
                      Cashback is instantly redeemable on the same bill.
                    </p>
                  )}
                </div>
              </InteractiveField>

              {contactNumber && (
                <InteractiveField
                  fieldName="contactNumber"
                  onClick={onFieldClick}
                  isFocused={focusedField === "contactNumber"}
                >
                  <p className="mt-1 text-center text-[0.85rem] opacity-85">
                    Call{" "}
                    <span className="font-bold underline decoration-1 underline-offset-2">
                      {contactNumber}
                    </span>{" "}
                    for more details
                  </p>
                </InteractiveField>
              )}
            </>
          )}
        </div>
      </div>
    );
  },
);
