"use client";

import { CampaignPreview } from "@/components/campaigns/CampaignPreview";
import { CampaignScheduledMessagesSection } from "@/components/campaigns/CampaignScheduledMessagesSection";
import {
  BrandingImageUploadControl,
  TermsConditionsEditor,
} from "@/components/common/form-sections";
import { GooeyTabs, ScaffoldContainer } from "@/components/layouts";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import {
  useCampaignQuery,
  useUpdateCampaign,
  type CampaignAppliesTo,
  type CampaignFull,
  type CampaignRedemptionLimit,
  type CampaignRewardType,
} from "@/hooks/campaigns/useCampaignsQuery";
import { useSegmentsQuery } from "@/hooks/segments/useSegmentsQuery";
import { useR2Upload } from "@/hooks/storage/useR2Upload";
import {
  CAMPAIGN_APPLIES_TO_LABELS,
  CAMPAIGN_DEFAULT_TERMS,
  CAMPAIGN_REDEMPTION_LABELS,
  CAMPAIGN_REWARD_PLACEHOLDERS,
  CAMPAIGN_REWARD_TEMPLATES,
  CAMPAIGN_REWARD_TYPE_LABELS,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TERMS_OPTIONS,
} from "@/lib/constants/forms/campaign";
import { fetcher } from "@/lib/fetcher";
import {
  CAMPAIGN_APPLIES_TO,
  CAMPAIGN_REDEMPTION_LIMITS,
  CAMPAIGN_REWARD_TYPES,
  CAMPAIGN_STATUSES,
} from "@/lib/schemas/campaign";
import { downloadCampaignCardAsImage } from "@/lib/utils/campaign-card-image";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Badge,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Switch,
  Textarea,
} from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Download,
  PlusCircle,
  XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Control, Resolver } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const formSchema = z
  .object({
    title: z.string().max(500).trim().optional().nullable(),
    description: z.string().max(2000).trim().optional().nullable(),
    contactNumber: z.string().max(20).trim().optional().nullable(),
    rewardType: z.enum(
      CAMPAIGN_REWARD_TYPES as unknown as [string, ...string[]],
    ),
    rewardValue: z.string().max(200).trim().optional().nullable(), // raw value: "coke", "10", "200"
    offerStatement: z.string().max(2000).trim().optional().nullable(), // full sentence
    appliesTo: z.enum(CAMPAIGN_APPLIES_TO as unknown as [string, ...string[]]),
    maxRedemptionEnabled: z.boolean(),
    maxRedemptionAmount: z.coerce.number().min(0).optional().nullable(),
    minPurchaseForEarningEnabled: z.boolean(),
    minPurchaseForEarning: z.coerce.number().min(0).optional().nullable(),
    minPurchaseForRedemptionEnabled: z.boolean(),
    minPurchaseForRedemption: z.coerce.number().min(0).optional().nullable(),
    instantCashbackRedeemable: z.boolean(),
    startsAt: z.string().optional(),
    expiresAt: z.string().optional(),
    redemptionLimit: z.enum(
      CAMPAIGN_REDEMPTION_LIMITS as unknown as [string, ...string[]],
    ),
    termsAndConditions: z.array(z.string()),
    themeColor: z.string().max(30).optional().nullable(),
    textColor: z.string().max(30).optional().nullable(),
    logo: z.string().max(2048).optional().nullable(),
    bannerImage: z.string().max(2048).optional().nullable(),
    status: z.enum(CAMPAIGN_STATUSES as unknown as [string, ...string[]]),
    emailSubject: z.string().max(500).trim().optional().nullable(),
    whatsappEnabled: z.boolean(),
    emailEnabled: z.boolean(),
    targetAudiences: z.array(z.string()).optional(),
    messageScheduledAt: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.startsAt || !values.expiresAt) return;

    const startsAt = new Date(values.startsAt);
    const expiresAt = new Date(values.expiresAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(expiresAt.getTime()))
      return;

    if (expiresAt < startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiresAt"],
        message: "Expiry date/time must be after campaign start date/time",
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_THEME_COLOR = "#7F4899";
const DEFAULT_TEXT_COLOR = "#ffffff";
const DEFAULT_REWARD_TYPE: CampaignRewardType = "FREE_ITEM";
const DEFAULT_REWARD_VALUE_BY_TYPE: Record<CampaignRewardType, string> = {
  FREE_ITEM: "Dessert",
  PERCENTAGE_DISCOUNT: "10",
  CASH_DISCOUNT: "200",
  NO_REWARD: "",
};

const CAMPAIGN_EDITOR_TABS = [
  { value: "setup", label: "Campaign Setup", path: "setup" },
  { value: "audience", label: "Audience", path: "audience" },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CampaignEditPageClientProps {
  campaignId: string;
  initialCampaign?: CampaignFull;
}

/**
 * Build an offer sentence from reward type + discount amount.
 * Wraps the value in **bold** markers so the preview can render it bold.
 * Appends max redemption info when enabled.
 */
function buildRewardSentence(
  type: string,
  amount: string,
  maxEnabled?: boolean,
  maxAmount?: number | null,
): string {
  const tpl = CAMPAIGN_REWARD_TEMPLATES[type] ?? "";
  if (!tpl) return "";
  if (!amount) return tpl.replace("{value}", "___");
  let formatted = amount;
  if (type === "PERCENTAGE_DISCOUNT") formatted = `${amount}%`;
  else if (type === "CASH_DISCOUNT") formatted = `₹${amount}`;
  else if (type === "FREE_ITEM") formatted = amount;
  let sentence = tpl.replace("{value}", `**${formatted}**`);
  if (maxEnabled && maxAmount && maxAmount > 0) {
    sentence += ` Maximum discount up to **₹${maxAmount}**.`;
  }
  return sentence;
}

function extractRewardValueFromStatement(
  rewardType: string,
  statement: string | null | undefined,
): string {
  if (!statement) return "";
  const match = statement.match(/\*\*([^*]+)\*\*/);
  const boldValue = match?.[1]?.trim();
  if (!boldValue) return "";

  if (rewardType === "PERCENTAGE_DISCOUNT") {
    return boldValue.replace(/%$/g, "").trim();
  }
  if (rewardType === "CASH_DISCOUNT") {
    return boldValue.replace(/^₹/g, "").trim();
  }
  if (rewardType === "FREE_ITEM") {
    return boldValue;
  }
  return "";
}

function isCampaignRewardType(value: unknown): value is CampaignRewardType {
  return (
    typeof value === "string" &&
    CAMPAIGN_REWARD_TYPES.includes(value as CampaignRewardType)
  );
}

function normalizeRewardType(value: unknown): CampaignRewardType {
  if (isCampaignRewardType(value)) return value;
  return DEFAULT_REWARD_TYPE;
}

function getDefaultRewardValue(type: CampaignRewardType): string {
  return DEFAULT_REWARD_VALUE_BY_TYPE[type];
}

export function CampaignEditPageClient({
  campaignId,
  initialCampaign,
}: CampaignEditPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const audienceParam = searchParams.get("audience");
  const exportPreviewRef = useRef<HTMLDivElement>(null);
  const [sentenceEdited, setSentenceEdited] = useState(false);
  const [isFormHydrated, setIsFormHydrated] = useState(false);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<"setup" | "audience">("setup");
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [logoBlobUrl, setLogoBlobUrl] = useState<string | null>(null);
  const [bannerBlobUrl, setBannerBlobUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [audiencePreviewPage, setAudiencePreviewPage] = useState(1);
  const themeColorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const textColorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const { getUploadSignedUrl } = useR2Upload();
  const {
    data: campaign,
    isLoading,
    isError,
    error,
  } = useCampaignQuery(campaignId, initialCampaign);
  const { data: businessData } = useCurrentBusiness();
  const { data: segmentsData } = useSegmentsQuery();
  const updateCampaign = useUpdateCampaign(campaignId);

  useEffect(() => {
    if (!pendingLogoFile) {
      setLogoBlobUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingLogoFile);
    setLogoBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingLogoFile]);

  useEffect(() => {
    if (!pendingBannerFile) {
      setBannerBlobUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingBannerFile);
    setBannerBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingBannerFile]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      title: "",
      description: "",
      contactNumber: "",
      rewardType: DEFAULT_REWARD_TYPE,
      rewardValue: getDefaultRewardValue(DEFAULT_REWARD_TYPE),
      offerStatement: buildRewardSentence(
        DEFAULT_REWARD_TYPE,
        getDefaultRewardValue(DEFAULT_REWARD_TYPE),
      ),
      appliesTo: "ENTIRE_PURCHASE",
      maxRedemptionEnabled: false,
      maxRedemptionAmount: null,
      minPurchaseForEarningEnabled: false,
      minPurchaseForEarning: null,
      minPurchaseForRedemptionEnabled: false,
      minPurchaseForRedemption: null,
      instantCashbackRedeemable: false,
      startsAt: "",
      expiresAt: "",
      redemptionLimit: "ONCE",
      termsAndConditions: [...CAMPAIGN_DEFAULT_TERMS],
      themeColor: DEFAULT_THEME_COLOR,
      textColor: DEFAULT_TEXT_COLOR,
      logo: "",
      bannerImage: "",
      status: "DRAFT",
      emailSubject: "",
      whatsappEnabled: false,
      emailEnabled: false,
      targetAudiences: [ALL_CUSTOMERS_AUDIENCE_KEY],
      messageScheduledAt: "",
    },
  });

  const watched = form.watch();
  const selectedAudiences = watched.targetAudiences ?? [];
  const { data: audiencePreviewData } = useAudiencePreview(
    selectedAudiences,
    audiencePreviewPage,
  );
  const audienceCount = audiencePreviewData?.count ?? 0;
  const previewCustomers = audiencePreviewData?.customers ?? [];
  const buildBrowserSafeAssetUrl = useCallback(
    (src: string | null | undefined) => {
      if (!src) return null;
      if (
        src.startsWith("blob:") ||
        src.startsWith("data:") ||
        src.startsWith("http://") ||
        src.startsWith("https://")
      ) {
        return src;
      }
      return `/api/storage/read?src=${encodeURIComponent(src)}`;
    },
    [],
  );
  const resolvedLogoUrl =
    logoBlobUrl ||
    (watched.logo ? buildBrowserSafeAssetUrl(watched.logo) : null);
  const resolvedBannerUrl =
    bannerBlobUrl ||
    (watched.bannerImage
      ? buildBrowserSafeAssetUrl(watched.bannerImage)
      : null);

  useEffect(() => {
    setIsFormHydrated(false);
    setPendingLogoFile(null);
    setPendingBannerFile(null);
  }, [campaignId]);

  useEffect(() => {
    setAudiencePreviewPage(1);
  }, [selectedAudiences.join(",")]);

  useEffect(() => {
    if (!campaign) return;

    const rewardType = normalizeRewardType(campaign.rewardType);

    const extractedValue = extractRewardValueFromStatement(
      rewardType,
      campaign.offerStatement ?? campaign.rewardValue,
    );
    const rawValueCandidate = campaign.rewardValue ?? extractedValue ?? "";
    const rawValue = rewardType === "NO_REWARD" ? "" : rawValueCandidate.trim();

    const autoSentence =
      rewardType === "NO_REWARD"
        ? ""
        : buildRewardSentence(
            rewardType,
            rawValue,
            campaign.maxRedemptionEnabled,
            campaign.maxRedemptionAmount,
          );

    const currentOffer =
      rewardType === "NO_REWARD"
        ? ""
        : (campaign.offerStatement ?? "").trim() ||
          (campaign.rewardValue ? autoSentence : "");

    form.reset({
      title: campaign.title ?? "",
      description: campaign.description ?? "",
      contactNumber: campaign.contactNumber ?? "",
      rewardType,
      rewardValue: rawValue,
      offerStatement: currentOffer,
      appliesTo: (campaign.appliesTo as CampaignAppliesTo) ?? "ENTIRE_PURCHASE",
      maxRedemptionEnabled: campaign.maxRedemptionEnabled ?? false,
      maxRedemptionAmount: campaign.maxRedemptionAmount ?? null,
      minPurchaseForEarningEnabled:
        campaign.minPurchaseForEarningEnabled ?? false,
      minPurchaseForEarning: campaign.minPurchaseForEarning ?? null,
      minPurchaseForRedemptionEnabled:
        campaign.minPurchaseForRedemptionEnabled ?? false,
      minPurchaseForRedemption: campaign.minPurchaseForRedemption ?? null,
      instantCashbackRedeemable: campaign.instantCashbackRedeemable ?? false,
      startsAt: campaign.startsAt
        ? new Date(campaign.startsAt).toISOString().slice(0, 16)
        : "",
      expiresAt: campaign.expiresAt
        ? new Date(campaign.expiresAt).toISOString().slice(0, 16)
        : "",
      redemptionLimit:
        (campaign.redemptionLimit as CampaignRedemptionLimit) ?? "ONCE",
      termsAndConditions:
        (campaign.termsAndConditions?.length ?? 0) > 0
          ? campaign.termsAndConditions
          : [...CAMPAIGN_DEFAULT_TERMS],
      themeColor: campaign.themeColor || DEFAULT_THEME_COLOR,
      textColor: campaign.textColor || DEFAULT_TEXT_COLOR,
      logo: campaign.logo ?? "",
      bannerImage: campaign.bannerImage ?? "",
      status: campaign.status ?? "DRAFT",
      emailSubject: campaign.emailSubject ?? "",
      whatsappEnabled: campaign.whatsappEnabled ?? false,
      emailEnabled: campaign.emailEnabled ?? false,
      targetAudiences:
        (campaign.targetAudiences?.length ?? 0) > 0
          ? campaign.targetAudiences
          : [ALL_CUSTOMERS_AUDIENCE_KEY],
      messageScheduledAt: campaign.messageScheduledAt
        ? new Date(campaign.messageScheduledAt).toISOString().slice(0, 16)
        : "",
    });

    // If server sentence differs from auto-generated, treat as edited.
    setSentenceEdited(
      !!currentOffer && currentOffer.trim() !== autoSentence.trim(),
    );
    setPendingLogoFile(null);
    setPendingBannerFile(null);
    setIsFormHydrated(true);
  }, [campaign, form]);

  useEffect(() => {
    if (isFormHydrated && audienceParam) {
      const keys = audienceParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (keys.length > 0) {
        const current = form.getValues("targetAudiences") || [];
        const combined = Array.from(new Set([...current, ...keys]));
        if (
          JSON.stringify([...combined].sort()) !==
          JSON.stringify([...current].sort())
        ) {
          form.setValue("targetAudiences", combined);
        }
      }
      const url = new URL(window.location.href);
      url.searchParams.delete("audience");
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [isFormHydrated, audienceParam, form, router]);

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      let logoUrl = values.logo?.trim() ? values.logo : null;
      let bannerUrl = values.bannerImage?.trim() ? values.bannerImage : null;

      if (pendingLogoFile) {
        const result = await getUploadSignedUrl(pendingLogoFile, {
          type: "campaign_logo",
          campaignId,
        });
        const uploadRes = await fetch(result.uploadUrl, {
          method: "PUT",
          headers: {
            "content-type": pendingLogoFile.type || "application/octet-stream",
          },
          body: pendingLogoFile,
        });
        if (!uploadRes.ok) {
          throw new Error("Failed to upload logo");
        }
        logoUrl = result.key;
      }
      if (pendingBannerFile) {
        const result = await getUploadSignedUrl(pendingBannerFile, {
          type: "campaign_banner",
          campaignId,
        });
        const uploadRes = await fetch(result.uploadUrl, {
          method: "PUT",
          headers: {
            "content-type":
              pendingBannerFile.type || "application/octet-stream",
          },
          body: pendingBannerFile,
        });
        if (!uploadRes.ok) {
          throw new Error("Failed to upload banner");
        }
        bannerUrl = result.key;
      }

      await updateCampaign.mutateAsync({
        title: values.title || null,
        description: values.description || null,
        contactNumber: values.contactNumber || null,
        rewardType: values.rewardType as CampaignRewardType,
        rewardValue: values.rewardValue || null,
        offerStatement: values.offerStatement || null,
        appliesTo: values.appliesTo as CampaignAppliesTo,
        maxRedemptionEnabled: values.maxRedemptionEnabled,
        maxRedemptionAmount: values.maxRedemptionEnabled
          ? (values.maxRedemptionAmount ?? null)
          : null,
        minPurchaseForEarningEnabled: values.minPurchaseForEarningEnabled,
        minPurchaseForEarning: values.minPurchaseForEarningEnabled
          ? (values.minPurchaseForEarning ?? null)
          : null,
        minPurchaseForRedemptionEnabled: values.minPurchaseForRedemptionEnabled,
        minPurchaseForRedemption: values.minPurchaseForRedemptionEnabled
          ? (values.minPurchaseForRedemption ?? null)
          : null,
        instantCashbackRedeemable: values.instantCashbackRedeemable,
        startsAt: values.startsAt || undefined,
        expiresAt: values.expiresAt || undefined,
        redemptionLimit: values.redemptionLimit as CampaignRedemptionLimit,
        termsAndConditions: values.termsAndConditions,
        themeColor: values.themeColor || null,
        textColor: values.textColor || null,
        logo: logoUrl,
        bannerImage: bannerUrl,
        status: values.status,
        emailSubject: values.emailSubject || null,
        whatsappEnabled: values.whatsappEnabled,
        emailEnabled: values.emailEnabled,
        targetAudiences: (values.targetAudiences ?? []).filter(
          (key) => key !== ALL_CUSTOMERS_AUDIENCE_KEY,
        ),
        messageScheduledAt: values.messageScheduledAt || null,
      });

      setPendingLogoFile(null);
      setPendingBannerFile(null);
      form.setValue("logo", logoUrl ?? "");
      form.setValue("bannerImage", bannerUrl ?? "");

      toast.success("Campaign saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  });

  const onFieldClick = useCallback(
    (fieldName: string) => {
      try {
        form.setFocus(fieldName as keyof FormValues);
      } catch (e) {
        // Ignore if focus fails
      }
      setTimeout(() => {
        const el =
          document.querySelector(`[name="${fieldName}"]`) ||
          document.getElementById(fieldName);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          const container =
            el.closest(".space-y-2, .space-y-4, .rounded-lg, .border") ||
            el.parentElement;
          if (container) {
            container.classList.add(
              "ring-2",
              "ring-primary",
              "ring-offset-2",
              "transition-all",
            );
            setTimeout(() => {
              container.classList.remove(
                "ring-2",
                "ring-primary",
                "ring-offset-2",
              );
            }, 1500);
          }
        }
      }, 50);
    },
    [form],
  );

  const chooseBrandingImage = useCallback((kind: "logo" | "banner") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file (JPG, PNG, GIF, WebP)");
        return;
      }
      const maxBytes = 10 * 1024 * 1024;
      if (file.size > maxBytes) {
        toast.error("File too large. Max 10MB.");
        return;
      }
      if (kind === "logo") {
        setPendingLogoFile(file);
      } else {
        setPendingBannerFile(file);
      }
    };
    input.click();
  }, []);

  const debouncedColorUpdate = useCallback(
    (fieldName: "themeColor" | "textColor", value: string) => {
      const debounceRef =
        fieldName === "themeColor"
          ? themeColorDebounceRef
          : textColorDebounceRef;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        form.setValue(fieldName, value, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }, 120);
    },
    [form],
  );

  useEffect(() => {
    return () => {
      if (themeColorDebounceRef.current)
        clearTimeout(themeColorDebounceRef.current);
      if (textColorDebounceRef.current)
        clearTimeout(textColorDebounceRef.current);
    };
  }, []);

  // Error state
  if (isError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-destructive text-sm font-medium">
          {error?.message ?? "Failed to load campaign"}
        </p>
        <Button variant="outline" onClick={() => router.push("/campaigns")}>
          Back to campaigns
        </Button>
      </div>
    );
  }

  // Loading skeleton
  if (isLoading || !campaign || !isFormHydrated) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <Skeleton className="min-h-[420px] rounded-2xl" />
        </div>
      </div>
    );
  }

  // Preview data derived from live form state
  const previewData = {
    title: watched.title ?? null,
    description: watched.description ?? null,
    contactNumber: watched.contactNumber ?? null,
    rewardValue: watched.offerStatement ?? null,
    expiresAt: watched.expiresAt ?? null,
    termsAndConditions: watched.termsAndConditions ?? [],
    maxRedemptionEnabled: watched.maxRedemptionEnabled ?? false,
    maxRedemptionAmount: watched.maxRedemptionAmount ?? null,
    minPurchaseForEarningEnabled: watched.minPurchaseForEarningEnabled ?? false,
    minPurchaseForEarning: watched.minPurchaseForEarning ?? null,
    minPurchaseForRedemptionEnabled:
      watched.minPurchaseForRedemptionEnabled ?? false,
    minPurchaseForRedemption: watched.minPurchaseForRedemption ?? null,
    instantCashbackRedeemable: watched.instantCashbackRedeemable ?? false,
    redemptionLimit: watched.redemptionLimit ?? "ONCE",
  };

  const previewBranding = {
    logo: resolvedLogoUrl,
    themeColor: watched.themeColor || DEFAULT_THEME_COLOR,
    textColor: watched.textColor || DEFAULT_TEXT_COLOR,
    bannerImage: resolvedBannerUrl,
  };
  return (
    <div className="flex min-h-screen flex-col">
      {/* ====== TOP BAR ====== */}
      <div className="bg-background sticky top-0 z-40 border-b">
        <ScaffoldContainer className="flex h-14 items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground -ml-2 gap-1.5"
            onClick={() => router.push("/campaigns")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to campaigns
          </Button>

          <div className="flex items-center gap-2">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-8 w-[120px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {CAMPAIGN_STATUS_LABELS[s] ?? s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Download className="h-3.5 w-3.5" />}
              onClick={() => {
                if (exportPreviewRef.current) {
                  downloadCampaignCardAsImage(
                    exportPreviewRef.current,
                    (watched.title || "campaign-card").replace(/\s+/g, "-"),
                  ).catch(() => toast.error("Failed to download image"));
                }
              }}
            >
              Download
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onSubmit}
              loading={isSaving || updateCampaign.isPending}
            >
              Save
            </Button>
          </div>
        </ScaffoldContainer>
      </div>

      {/* ====== MAIN CONTENT ====== */}
      <ScaffoldContainer className="flex-1 py-8">
        <Form {...form}>
          <div className="pointer-events-none fixed top-0 left-[-9999px] z-[-1]">
            <CampaignPreview
              ref={exportPreviewRef}
              data={previewData}
              branding={previewBranding}
              businessName={businessData?.business?.name}
              className="w-[360px] max-w-none shadow-none"
              templateIndex={currentPreviewIndex}
              showControls={false}
            />
          </div>
          <GooeyTabs
            gooeyId="campaign-editor-gooey"
            tabs={CAMPAIGN_EDITOR_TABS.map((tab) => ({ ...tab }))}
            activeTab={activeTab}
            onTabChange={(path) => setActiveTab(path as "setup" | "audience")}
            fullBleed={false}
            contentClassName="px-0 pt-4 pb-0"
            stickySafeAnimation
          >
            {activeTab === "setup" ? (
              <form
                onSubmit={onSubmit}
                className="grid items-start gap-10 lg:grid-cols-[1fr_380px]"
              >
                {/* LEFT — Form fields */}
                <div className="space-y-8">
                  {/* ---- Campaign Content ---- */}
                  <Section
                    title="What is the Campaign about?"
                    description="Give your campaign a title and description."
                  >
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. The Perfect Date Offer"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Good food sets the mood. Celebrate Valentine's Day with romantic flavours and enjoy 10% off on your special dinner."
                              className="min-h-[90px] resize-y"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Section>

                  {/* ---- Reward & Offer ---- */}
                  <Section
                    title="Reward & Offer"
                    description="Configure the discount or reward customers receive."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="rewardType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reward Type</FormLabel>
                            <Select
                              value={normalizeRewardType(field.value)}
                              onValueChange={(val) => {
                                const nextRewardType = normalizeRewardType(val);
                                const nextRewardValue =
                                  nextRewardType === "NO_REWARD"
                                    ? ""
                                    : getDefaultRewardValue(nextRewardType);

                                field.onChange(nextRewardType);
                                form.setValue("rewardValue", nextRewardValue);
                                setSentenceEdited(false);
                                form.setValue(
                                  "offerStatement",
                                  nextRewardType === "NO_REWARD"
                                    ? ""
                                    : buildRewardSentence(
                                        nextRewardType,
                                        nextRewardValue,
                                        watched.maxRedemptionEnabled,
                                        watched.maxRedemptionAmount,
                                      ),
                                );
                              }}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select reward type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CAMPAIGN_REWARD_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {CAMPAIGN_REWARD_TYPE_LABELS[type] ?? type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {watched.rewardType !== "NO_REWARD" ? (
                        <div className="space-y-2">
                          <FormLabel>
                            {watched.rewardType === "FREE_ITEM"
                              ? "Free item name"
                              : "Discount amount"}
                          </FormLabel>
                          <FormField
                            control={form.control}
                            name="rewardValue"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="text"
                                    placeholder={
                                      CAMPAIGN_REWARD_PLACEHOLDERS[
                                        watched.rewardType
                                      ] ?? "..."
                                    }
                                    {...field}
                                    value={field.value ?? ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      field.onChange(val);
                                      if (!sentenceEdited) {
                                        form.setValue(
                                          "offerStatement",
                                          buildRewardSentence(
                                            watched.rewardType,
                                            val,
                                            watched.maxRedemptionEnabled,
                                            watched.maxRedemptionAmount,
                                          ),
                                        );
                                      }
                                    }}
                                    onBlur={(e) => {
                                      if (watched.rewardType === "NO_REWARD")
                                        return;
                                      if (e.target.value.trim()) return;

                                      const fallbackValue =
                                        getDefaultRewardValue(
                                          normalizeRewardType(
                                            watched.rewardType,
                                          ),
                                        );
                                      form.setValue(
                                        "rewardValue",
                                        fallbackValue,
                                      );
                                      if (!sentenceEdited) {
                                        form.setValue(
                                          "offerStatement",
                                          buildRewardSentence(
                                            watched.rewardType,
                                            fallbackValue,
                                            watched.maxRedemptionEnabled,
                                            watched.maxRedemptionAmount,
                                          ),
                                        );
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ) : (
                        <div />
                      )}
                    </div>

                    {watched.rewardType !== "NO_REWARD" && (
                      <>
                        {/* Auto-generated sentence — editable */}
                        <FormField
                          control={form.control}
                          name="offerStatement"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel>Offer sentence</FormLabel>
                                {sentenceEdited && (
                                  <button
                                    type="button"
                                    className="text-primary text-xs font-medium hover:underline"
                                    onClick={() => {
                                      setSentenceEdited(false);
                                      field.onChange(
                                        buildRewardSentence(
                                          watched.rewardType,
                                          watched.rewardValue ?? "",
                                          watched.maxRedemptionEnabled,
                                          watched.maxRedemptionAmount,
                                        ),
                                      );
                                    }}
                                  >
                                    Reset to auto
                                  </button>
                                )}
                              </div>
                              <FormControl>
                                <Textarea
                                  placeholder="This sentence appears on the campaign card..."
                                  className="min-h-[60px] resize-y"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                    setSentenceEdited(true);
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Auto-generated from your discount. Edit freely
                                to customise the wording.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {/* Fields below only apply to discount-type rewards */}
                    {(watched.rewardType === "PERCENTAGE_DISCOUNT" ||
                      watched.rewardType === "CASH_DISCOUNT") && (
                      <>
                        <FormField
                          control={form.control}
                          name="appliesTo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Applies to</FormLabel>
                              <div className="flex gap-0 overflow-hidden rounded-lg border">
                                {CAMPAIGN_APPLIES_TO.map((v) => (
                                  <button
                                    key={v}
                                    type="button"
                                    className={cn(
                                      "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
                                      field.value === v
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted",
                                    )}
                                    onClick={() => field.onChange(v)}
                                  >
                                    {CAMPAIGN_APPLIES_TO_LABELS[v]}
                                  </button>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="maxRedemptionEnabled"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                              <FormLabel className="font-normal">
                                Set maximum amount customer can redeem
                              </FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    if (!sentenceEdited) {
                                      form.setValue(
                                        "offerStatement",
                                        buildRewardSentence(
                                          watched.rewardType,
                                          watched.rewardValue ?? "",
                                          checked,
                                          watched.maxRedemptionAmount,
                                        ),
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {watched.maxRedemptionEnabled && (
                          <FormField
                            control={form.control}
                            name="maxRedemptionAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max redemption amount</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    placeholder="e.g. 500"
                                    {...field}
                                    value={field.value ?? ""}
                                    onChange={(e) => {
                                      const val =
                                        e.target.value === ""
                                          ? null
                                          : Number(e.target.value);
                                      field.onChange(val);
                                      if (!sentenceEdited) {
                                        form.setValue(
                                          "offerStatement",
                                          buildRewardSentence(
                                            watched.rewardType,
                                            watched.rewardValue ?? "",
                                            watched.maxRedemptionEnabled,
                                            val,
                                          ),
                                        );
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="instantCashbackRedeemable"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="font-normal">
                                  Instant cashback redeemable
                                </FormLabel>
                                <FormDescription>
                                  Allow cashback to be redeemed on the same bill
                                  instantly
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {/* Min purchase for earning — all reward types except NO_REWARD */}
                    {watched.rewardType !== "NO_REWARD" && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="minPurchaseForEarningEnabled"
                          render={({ field }) => (
                            <FormItem className="h-full rounded-lg border p-4">
                              <div className="flex items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="font-normal">
                                    Minimum purchase to earn reward
                                  </FormLabel>
                                  <FormDescription>
                                    Customer must spend at least this amount to
                                    earn the reward
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </div>

                              {field.value && (
                                <div className="mt-4 border-t pt-4">
                                  <FormField
                                    control={form.control}
                                    name="minPurchaseForEarning"
                                    render={({ field: amountField }) => (
                                      <FormItem>
                                        <FormLabel>
                                          Minimum purchase amount (earning)
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            min={0}
                                            placeholder="e.g. 500"
                                            {...amountField}
                                            value={amountField.value ?? ""}
                                            onChange={(e) =>
                                              amountField.onChange(
                                                e.target.value === ""
                                                  ? null
                                                  : Number(e.target.value),
                                              )
                                            }
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              )}
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="minPurchaseForRedemptionEnabled"
                          render={({ field }) => (
                            <FormItem className="h-full rounded-lg border p-4">
                              <div className="flex items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="font-normal">
                                    Minimum purchase to redeem reward
                                  </FormLabel>
                                  <FormDescription>
                                    Customer must spend at least this amount to
                                    redeem accumulated cashback
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </div>

                              {field.value && (
                                <div className="mt-4 border-t pt-4">
                                  <FormField
                                    control={form.control}
                                    name="minPurchaseForRedemption"
                                    render={({ field: amountField }) => (
                                      <FormItem>
                                        <FormLabel>
                                          Minimum purchase amount (redemption)
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            min={0}
                                            placeholder="e.g. 1000"
                                            {...amountField}
                                            value={amountField.value ?? ""}
                                            onChange={(e) =>
                                              amountField.onChange(
                                                e.target.value === ""
                                                  ? null
                                                  : Number(e.target.value),
                                              )
                                            }
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              )}
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </Section>

                  {/* ---- Terms & Conditions ---- */}
                  <Section
                    title="Terms of your campaign"
                    description="Set expiry, redemption limits, and terms."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="startsAt"
                        render={({ field }) => (
                          <FormItem className="flex h-full flex-col">
                            <FormLabel>Campaign Starts on</FormLabel>
                            <FormControl>
                              <DateTimeSelector
                                id="campaign-starts-at"
                                value={field.value ?? ""}
                                onChange={(nextValue) => {
                                  field.onChange(nextValue);
                                  void form.trigger("expiresAt");
                                }}
                                placeholder="Select start date and time"
                              />
                            </FormControl>
                            <FormMessage className="mt-2 min-h-6" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="expiresAt"
                        render={({ field }) => (
                          <FormItem className="flex h-full flex-col">
                            <FormLabel>Campaign Expires on</FormLabel>
                            <FormControl>
                              <DateTimeSelector
                                id="campaign-expires-at"
                                value={field.value ?? ""}
                                onChange={(nextValue) => {
                                  field.onChange(nextValue);
                                  void form.trigger("expiresAt");
                                }}
                                placeholder="Select expiry date and time"
                              />
                            </FormControl>
                            <FormMessage className="mt-2 min-h-6" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="contactNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. 9707840311"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="redemptionLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Redemption Per Customer</FormLabel>
                            <div className="flex gap-0 overflow-hidden rounded-lg border">
                              {CAMPAIGN_REDEMPTION_LIMITS.map((v) => (
                                <button
                                  key={v}
                                  type="button"
                                  className={cn(
                                    "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
                                    field.value === v
                                      ? "bg-primary text-primary-foreground"
                                      : "hover:bg-muted",
                                  )}
                                  onClick={() => field.onChange(v)}
                                >
                                  {CAMPAIGN_REDEMPTION_LABELS[v]}
                                </button>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div id="termsAndConditions">
                      <TermsConditionsEditor
                        presetLabels={[...CAMPAIGN_TERMS_OPTIONS]}
                      />
                    </div>
                  </Section>

                  {/* ---- Campaign Creative ---- */}
                  <Section
                    title="Review Campaign Creative"
                    description="Customise colors, logo, and banner image."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem id="logo">
                            <FormLabel>Logo</FormLabel>
                            <FormDescription>
                              Recommended size 512 x 512 px in JPG, GIF or PNG
                              format up to max size of 10MB.
                            </FormDescription>
                            <FormControl>
                              <BrandingImageUploadControl
                                displayUrl={resolvedLogoUrl}
                                onChooseClick={() =>
                                  chooseBrandingImage("logo")
                                }
                                onRemoveClick={() => {
                                  setPendingLogoFile(null);
                                  field.onChange("");
                                }}
                                chooseDisabled={isSaving}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bannerImage"
                        render={({ field }) => (
                          <FormItem id="bannerImage">
                            <FormLabel>Banner Image</FormLabel>
                            <FormDescription>
                              Recommended size 512 x 512 px in JPG, GIF or PNG
                              format up to max size of 5MB.
                            </FormDescription>
                            <FormControl>
                              <BrandingImageUploadControl
                                displayUrl={resolvedBannerUrl}
                                onChooseClick={() =>
                                  chooseBrandingImage("banner")
                                }
                                onRemoveClick={() => {
                                  setPendingBannerFile(null);
                                  field.onChange("");
                                }}
                                chooseDisabled={isSaving}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Color pickers */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="themeColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Theme color</FormLabel>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 shadow-sm"
                                style={{
                                  backgroundColor:
                                    field.value || DEFAULT_THEME_COLOR,
                                }}
                                onClick={() => {
                                  const input =
                                    document.getElementById(
                                      "theme-color-picker",
                                    );
                                  input?.click();
                                }}
                              >
                                <input
                                  id="theme-color-picker"
                                  type="color"
                                  className="absolute inset-0 cursor-pointer opacity-0"
                                  value={field.value || DEFAULT_THEME_COLOR}
                                  onChange={(e) =>
                                    debouncedColorUpdate(
                                      "themeColor",
                                      e.target.value,
                                    )
                                  }
                                />
                              </button>
                              <FormControl>
                                <Input
                                  placeholder="#7F4899"
                                  className="font-mono text-sm"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="textColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Text color</FormLabel>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 shadow-sm"
                                style={{
                                  backgroundColor:
                                    field.value || DEFAULT_TEXT_COLOR,
                                }}
                                onClick={() => {
                                  const input =
                                    document.getElementById(
                                      "text-color-picker",
                                    );
                                  input?.click();
                                }}
                              >
                                <input
                                  id="text-color-picker"
                                  type="color"
                                  className="absolute inset-0 cursor-pointer opacity-0"
                                  value={field.value || DEFAULT_TEXT_COLOR}
                                  onChange={(e) =>
                                    debouncedColorUpdate(
                                      "textColor",
                                      e.target.value,
                                    )
                                  }
                                />
                              </button>
                              <FormControl>
                                <Input
                                  placeholder="#ffffff"
                                  className="font-mono text-sm"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Section>

                  {/* ---- Channels & Delivery ---- */}
                  <Section
                    title="Channels & Delivery"
                    description="How and when this campaign is sent."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="whatsappEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                            <div>
                              <FormLabel className="text-sm">
                                WhatsApp
                              </FormLabel>
                              <FormDescription>
                                Send campaign via WhatsApp
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="emailEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                            <div>
                              <FormLabel className="text-sm">Email</FormLabel>
                              <FormDescription>
                                Send campaign via email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {watched.emailEnabled && (
                      <FormField
                        control={form.control}
                        name="emailSubject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email subject</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Subject line for email campaign"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {(watched.whatsappEnabled || watched.emailEnabled) && (
                      <FormField
                        control={form.control}
                        name="messageScheduledAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Schedule message delivery</FormLabel>
                            <FormControl>
                              <DateTimeSelector
                                id="campaign-message-scheduled-at"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                placeholder="Select message send date and time"
                              />
                            </FormControl>
                            <FormDescription>
                              When to send campaign messages. Leave empty to
                              send immediately on activation.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <AudienceField control={form.control} />
                  </Section>
                </div>

                {/* RIGHT — Sticky Preview */}
                <div className="lg:sticky lg:top-20 lg:self-start">
                  <div className="flex justify-center overflow-x-auto pb-2">
                    <div className="mx-auto w-full max-w-[360px]">
                      <CampaignPreview
                        data={previewData}
                        branding={previewBranding}
                        businessName={businessData?.business?.name}
                        className="w-[360px] max-w-none shadow-2xl"
                        onFieldClick={onFieldClick}
                        templateIndex={currentPreviewIndex}
                        onTemplateIndexChange={setCurrentPreviewIndex}
                      />
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <CampaignScheduledMessagesSection
                audienceCount={audienceCount}
                audienceKeys={selectedAudiences}
                customers={previewCustomers}
                page={audiencePreviewData?.page ?? audiencePreviewPage}
                perPage={audiencePreviewData?.perPage ?? 10}
                onPageChange={setAudiencePreviewPage}
                whatsappEnabled={!!watched.whatsappEnabled}
                emailEnabled={!!watched.emailEnabled}
                scheduledAt={watched.messageScheduledAt || null}
              />
            )}
          </GooeyTabs>
        </Form>
      </ScaffoldContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audience multi-select field (segments + feedback ratings)
// ---------------------------------------------------------------------------

const FEEDBACK_AUDIENCES = [
  { value: "feedback:rating_1", label: "1-star feedback" },
  { value: "feedback:rating_2", label: "2-star feedback" },
  { value: "feedback:rating_3", label: "3-star feedback" },
  { value: "feedback:rating_4", label: "4-star feedback" },
  { value: "feedback:rating_5", label: "5-star feedback" },
];
const ALL_CUSTOMERS_AUDIENCE_KEY = "all:customers";
const ALL_CUSTOMERS_AUDIENCE_LABEL = "ALL customers";

type AudiencePreviewCustomer = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
};

function useAudiencePreview(keys: string[], page = 1, perPage = 10) {
  const keyStr = [...keys].sort().join(",");
  return useQuery<{
    count: number;
    page: number;
    perPage: number;
    customers: AudiencePreviewCustomer[];
  }>({
    queryKey: ["audience-preview", keyStr, page, perPage],
    queryFn: () =>
      fetcher<{
        count: number;
        page: number;
        perPage: number;
        customers: AudiencePreviewCustomer[];
      }>(
        `/api/audiences/preview?key=${encodeURIComponent(keyStr)}&page=${page}&perPage=${perPage}`,
      ),
    placeholderData: (previousData) => previousData,
    staleTime: 15_000,
  });
}

function AudienceField({ control }: { control: Control<FormValues> }) {
  const [open, setOpen] = useState(false);
  const { data } = useSegmentsQuery();
  const segmentOptions = (data?.items ?? []).map((s) => ({
    value: `segment:${s.slug}`,
    label: s.name,
  }));

  const allOptions = [
    { value: ALL_CUSTOMERS_AUDIENCE_KEY, label: ALL_CUSTOMERS_AUDIENCE_LABEL },
    ...segmentOptions,
    ...FEEDBACK_AUDIENCES,
  ];

  const watchedAudiences = useWatch({ control, name: "targetAudiences" }) ?? [];
  const { data: previewData } = useAudiencePreview(watchedAudiences);

  return (
    <FormField
      control={control}
      name="targetAudiences"
      render={({ field }) => {
        const selected = (field.value ?? []).filter(
          (key: string) => key !== ALL_CUSTOMERS_AUDIENCE_KEY,
        );
        const selectedSet = new Set(selected);
        const onToggle = (key: string) => {
          if (key === ALL_CUSTOMERS_AUDIENCE_KEY) {
            field.onChange([ALL_CUSTOMERS_AUDIENCE_KEY]);
            return;
          }
          const nextBase = selected.filter(
            (x: string) => x !== ALL_CUSTOMERS_AUDIENCE_KEY,
          );
          const next = selectedSet.has(key)
            ? nextBase.filter((x: string) => x !== key)
            : [...nextBase, key];
          field.onChange(next);
        };
        const onClear = () => field.onChange([ALL_CUSTOMERS_AUDIENCE_KEY]);
        const labelFor = (key: string) =>
          allOptions.find((o) => o.value === key)?.label ?? key;

        return (
          <FormItem>
            <FormLabel>Target audience</FormLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <FormControl>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start font-normal"
                    icon={
                      selectedSet.size > 0 ? (
                        <div
                          role="button"
                          tabIndex={0}
                          className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClear();
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </div>
                      ) : (
                        <PlusCircle className="h-4 w-4" />
                      )
                    }
                  >
                    {selectedSet.size > 0 ? (
                      <>
                        <span className="truncate">
                          {selectedSet.size} audience
                          {selectedSet.size !== 1 ? "s" : ""} selected
                        </span>
                        <div className="ml-auto flex items-center gap-1">
                          {selectedSet.size <= 2 ? (
                            selected.map((key) => (
                              <Badge
                                key={key}
                                variant="secondary"
                                className="rounded-sm px-1 font-normal"
                              >
                                {labelFor(key)}
                              </Badge>
                            ))
                          ) : (
                            <Badge
                              variant="secondary"
                              className="rounded-sm px-1 font-normal"
                            >
                              {selectedSet.size} selected
                            </Badge>
                          )}
                        </div>
                      </>
                    ) : (
                      ALL_CUSTOMERS_AUDIENCE_LABEL
                    )}
                  </Button>
                </PopoverTrigger>
              </FormControl>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Search audiences..." />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty>No audiences found.</CommandEmpty>
                    <CommandGroup heading="Default">
                      <CommandItem
                        key={ALL_CUSTOMERS_AUDIENCE_KEY}
                        onSelect={() => onToggle(ALL_CUSTOMERS_AUDIENCE_KEY)}
                      >
                        <div
                          className={cn(
                            "mr-2 flex size-4 shrink-0 items-center justify-center rounded-[4px]",
                            selectedSet.size === 0
                              ? "bg-primary"
                              : "bg-muted [&_svg]:invisible",
                          )}
                        >
                          <Check
                            className={cn(
                              "h-3 w-3 stroke-[2.5]",
                              selectedSet.size === 0 && "text-white",
                            )}
                          />
                        </div>
                        {ALL_CUSTOMERS_AUDIENCE_LABEL}
                      </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    {segmentOptions.length > 0 && (
                      <CommandGroup heading="Customer Segments">
                        {segmentOptions.map((opt) => {
                          const isSelected = selectedSet.has(opt.value);
                          return (
                            <CommandItem
                              key={opt.value}
                              onSelect={() => onToggle(opt.value)}
                            >
                              <div
                                className={cn(
                                  "mr-2 flex size-4 shrink-0 items-center justify-center rounded-[4px]",
                                  isSelected
                                    ? "bg-primary"
                                    : "bg-muted [&_svg]:invisible",
                                )}
                              >
                                <Check
                                  className={cn(
                                    "h-3 w-3 stroke-[2.5]",
                                    isSelected && "text-white",
                                  )}
                                />
                              </div>
                              {opt.label}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    )}
                    <CommandSeparator />
                    <CommandGroup heading="Feedback Ratings">
                      {FEEDBACK_AUDIENCES.map((opt) => {
                        const isSelected = selectedSet.has(opt.value);
                        return (
                          <CommandItem
                            key={opt.value}
                            onSelect={() => onToggle(opt.value)}
                          >
                            <div
                              className={cn(
                                "mr-2 flex size-4 shrink-0 items-center justify-center rounded-[4px]",
                                isSelected
                                  ? "bg-primary"
                                  : "bg-muted [&_svg]:invisible",
                              )}
                            >
                              <Check
                                className={cn(
                                  "h-3 w-3 stroke-[2.5]",
                                  isSelected && "text-white",
                                )}
                              />
                            </div>
                            {opt.label}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                    {selectedSet.size > 0 && (
                      <>
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem
                            onSelect={onClear}
                            className="justify-center"
                          >
                            Clear selection
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormDescription>
              Target specific customer groups. Leave empty to target all
              customers.
              {previewData != null && (
                <span className="text-foreground ml-1 font-medium">
                  ({previewData.count.toLocaleString()} customer
                  {previewData.count !== 1 ? "s" : ""})
                </span>
              )}
            </FormDescription>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function formatDateTimeDisplay(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  return `${datePart}, ${timePart}`;
}

function DateTimeSelector({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const displayValue = formatDateTimeDisplay(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    try {
      (
        input as HTMLInputElement & {
          showPicker?: () => void;
        }
      ).showPicker?.();
    } catch {
      const fallbackInput = inputRef.current;
      if (!fallbackInput) return;
      fallbackInput.focus();
      fallbackInput.click();
    }
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={openPicker}
        className="border-input bg-background flex h-12 w-full items-center justify-between rounded-lg border px-4 text-left"
      >
        <span
          className={cn(
            "truncate text-base",
            displayValue ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {displayValue || placeholder}
        </span>
        <CalendarDays className="text-muted-foreground ml-4 h-5 w-5 shrink-0" />
      </button>
      <input
        ref={inputRef}
        id={id}
        type="datetime-local"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0 rounded-lg border-0 p-2">
      <div className="mb-3 px-0 pt-0.5 pl-3">
        <h3 className="text-base leading-none font-semibold">{title}</h3>
        {description && (
          <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>
        )}
      </div>
      <div className="border-border/45 bg-background/55 overflow-hidden rounded-lg border px-5 py-4">
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
