"use client";

import { fetcher } from "@/lib/fetcher";
import { handleApiError } from "@/lib/utils/error-handler";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@reelo/ui/components";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RegisterInfoResponse {
  registrationBonusPoints: number;
  pointsName: string;
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

  /**
   * Single flow for both new and existing customers: always use register-request-otp.
   * This prevents user enumeration (attackers can't probe which phones are customers).
   */
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
      <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Invalid link</CardTitle>
            <CardDescription>
              Missing business. Please use the link shared by the business.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Customer Login</CardTitle>
          <CardDescription>
            Access your loyalty points for this business with your phone number.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="9876543210"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  disabled={isLoading}
                />
              </div>
              {registerInfo && registerInfo.registrationBonusPoints > 0 && (
                <p className="text-primary text-sm font-medium">
                  New customers get{" "}
                  {registerInfo.registrationBonusPoints.toLocaleString()}{" "}
                  {registerInfo.pointsName} bonus!
                </p>
              )}
              <Button type="submit" className="w-full" loading={isLoading}>
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
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" loading={isLoading}>
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
  );
}
