"use client";

import { CampaignPreview } from "@/components/campaigns/CampaignPreview";
import { TermsConditionsEditor } from "@/components/common/form-sections";
import { ScaffoldContainer } from "@/components/layouts";
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
  Check,
  Download,
  ImagePlus,
  PlusCircle,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Control, Resolver } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const formSchema = z.object({
  title: z.string().max(500).trim().optional().nullable(),
  description: z.string().max(2000).trim().optional().nullable(),
  contactNumber: z.string().max(20).trim().optional().nullable(),
  rewardType: z.enum(CAMPAIGN_REWARD_TYPES as unknown as [string, ...string[]]),
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
  const previewRef = useRef<HTMLDivElement>(null);
  const [sentenceEdited, setSentenceEdited] = useState(false);
  const [isFormHydrated, setIsFormHydrated] = useState(false);
  const {
    data: campaign,
    isLoading,
    isError,
    error,
  } = useCampaignQuery(campaignId, initialCampaign);
  const { data: businessData } = useCurrentBusiness();
  const { data: segmentsData } = useSegmentsQuery();
  const updateCampaign = useUpdateCampaign(campaignId);

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
      targetAudiences: [],
      messageScheduledAt: "",
    },
  });

  const watched = form.watch();

  useEffect(() => {
    setIsFormHydrated(false);
  }, [campaignId]);

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
      targetAudiences: campaign.targetAudiences ?? [],
      messageScheduledAt: campaign.messageScheduledAt
        ? new Date(campaign.messageScheduledAt).toISOString().slice(0, 16)
        : "",
    });

    // If server sentence differs from auto-generated, treat as edited.
    setSentenceEdited(
      !!currentOffer && currentOffer.trim() !== autoSentence.trim(),
    );
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
    try {
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
        logo: values.logo || null,
        bannerImage: values.bannerImage || null,
        status: values.status,
        emailSubject: values.emailSubject || null,
        whatsappEnabled: values.whatsappEnabled,
        emailEnabled: values.emailEnabled,
        targetAudiences: values.targetAudiences ?? [],
        messageScheduledAt: values.messageScheduledAt || null,
      });
      toast.success("Campaign saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
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
    logo: watched.logo || null,
    themeColor: watched.themeColor || DEFAULT_THEME_COLOR,
    textColor: watched.textColor || DEFAULT_TEXT_COLOR,
    bannerImage: watched.bannerImage || null,
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* ====== TOP BAR ====== */}
      <div className="bg-background sticky top-0 z-10 border-b">
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
                if (previewRef.current) {
                  downloadCampaignCardAsImage(
                    previewRef.current,
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
              loading={updateCampaign.isPending}
            >
              Save
            </Button>
          </div>
        </ScaffoldContainer>
      </div>

      {/* ====== MAIN CONTENT ====== */}
      <ScaffoldContainer className="flex-1 py-8">
        <Form {...form}>
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
                          <SelectTrigger>
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

                {watched.rewardType !== "NO_REWARD" && (
                  <>
                    {/* Primary discount amount input */}
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

                                  const fallbackValue = getDefaultRewardValue(
                                    normalizeRewardType(watched.rewardType),
                                  );
                                  form.setValue("rewardValue", fallbackValue);
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
                            Auto-generated from your discount. Edit freely to
                            customise the wording.
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
                  <>
                    <FormField
                      control={form.control}
                      name="minPurchaseForEarningEnabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="font-normal">
                              Minimum purchase to earn reward
                            </FormLabel>
                            <FormDescription>
                              Customer must spend at least this amount to earn
                              the reward
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

                    {watched.minPurchaseForEarningEnabled && (
                      <FormField
                        control={form.control}
                        name="minPurchaseForEarning"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Minimum purchase amount (earning)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                placeholder="e.g. 500"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
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
                    )}

                    <FormField
                      control={form.control}
                      name="minPurchaseForRedemptionEnabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="font-normal">
                              Minimum purchase to redeem reward
                            </FormLabel>
                            <FormDescription>
                              Customer must spend at least this amount to redeem
                              accumulated cashback
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

                    {watched.minPurchaseForRedemptionEnabled && (
                      <FormField
                        control={form.control}
                        name="minPurchaseForRedemption"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Minimum purchase amount (redemption)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                placeholder="e.g. 1000"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
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
                    )}
                  </>
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
                      <FormItem>
                        <FormLabel>Campaign Starts on</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
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
                    name="expiresAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Expires on</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                <div id="termsAndConditions" className="rounded-lg border p-0">
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
                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem id="logo">
                      <FormLabel>Logo</FormLabel>
                      <FormDescription>
                        Recommended size 512 x 512 px in JPG, GIF or PNG format
                        up to max size of 10MB.
                      </FormDescription>
                      {field.value ? (
                        <div className="relative inline-block">
                          <Image
                            src={field.value}
                            alt="Logo preview"
                            width={80}
                            height={80}
                            className="h-20 w-20 rounded-full border object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => field.onChange("")}
                            className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full shadow"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <ImageUploadButton
                          onFile={(dataUrl) => field.onChange(dataUrl)}
                          label="Upload your logo"
                        />
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                                document.getElementById("theme-color-picker");
                              input?.click();
                            }}
                          >
                            <input
                              id="theme-color-picker"
                              type="color"
                              className="absolute inset-0 cursor-pointer opacity-0"
                              value={field.value || DEFAULT_THEME_COLOR}
                              onChange={(e) => field.onChange(e.target.value)}
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
                                document.getElementById("text-color-picker");
                              input?.click();
                            }}
                          >
                            <input
                              id="text-color-picker"
                              type="color"
                              className="absolute inset-0 cursor-pointer opacity-0"
                              value={field.value || DEFAULT_TEXT_COLOR}
                              onChange={(e) => field.onChange(e.target.value)}
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

                <FormField
                  control={form.control}
                  name="bannerImage"
                  render={({ field }) => (
                    <FormItem id="bannerImage">
                      <FormLabel>Banner Image</FormLabel>
                      <FormDescription>
                        Recommended size 512 x 512 px in JPG, GIF or PNG format
                        up to max size of 5MB.
                      </FormDescription>
                      {field.value ? (
                        <div className="relative">
                          <Image
                            src={field.value}
                            alt="Banner preview"
                            width={1200}
                            height={320}
                            className="h-32 w-full rounded-lg border object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => field.onChange("")}
                            className="bg-destructive text-destructive-foreground absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full shadow"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <ImageUploadButton
                          onFile={(dataUrl) => field.onChange(dataUrl)}
                          label="Upload Your Own"
                          icon="image"
                        />
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Section>

              {/* ---- Channels & Delivery ---- */}
              <Section
                title="Channels & Delivery"
                description="How and when this campaign is sent."
              >
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="whatsappEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                        <div>
                          <FormLabel className="text-sm">WhatsApp</FormLabel>
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
                          <Input
                            type="datetime-local"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormDescription>
                          When to send campaign messages. Leave empty to send
                          immediately on activation.
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
              <CampaignPreview
                ref={previewRef}
                data={previewData}
                branding={previewBranding}
                businessName={businessData?.business?.name}
                className="shadow-2xl"
                onFieldClick={onFieldClick}
              />
            </div>
          </form>
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

function useAudiencePreview(keys: string[]) {
  const keyStr = [...keys].sort().join(",");
  return useQuery<{ count: number }>({
    queryKey: ["audience-preview", keyStr],
    queryFn: () =>
      fetcher<{ count: number }>(
        `/api/audiences/preview?key=${encodeURIComponent(keyStr)}`,
      ),
    enabled: keys.length > 0,
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

  const allOptions = [...segmentOptions, ...FEEDBACK_AUDIENCES];

  const watchedAudiences = useWatch({ control, name: "targetAudiences" }) ?? [];
  const { data: previewData } = useAudiencePreview(watchedAudiences);

  return (
    <FormField
      control={control}
      name="targetAudiences"
      render={({ field }) => {
        const selected = field.value ?? [];
        const selectedSet = new Set(selected);
        const onToggle = (key: string) => {
          const next = selectedSet.has(key)
            ? selected.filter((x: string) => x !== key)
            : [...selected, key];
          field.onChange(next);
        };
        const onClear = () => field.onChange([]);
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
                      "Select target audience..."
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
              {selected.length > 0 && previewData != null && (
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
    <div className="bg-sidebar-accent/50 flex flex-col gap-0 rounded-lg border-0 p-2">
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

// ---------------------------------------------------------------------------
// Image upload button (client-side only — reads file as data URL for preview)
// ---------------------------------------------------------------------------

function ImageUploadButton({
  onFile,
  label,
  icon = "upload",
}: {
  onFile: (dataUrl: string) => void;
  label: string;
  icon?: "upload" | "image";
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file (JPG, PNG, GIF)");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large. Max 10MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          onFile(reader.result);
        }
      };
      reader.readAsDataURL(file);

      // Reset so the same file can be re-selected
      e.target.value = "";
    },
    [onFile],
  );

  const Icon = icon === "image" ? ImagePlus : Upload;

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="border-input hover:bg-muted/50 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed py-4 text-sm font-medium transition-colors"
    >
      <Icon className="text-muted-foreground h-4 w-4" />
      {label}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </button>
  );
}
