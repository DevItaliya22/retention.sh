import type { LoyaltyBranding } from "./types";

export function BrandingHero({
  branding,
}: {
  branding?: LoyaltyBranding | null;
}) {
  if (!branding) return null;
  const { bannerImageUrl, header, subtitle, themeColor, textColor } = branding;
  const hasContent = bannerImageUrl || header || subtitle;
  if (!hasContent) return null;

  if (bannerImageUrl) {
    return (
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bannerImageUrl} alt="" className="h-40 w-full object-cover" />
        {(header || subtitle) && (
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pt-8 pb-3"
            style={{ color: textColor || "#ffffff" }}
          >
            {header && (
              <p className="text-sm font-semibold drop-shadow-sm">{header}</p>
            )}
            {subtitle && (
              <p className="text-xs opacity-90 drop-shadow-sm">{subtitle}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="px-4 py-3"
      style={{
        backgroundColor: themeColor || undefined,
        color: textColor || (themeColor ? "#ffffff" : undefined),
      }}
    >
      {header && <p className="text-sm font-semibold">{header}</p>}
      {subtitle && <p className="mt-0.5 text-xs opacity-80">{subtitle}</p>}
    </div>
  );
}
