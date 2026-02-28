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
    if (!data?.referralProgram || !data?.business) return "";
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

  const cardWrap =
    "flex min-h-screen w-full items-center justify-center bg-[#F4F4F5] p-4 font-sans sm:p-6";
  const cardInner =
    "flex w-full min-w-0 max-w-[420px] flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:rounded-[32px]";

  // ─── Loading state ─────────────────────────────────────────────────────
  if (isLoading && !data) {
    return (
      <div className={cardWrap}>
        <div className={cardInner}>
          <div className="flex h-[240px] w-full flex-col items-center bg-gray-200 pt-10 sm:h-[280px] sm:pt-12">
            <Skeleton className="mb-5 h-16 w-16 rounded-full sm:mb-6 sm:h-20 sm:w-20" />
            <Skeleton className="mb-2 h-6 w-3/4 sm:mb-3 sm:h-8" />
            <Skeleton className="h-3 w-2/3 sm:h-4" />
          </div>
          <div className="rounded-b-2xl bg-white px-4 py-6 sm:rounded-b-[32px] sm:px-6 sm:pb-8">
            <Skeleton className="mb-4 h-4 w-1/2" />
            <Skeleton className="mb-4 h-10 w-full rounded-xl" />
            <Skeleton className="mb-4 h-10 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Invalid / not found ──────────────────────────────────────────────
  if (isError || !data?.referralProgram || !data?.business) {
    return (
      <div className={cardWrap}>
        <div
          className={`flex ${cardInner} border border-gray-200/50 p-6 text-center sm:p-10`}
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 sm:mb-6 sm:h-16 sm:w-16">
            <span className="text-xl sm:text-2xl">😕</span>
          </div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            Invalid referral link
          </h1>
          <p className="mt-2 text-sm text-gray-500 sm:text-[15px]">
            This referral link is invalid or the program is no longer available.
          </p>
        </div>
      </div>
    );
  }

  const { referralProgram, business } = data;
  const branding = referralProgram.branding;

  const themeColor = branding?.themeColor || "#000000";
  const textColor = branding?.textColor || "#ffffff";
  const bannerImage = branding?.bannerImage;
  const logo = branding?.logo;
  const claimHeader = "Claim your reward";
  const claimSubtitle = `Enter your details to join ${business.name} and get your referral benefit.`;

  // ─── Success state (branded, same card layout) ───────────────────────────
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
                      {(business.name || "B").charAt(0).toUpperCase()}
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
                You&apos;ve joined {business.name} and received your referral
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
                      {(business.name || "B").charAt(0).toUpperCase()}
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
              {business.name} if you need help.
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

  // ─── Claim form (no overlap; responsive) ──────────────────────────────────
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
                    {(business.name || "B").charAt(0).toUpperCase()}
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

        <div className="rounded-b-2xl bg-white px-4 pt-6 pb-6 sm:rounded-b-[32px] sm:px-6 sm:pt-8 sm:pb-8">
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
                <p className="text-base leading-tight font-bold text-gray-900 sm:text-[17px]">
                  {newCustomerBenefitText}
                </p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your name"
                        className="min-h-[44px] rounded-[12px] sm:h-11"
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
                    <FormLabel>Phone number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="Enter your phone number"
                        className="min-h-[44px] rounded-[12px] sm:h-11"
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
        </div>
      </div>
    </div>
  );
}
