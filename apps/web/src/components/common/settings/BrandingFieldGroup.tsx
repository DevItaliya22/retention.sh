"use client";

import { SettingsFieldGroup } from "./SettingsFieldGroup";

/** Standard branding field definitions — all optional so partial branding is allowed. */
const BRANDING_FIELDS = [
  {
    name: "logo",
    label: "Logo URL",
    placeholder: "https://...",
    helpText: "Enter a valid image URL for your logo.",
    optional: true,
  },
  {
    name: "themeColor",
    label: "Theme Color",
    placeholder: "#7c3aed",
    helpText: "Enter a hex color code (e.g., #7c3aed).",
    optional: true,
  },
  {
    name: "textColor",
    label: "Text Color",
    placeholder: "#ffffff",
    helpText: "Enter a hex color code for text (e.g., #ffffff).",
    optional: true,
  },
  {
    name: "bannerImage",
    label: "Banner Image URL",
    placeholder: "https://...",
    helpText: "Enter a valid image URL for your banner.",
    optional: true,
  },
  {
    name: "header",
    label: "Header",
    placeholder: "Welcome",
    helpText: "Main heading on customer-facing pages.",
    optional: true,
  },
  {
    name: "subtitle",
    label: "Subtitle",
    placeholder: "Earn rewards / Share your experience",
    helpText: "Subheading or short description.",
    optional: true,
  },
] as const;

export interface BrandingFieldGroupDefaultValues {
  logo?: string;
  themeColor?: string;
  textColor?: string;
  bannerImage?: string;
  header?: string;
  subtitle?: string;
}

export interface BrandingFieldGroupProps {
  title: string;
  description?: string;
  defaultValues: BrandingFieldGroupDefaultValues;
  onSubmit: (values: Record<string, string>) => Promise<{
    success: boolean;
    error?: string;
  }>;
}

/**
 * Standard branding settings block used across General (business), Referral, Feedback, etc.
 * All fields are optional — partial branding is allowed.
 */
export function BrandingFieldGroup({
  title,
  description,
  defaultValues,
  onSubmit,
}: BrandingFieldGroupProps) {
  return (
    <SettingsFieldGroup
      title={title}
      description={description}
      fields={[...BRANDING_FIELDS]}
      defaultValues={{
        logo: defaultValues.logo ?? "",
        themeColor: defaultValues.themeColor ?? "",
        textColor: defaultValues.textColor ?? "",
        bannerImage: defaultValues.bannerImage ?? "",
        header: defaultValues.header ?? "",
        subtitle: defaultValues.subtitle ?? "",
      }}
      onSubmit={onSubmit}
    />
  );
}
