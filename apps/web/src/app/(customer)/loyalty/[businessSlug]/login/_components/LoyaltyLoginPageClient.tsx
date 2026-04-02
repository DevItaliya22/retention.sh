"use client";

import { fetcher } from "@/lib/fetcher";
import { handleApiError } from "@/lib/utils/error-handler";
import { Button, Card, CardContent, Input, Label } from "@reelo/ui/components";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MobileLayout } from "../../_components/common/MobileLayout";
import type { LoyaltyBranding } from "../../_components/common/types";

interface RegisterInfoResponse {
  registrationBonusPoints: number;
  pointsName: string;
  businessName: string | null;
  branding: LoyaltyBranding | null;
}

type Step = "request" | "verify";

export function LoyaltyLoginPageClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const businessSlug = params?.businessSlug as string | undefined;

  const [step, setStep] = useState<Step>("request");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: registerInfo } = useQuery<RegisterInfoResponse>({
    queryKey: ["public-business-register-info", businessSlug],
    queryFn: () =>
      fetcher<RegisterInfoResponse>(
        `/api/public/business/${businessSlug}/register-info`,
      ),
    enabled: !!businessSlug,
  });

  useEffect(() => {
    const phone = searchParams.get("phone");
    if (phone) setPhoneNumber(phone);
  }, [searchParams]);

  const branding = registerInfo?.branding ?? null;
  const businessName = registerInfo?.businessName ?? null;
  const themeColor = branding?.themeColor;

  const sendOtp = async () => {
    if (!businessSlug || !name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetcher<{ success: boolean; error?: string }>(
        "/api/auth/customer/register-request-otp",
        {
          method: "POST",
          body: JSON.stringify({
            phoneNumber,
            businessSlug,
            name: name.trim(),
          }),
        },
      );
      if (!response.success) {
        toast.error(response.error || "Failed to send OTP");
        return;
      }
      toast.success("OTP sent. Check server console for now.");
      setStep("verify");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to send OTP";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!businessSlug) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/customer/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp }),
      });
      const text = await res.text();
      const data = (text ? JSON.parse(text) : {}) as {
        session: unknown;
        error?: string;
      };
      if (!res.ok) {
        const message =
          data.error ||
          (await handleApiError(
            new Response(text, {
              status: res.status,
              statusText: res.statusText,
            }),
            "Invalid or expired OTP. Please try again.",
          ));
        throw new Error(message);
      }
      if (!data.session) {
        toast.error(data.error || "Invalid OTP");
        return;
      }
      toast.success("Logged in successfully");
      router.push(`/loyalty/${businessSlug}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to verify OTP";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!businessSlug) {
    return (
      <MobileLayout>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <p className="text-lg font-semibold">Invalid link</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Please use the link shared by the business.
            </p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout branding={branding}>
      <div className="flex flex-1 flex-col bg-white">
        {/* Header section with optional banner (with theme tint) and branding */}
        <div
          className="relative flex flex-col items-center overflow-hidden px-6 pt-12 pb-6"
          style={
            themeColor
              ? {
                  backgroundColor: themeColor,
                  color: branding?.textColor || "#fff",
                }
              : undefined
          }
        >
          {branding?.bannerImageUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={branding.bannerImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: themeColor || "#000000",
                  opacity: 0.65,
                }}
              />
            </>
          )}
          <div className="relative z-10 flex flex-col items-center">
            {branding?.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logoUrl}
                alt=""
                className="mb-4 h-16 w-auto object-contain"
              />
            )}
            <h1
              className={`text-center text-lg font-bold ${!themeColor ? "text-foreground" : ""}`}
            >
              {businessName ? `Check your loyalty points` : "Customer Login"}
            </h1>
            {businessName && (
              <p
                className={`mt-1 text-center text-sm ${!themeColor ? "text-muted-foreground" : "opacity-80"}`}
              >
                for {businessName}
              </p>
            )}
          </div>
        </div>

        {/* Form section */}
        <div
          className="flex flex-1 items-start justify-center px-6 pt-6 pb-8"
          style={{ backgroundColor: "#ffffff" }}
        >
          <Card
            className="w-full border-0 shadow-none"
            style={{ backgroundColor: "#ffffff", boxShadow: "none" }}
          >
            <CardContent
              className="space-y-4 p-0"
              style={{ backgroundColor: "#ffffff" }}
            >
              {step === "request" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendOtp();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      className="!border-black/10 !bg-white"
                      style={{ backgroundColor: "#ffffff" }}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="9876543210"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      className="!border-black/10 !bg-white"
                      style={{ backgroundColor: "#ffffff" }}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      disabled={isLoading}
                    />
                  </div>
                  {registerInfo && registerInfo.registrationBonusPoints > 0 && (
                    <p
                      className={
                        themeColor
                          ? "text-sm font-medium"
                          : "text-primary text-sm font-medium"
                      }
                      style={themeColor ? { color: themeColor } : undefined}
                    >
                      New customers get{" "}
                      {registerInfo.registrationBonusPoints.toLocaleString()}{" "}
                      {registerInfo.pointsName} bonus!
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    loading={isLoading}
                    style={
                      themeColor
                        ? {
                            backgroundColor: themeColor,
                            color: branding?.textColor || "#fff",
                          }
                        : undefined
                    }
                  >
                    Send OTP
                  </Button>
                </form>
              )}

              {step === "verify" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    verifyOtp();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>OTP</Label>
                    <Input
                      className="!border-black/10 !bg-white"
                      style={{ backgroundColor: "#ffffff" }}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-primary w-full"
                    loading={isLoading}
                    style={
                      themeColor
                        ? {
                            backgroundColor: themeColor,
                            color: branding?.textColor || "#fff",
                          }
                        : undefined
                    }
                  >
                    Verify OTP
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setStep("request")}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
}
