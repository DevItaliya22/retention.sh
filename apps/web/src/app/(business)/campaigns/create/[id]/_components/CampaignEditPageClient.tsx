"use client";

import { CampaignPreview } from "@/components/campaigns/CampaignPreview";
import { ScaffoldContainer } from "@/components/layouts";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import {
  useCampaignQuery,
  useUpdateCampaign,
  type CampaignAppliesTo,
  type CampaignRedemptionLimit,
  type CampaignRewardType,
} from "@/hooks/campaigns/useCampaignsQuery";
import {
  CAMPAIGN_APPLIES_TO_LABELS,
  CAMPAIGN_REDEMPTION_LABELS,
  CAMPAIGN_REWARD_PLACEHOLDERS,
  CAMPAIGN_REWARD_TEMPLATES,
  CAMPAIGN_REWARD_TYPE_LABELS,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TERMS_OPTIONS,
} from "@/lib/constants/forms/campaign";
import {
  CAMPAIGN_APPLIES_TO,
  CAMPAIGN_REDEMPTION_LIMITS,
  CAMPAIGN_REWARD_TYPES,
  CAMPAIGN_STATUSES,
} from "@/lib/schemas/campaign";
import { downloadCampaignCardAsImage } from "@/lib/utils/campaign-card-image";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Checkbox,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
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
import {
  ArrowLeft,
  ArrowRight,
  Download,
  ImagePlus,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
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
  targetCustomerTags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_THEME_COLOR = "#7F4899";
const DEFAULT_TEXT_COLOR = "#ffffff";
const DEFAULT_TERMS = [
  "2 offers cannot be clubbed.",
  "Reward cannot be exchanged for cash.",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CampaignEditPageClientProps {
  campaignId: string;
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

export function CampaignEditPageClient({
  campaignId,
}: CampaignEditPageClientProps) {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const [sentenceEdited, setSentenceEdited] = useState(false);
  const {
    data: campaign,
    isLoading,
    isError,
    error,
  } = useCampaignQuery(campaignId);
  const { data: businessData } = useCurrentBusiness();
  const updateCampaign = useUpdateCampaign(campaignId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      title: "",
      description: "",
      contactNumber: "",
      rewardType: "PERCENTAGE_DISCOUNT",
      rewardValue: "",
      offerStatement: "",
      appliesTo: "ENTIRE_PURCHASE",
      maxRedemptionEnabled: false,
      maxRedemptionAmount: null,
      minPurchaseForEarningEnabled: false,
      minPurchaseForEarning: null,
      minPurchaseForRedemptionEnabled: false,
      minPurchaseForRedemption: null,
      instantCashbackRedeemable: false,
      expiresAt: "",
      redemptionLimit: "ONCE",
      termsAndConditions: DEFAULT_TERMS,
      themeColor: DEFAULT_THEME_COLOR,
      textColor: DEFAULT_TEXT_COLOR,
      logo: "",
      bannerImage: "",
      status: "DRAFT",
      emailSubject: "",
      whatsappEnabled: false,
      emailEnabled: false,
      targetCustomerTags: "",
    },
  });

  const watched = form.watch();

  useEffect(() => {
    if (!campaign) return;

    const rewardType =
      (campaign.rewardType as CampaignRewardType) ?? "PERCENTAGE_DISCOUNT";

    const rawValue =
      campaign.rewardValue ??
      extractRewardValueFromStatement(
        rewardType,
        campaign.offerStatement ?? campaign.rewardValue,
      ) ??
      "";

    const autoSentence = buildRewardSentence(
      rewardType,
      rawValue,
      campaign.maxRedemptionEnabled,
      campaign.maxRedemptionAmount,
    );

    const currentOffer =
      campaign.offerStatement ?? (campaign.rewardValue ? autoSentence : "");

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
      expiresAt: campaign.expiresAt
        ? new Date(campaign.expiresAt).toISOString().slice(0, 16)
        : "",
      redemptionLimit:
        (campaign.redemptionLimit as CampaignRedemptionLimit) ?? "ONCE",
      termsAndConditions:
        campaign.termsAndConditions?.length > 0
          ? campaign.termsAndConditions
          : DEFAULT_TERMS,
      themeColor: campaign.themeColor || DEFAULT_THEME_COLOR,
      textColor: campaign.textColor || DEFAULT_TEXT_COLOR,
      logo: campaign.logo ?? "",
      bannerImage: campaign.bannerImage ?? "",
      status: campaign.status ?? "DRAFT",
      emailSubject: campaign.emailSubject ?? "",
      whatsappEnabled: campaign.whatsappEnabled ?? false,
      emailEnabled: campaign.emailEnabled ?? false,
      targetCustomerTags: (campaign.targetCustomerTags ?? []).join(", "),
    });

    // If server sentence differs from auto-generated, treat as edited.
    setSentenceEdited(
      !!currentOffer && currentOffer.trim() !== autoSentence.trim(),
    );
  }, [campaign, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const tags = values.targetCustomerTags
        ? values.targetCustomerTags
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : undefined;

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
        targetCustomerTags: tags,
      });
      toast.success("Campaign saved");
      router.push("/campaigns");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  });

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
  if (isLoading || !campaign) {
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
          <button
            type="button"
            onClick={() => router.push("/campaigns")}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-2">
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
              variant="outline"
              size="sm"
              onClick={onSubmit}
              loading={updateCampaign.isPending}
            >
              Save and exit
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onSubmit}
              loading={updateCampaign.isPending}
            >
              Next <ArrowRight className="ml-1 h-3.5 w-3.5" />
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
                        value={
                          field.value ??
                          (campaign?.rewardType as CampaignRewardType) ??
                          "PERCENTAGE_DISCOUNT"
                        }
                        onValueChange={(val) => {
                          field.onChange(val);
                          // Regenerate sentence when type changes (unless user manually edited)
                          if (!sentenceEdited) {
                            form.setValue(
                              "offerStatement",
                              buildRewardSentence(
                                val,
                                watched.rewardValue ?? "",
                                watched.maxRedemptionEnabled,
                                watched.maxRedemptionAmount,
                              ),
                            );
                          }
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
                </div>

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

                <FormField
                  control={form.control}
                  name="termsAndConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Terms & conditions</FormLabel>
                      <Textarea
                        readOnly
                        className="bg-muted/40 min-h-[70px] resize-none border-dashed text-sm"
                        value={
                          field.value.length > 0
                            ? field.value.join("\n")
                            : "No terms selected."
                        }
                      />
                      <div className="mt-2 space-y-1.5">
                        {CAMPAIGN_TERMS_OPTIONS.map((term) => {
                          const checked = field.value.includes(term);
                          return (
                            <label
                              key={term}
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all",
                                checked
                                  ? "border-primary bg-primary/5 font-medium"
                                  : "hover:bg-muted/50",
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => {
                                  if (v) {
                                    field.onChange([...field.value, term]);
                                  } else {
                                    field.onChange(
                                      field.value.filter(
                                        (t: string) => t !== term,
                                      ),
                                    );
                                  }
                                }}
                              />
                              {term}
                            </label>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                    <FormItem>
                      <FormLabel>Logo</FormLabel>
                      <FormDescription>
                        Recommended size 512 x 512 px in JPG, GIF or PNG format
                        up to max size of 10MB.
                      </FormDescription>
                      {field.value ? (
                        <div className="relative inline-block">
                          <img
                            src={field.value}
                            alt="Logo preview"
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
                    <FormItem>
                      <FormLabel>Banner Image</FormLabel>
                      <FormDescription>
                        Recommended size 512 x 512 px in JPG, GIF or PNG format
                        up to max size of 5MB.
                      </FormDescription>
                      {field.value ? (
                        <div className="relative">
                          <img
                            src={field.value}
                            alt="Banner preview"
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
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CAMPAIGN_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {CAMPAIGN_STATUS_LABELS[s] ?? s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <FormField
                  control={form.control}
                  name="targetCustomerTags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target customer tags</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="tag1, tag2, tag3"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Comma-separated. Leave empty to target all customers.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              />
            </div>
          </form>
        </Form>
      </ScaffoldContainer>
    </div>
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
