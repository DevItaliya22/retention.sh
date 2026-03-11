"use client";

import { useClaimReferral } from "@/hooks/referral/useClaimReferral";
import { useReferralProgramByClaimSlug } from "@/hooks/referral/useReferralProgram";
import { nameSchema } from "@/lib/schemas/common";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Skeleton,
} from "@reelo/ui/components";
import { CheckCircle2, Gift, Sparkles, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const REFERRAL_LOCK_TERM =
  "Referrer's cashback will be locked until the person they referred makes their first bill. Locked amount shows in bill redemption UI. The referred customer can use their reward normally.";

const claimFormSchema = z.object({
  name: nameSchema,
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .max(20, "Phone number is too long")
    .trim(),
});

type ClaimFormValues = z.infer<typeof claimFormSchema>;

interface ReferralClaimPageClientProps {
  referralSlug: string;
}

const DEFAULT_THEME_COLOR = "#0f766e";
const DEFAULT_TEXT_COLOR = "#f8fafc";
const pageWrapClass =
  "flex min-h-screen w-full items-center justify-center bg-white p-4 font-sans sm:p-6";

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

export function ReferralClaimPageClient({
  referralSlug,
}: ReferralClaimPageClientProps) {
  const { data, isLoading, isError } =
    useReferralProgramByClaimSlug(referralSlug);
  const { mutateAsync: claimReferral, isPending } = useClaimReferral();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
    },
  });

  const onSubmit = async (values: ClaimFormValues) => {
    try {
      const result = await claimReferral({
        referralSlug,
        name: values.name,
        phoneNumber: values.phoneNumber,
      });

      if (result.success && result.data) {
        setIsSuccess(true);
        toast.success("Referral claimed successfully!");
      } else {
        setIsFailed(true);
        setErrorMessage(result.error || "Failed to claim referral");
        if (result.alreadyExists) {
          toast.error("You are already a customer of this business");
        } else {
          toast.error(result.error || "Failed to claim referral");
        }
      }
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to claim referral";
      setIsFailed(true);
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  const newCustomerBenefitText = useMemo(() => {
    if (!data?.referralProgram || !data?.business) return null;
    const { referralProgram, business } = data;
    if (referralProgram.newCustomerBenefitType === "AMOUNT_CASHBACK") {
      return `${business.defaultCurrencySymbol}${referralProgram.newCustomerBenefitValue} Cashback`;
    }
    if (
      referralProgram.newCustomerBenefitType === "FREE_ITEM_ON_NEXT_PURCHASE"
    ) {
      return `Free ${referralProgram.newCustomerFreeItemSku?.name ?? "Item"}`;
    }
    return "Exclusive Reward";
  }, [data]);

  const newCustomerTerms = useMemo(() => {
    const raw =
      data?.referralProgram?.termsAndConditionsNewCustomer?.map(
        (t) => t.content,
      ) ?? [];
    const cleaned = raw.map((s) => s.trim()).filter(Boolean);
    // lock term does NOT apply to new customer terms; ensure it never leaks here
    return cleaned.filter((t) => t !== REFERRAL_LOCK_TERM);
  }, [data]);

  const cardWrap = pageWrapClass;
  const cardInner =
    "flex w-full min-w-0 max-w-[420px] flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:rounded-[32px]";
  const loading = isLoading && !data;

  if (isError || (!loading && (!data?.referralProgram || !data?.business))) {
    return (
      <div className={cardWrap}>
        <div
          className={`flex ${cardInner} border border-white/10 p-6 text-center sm:p-10`}
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 sm:mb-6 sm:h-16 sm:w-16">
            <span className="text-xl sm:text-2xl">😕</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
            Invalid referral link
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-[15px]">
            This referral link is invalid or the program is no longer available.
          </p>
        </div>
      </div>
    );
  }

  const referralProgram = data?.referralProgram;
  const business = data?.business;
  const branding = referralProgram?.branding;
  const themeColor =
    (branding?.themeColor as string | undefined) || DEFAULT_THEME_COLOR;
  const textColor =
    (branding?.textColor as string | undefined) ||
    getContrastTextColor(themeColor);
  const bannerImage = branding?.bannerImage;
  const logo = branding?.logo;
  const claimHeader = "Claim your reward";
  const claimSubtitle = loading
    ? "Enter your details to join and get your referral benefit."
    : `Enter your details to join ${business?.name ?? "us"} and get your referral benefit.`;

  if (isSuccess) {
    return (
      <div className={cardWrap}>
        <div className={cardInner}>
          <div
            className="relative px-4 pt-8 pb-8 text-center sm:px-8 sm:pt-12 sm:pb-10"
            style={{ backgroundColor: themeColor }}
          >
            {bannerImage && (
              <>
                <div className="absolute inset-0 z-0">
                  <img
                    src={bannerImage}
                    alt=""
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
              <div className="mb-4 h-16 w-16 rounded-full border border-white/20 bg-white p-0.5 shadow-lg sm:mb-5 sm:h-20 sm:w-20">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white">
                  {logo ? (
                    <img
                      src={logo}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-gray-300 sm:text-2xl">
                      {(business?.name || "B").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 sm:mb-4 sm:h-14 sm:w-14">
                <CheckCircle2
                  size={28}
                  style={{ color: textColor }}
                  strokeWidth={2}
                />
              </div>
              <h1
                className="mb-1.5 text-[22px] font-bold tracking-tight sm:mb-2 sm:text-[26px]"
                style={{ color: textColor }}
              >
                You&apos;re in!
              </h1>
              <p
                className="max-w-[280px] text-[14px] leading-relaxed sm:max-w-[300px] sm:text-[15px]"
                style={{ color: textColor, opacity: 0.9 }}
              >
                You&apos;ve joined {business?.name} and received your referral
                reward.
              </p>
            </div>
          </div>
          <div className="rounded-b-2xl bg-white px-4 pt-6 pb-6 sm:rounded-b-[32px] sm:px-6 sm:pt-8 sm:pb-8">
            <div className="overflow-hidden rounded-2xl border border-gray-100/80 bg-gray-50/50 p-4 shadow-sm sm:rounded-[24px] sm:p-5 sm:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm sm:h-12 sm:w-12">
                  <Gift
                    size={20}
                    strokeWidth={2.5}
                    style={{ color: themeColor }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase sm:text-[12px]">
                    Your reward
                  </p>
                  <p className="mt-0.5 text-base leading-tight font-bold text-gray-900 sm:text-[17px]">
                    {newCustomerBenefitText}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-5 text-center text-[13px] leading-relaxed text-gray-500 sm:mt-6 sm:text-[14px]">
              Check your account or visit the store to use your reward.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error state (no overlap; responsive) ─────────────────────────────────
  if (isFailed) {
    return (
      <div className={cardWrap}>
        <div className={cardInner}>
          <div
            className="relative px-4 pt-8 pb-8 text-center sm:px-8 sm:pt-12 sm:pb-10"
            style={{ backgroundColor: themeColor }}
          >
            {bannerImage && (
              <>
                <div className="absolute inset-0 z-0">
                  <img
                    src={bannerImage}
                    alt=""
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
              <div className="mb-4 h-16 w-16 rounded-full border border-white/20 bg-white p-0.5 shadow-lg sm:mb-5 sm:h-20 sm:w-20">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white">
                  {logo ? (
                    <img
                      src={logo}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-gray-300 sm:text-2xl">
                      {(business?.name || "B").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 sm:mb-4 sm:h-14 sm:w-14">
                <XCircle
                  size={28}
                  style={{ color: textColor }}
                  strokeWidth={2}
                />
              </div>
              <h1
                className="mb-1.5 text-[22px] font-bold tracking-tight sm:mb-2 sm:text-[26px]"
                style={{ color: textColor }}
              >
                Couldn’t claim
              </h1>
              <p
                className="max-w-[280px] text-[14px] leading-relaxed sm:max-w-[300px] sm:text-[15px]"
                style={{ color: textColor, opacity: 0.9 }}
              >
                No worries — you can try again below.
              </p>
            </div>
          </div>
          <div className="rounded-b-2xl bg-white px-4 pt-6 pb-6 sm:rounded-b-[32px] sm:px-6 sm:pt-8 sm:pb-8">
            <div
              className="overflow-hidden rounded-2xl border border-gray-100/80 p-4 shadow-sm sm:rounded-[24px] sm:p-5 sm:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
              style={{
                backgroundColor: `${themeColor}08`,
                borderLeftWidth: "4px",
                borderLeftColor: themeColor,
              }}
            >
              <div className="flex gap-3 sm:gap-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm sm:h-12 sm:w-12"
                  style={{ borderColor: `${themeColor}20` }}
                >
                  <XCircle
                    size={20}
                    strokeWidth={2.5}
                    style={{ color: themeColor }}
                  />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase sm:text-[12px]">
                    What happened
                  </p>
                  <p className="mt-1 text-[14px] leading-snug font-medium text-gray-900 sm:text-[15px]">
                    {errorMessage || "This referral could not be processed."}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-5 text-center text-[13px] leading-relaxed text-gray-500 sm:mt-6 sm:text-[14px]">
              Use a different phone number to try again, or contact{" "}
              {business?.name} if you need help.
            </p>
            <Button
              type="button"
              className="mt-5 h-11 min-h-[44px] w-full rounded-[12px] text-[14px] font-medium sm:mt-6"
              style={{ backgroundColor: themeColor, color: textColor }}
              onClick={() => {
                setIsFailed(false);
                setErrorMessage("");
                form.reset();
              }}
            >
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cardWrap}>
      <style>{`
        .referral-claim-form input:-webkit-autofill,
        .referral-claim-form input:-webkit-autofill:hover,
        .referral-claim-form input:-webkit-autofill:focus,
        .referral-claim-form input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px white inset !important;
          box-shadow: 0 0 0 30px white inset !important;
          -webkit-text-fill-color: #000 !important;
        }
      `}</style>
      <div className={cardInner}>
        <div
          className="relative px-4 pt-8 pb-8 text-center sm:px-8 sm:pt-12 sm:pb-10"
          style={{ backgroundColor: themeColor }}
        >
          {!loading && bannerImage && (
            <>
              <div className="absolute inset-0 z-0">
                <img
                  src={bannerImage}
                  alt=""
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
            <div className="mb-4 h-16 w-16 rounded-full border border-white/20 bg-white p-0.5 shadow-lg sm:mb-5 sm:h-20 sm:w-20">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white">
                {loading ? (
                  <Skeleton className="h-full w-full rounded-full" />
                ) : logo ? (
                  <img
                    src={logo}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-gray-300 sm:text-2xl">
                    {(business?.name || "B").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <h1
              className="mb-1.5 text-[22px] font-bold tracking-tight sm:mb-2 sm:text-[26px]"
              style={{ color: textColor }}
            >
              {claimHeader}
            </h1>
            <p
              className="max-w-[280px] text-[14px] leading-relaxed sm:max-w-[300px] sm:text-[15px]"
              style={{ color: textColor, opacity: 0.9 }}
            >
              {claimSubtitle}
            </p>
          </div>
        </div>

        <div className="referral-claim-form rounded-b-2xl bg-white px-4 pt-6 pb-6 sm:rounded-b-[32px] sm:px-6 sm:pt-8 sm:pb-8">
          <div className="mb-6 overflow-hidden rounded-2xl border border-gray-100/80 bg-white p-4 shadow-sm sm:mb-8 sm:rounded-[24px] sm:p-5 sm:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm sm:h-12 sm:w-12">
                <Sparkles
                  size={20}
                  strokeWidth={2.5}
                  style={{ color: themeColor }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase sm:text-[12px]">
                  You get
                </p>
                <div
                  className="inline-flex max-w-full items-center rounded-full px-3 py-1 text-[14px] font-semibold"
                  style={{
                    backgroundColor: `${themeColor}12`,
                    color: themeColor,
                  }}
                >
                  {newCustomerBenefitText == null ? (
                    <Skeleton className="h-5 w-28 rounded-full bg-gray-200" />
                  ) : (
                    newCustomerBenefitText
                  )}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm leading-none font-medium text-black">
                  Name
                </label>
                <Input
                  disabled
                  placeholder="Enter your name"
                  className="mt-2 min-h-[44px] rounded-[12px] border border-neutral-300 !bg-white text-black placeholder:text-black focus-visible:border-neutral-300 focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-11"
                />
              </div>
              <div>
                <label className="text-sm leading-none font-medium text-black">
                  Phone number
                </label>
                <Input
                  disabled
                  placeholder="Enter your phone number"
                  className="mt-2 min-h-[44px] rounded-[12px] border border-neutral-300 !bg-white text-black placeholder:text-black focus-visible:border-neutral-300 focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-11"
                />
              </div>
              <Button
                type="button"
                disabled
                className="min-h-[44px] w-full rounded-[12px] text-[14px] font-medium sm:h-11"
                style={{ backgroundColor: themeColor, color: textColor }}
              >
                Claim reward
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your name"
                          className="min-h-[44px] rounded-[12px] border border-neutral-300 !bg-white text-black placeholder:text-black focus-visible:border-neutral-300 focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Phone number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Enter your phone number"
                          className="min-h-[44px] rounded-[12px] border border-neutral-300 !bg-white text-black placeholder:text-black focus-visible:border-neutral-300 focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={isPending}
                  className="min-h-[44px] w-full rounded-[12px] text-[14px] font-medium sm:h-11"
                  style={{ backgroundColor: themeColor, color: textColor }}
                >
                  {isPending ? "Processing…" : "Claim reward"}
                </Button>
              </form>
            </Form>
          )}

          {newCustomerTerms.length > 0 && (
            <details className="mt-5 overflow-hidden rounded-[16px] border border-gray-100/80 bg-gray-50/50 px-4 py-3">
              <summary className="cursor-pointer text-[13px] font-semibold text-gray-700 select-none">
                Terms & Conditions
              </summary>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-[13px] leading-relaxed text-gray-600">
                {newCustomerTerms.map((t, idx) => (
                  <li key={`${idx}-${t}`}>{t}</li>
                ))}
              </ol>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
