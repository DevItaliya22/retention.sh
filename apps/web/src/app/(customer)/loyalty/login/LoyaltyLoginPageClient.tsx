"use client";

import { fetcher } from "@/lib/fetcher";
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
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function LoyaltyLoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"request" | "verify">("request");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [redirectBusiness, setRedirectBusiness] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const phone = searchParams.get("phone");
    const business = searchParams.get("business");
    if (phone) setPhoneNumber(phone);
    if (business) setRedirectBusiness(business);
  }, [searchParams]);

  const requestOtp = async () => {
    setIsLoading(true);
    try {
      const response = await fetcher<{ success: boolean; error?: string }>(
        "/api/customer/auth/request-otp",
        {
          method: "POST",
          body: JSON.stringify({ phoneNumber }),
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
    setIsLoading(true);
    try {
      const response = await fetcher<{ session: unknown; error?: string }>(
        "/api/customer/auth/verify-otp",
        {
          method: "POST",
          body: JSON.stringify({ phoneNumber, otp }),
        },
      );
      if (!response.session) {
        toast.error(response.error || "Invalid OTP");
        return;
      }
      toast.success("Logged in successfully");
      router.push(
        redirectBusiness ? `/loyalty/${redirectBusiness}` : "/loyalty",
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to verify OTP";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Customer Login</CardTitle>
          <CardDescription>
            Access your loyalty points with your phone number.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="9876543210"
              disabled={isLoading || step === "verify"}
            />
          </div>
          {step === "verify" && (
            <div className="space-y-2">
              <Label>OTP</Label>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                disabled={isLoading}
              />
            </div>
          )}
          <Button
            className="w-full"
            onClick={step === "request" ? requestOtp : verifyOtp}
            loading={isLoading}
          >
            {step === "request" ? "Send OTP" : "Verify OTP"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
