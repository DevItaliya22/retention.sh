import {
  DEFAULT_BRANDING_TEXT_COLOR,
  DEFAULT_BRANDING_THEME_COLOR,
} from "@/lib/constants/branding";

type BrandingLike = {
  logo?: string | null;
  bannerImage?: string | null;
  themeColor?: string | null;
  textColor?: string | null;
  header?: string | null;
  subtitle?: string | null;
} | null;

type ResolveServiceBrandingInput = {
  branding?: BrandingLike;
  defaultBranding?: BrandingLike;
  useDefaultBrandingForServices?: boolean;
};

export function getDefaultBrandingColors(defaultBranding?: BrandingLike) {
  return {
    themeColor:
      defaultBranding?.themeColor?.trim() || DEFAULT_BRANDING_THEME_COLOR,
    textColor:
      defaultBranding?.textColor?.trim() || DEFAULT_BRANDING_TEXT_COLOR,
  };
}

export function resolveServiceBranding({
  branding,
  defaultBranding,
  useDefaultBrandingForServices = false,
}: ResolveServiceBrandingInput) {
  const defaultColors = getDefaultBrandingColors(defaultBranding);
  const inheritedDefaults = useDefaultBrandingForServices
    ? defaultBranding
    : null;

  return {
    logo: branding?.logo ?? inheritedDefaults?.logo ?? null,
    bannerImage:
      branding?.bannerImage ?? inheritedDefaults?.bannerImage ?? null,
    header: branding?.header ?? inheritedDefaults?.header ?? null,
    subtitle: branding?.subtitle ?? inheritedDefaults?.subtitle ?? null,
    themeColor:
      branding?.themeColor ??
      inheritedDefaults?.themeColor ??
      defaultColors.themeColor,
    textColor:
      branding?.textColor ??
      inheritedDefaults?.textColor ??
      defaultColors.textColor,
  };
}
