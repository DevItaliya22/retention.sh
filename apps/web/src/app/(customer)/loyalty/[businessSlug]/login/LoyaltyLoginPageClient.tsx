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
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RegisterInfoResponse {
  registrationBonusPoints: number;
  pointsName: string;
}

type Step = "request" | "register" | "verify";

interface RequestOtpResponse {
  success: boolean;
  error?: string;
  notCustomer?: boolean;
}

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

  const requestOtp = async () => {
    if (!businessSlug) return;
    setIsLoading(true);
    try {
      const response = await fetcher<RequestOtpResponse>(
        "/api/auth/customer/request-otp",
        {
          method: "POST",
          body: JSON.stringify({ phoneNumber, businessSlug }),
        },
      );
      if (response.success) {
        toast.success("OTP sent. Check server console for now.");
        setStep("verify");
        return;
      }
      if (response.notCustomer) {
        setStep("register");
        toast.info(
          "You're not an existing customer. Enter your name to register.",
        );
        return;
      }
      toast.error(response.error || "Failed to send OTP");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to send OTP";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const registerAndRequestOtp = async () => {
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
        toast.error(response.error || "Failed to register");
        return;
      }
      toast.success("OTP sent. Check server console for now.");
      setStep("verify");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to register";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!businessSlug) return;
    setIsLoading(true);
    try {
      const response = await fetcher<{ session: unknown; error?: string }>(
        "/api/auth/customer/verify-otp",
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
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
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
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
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
                requestOtp();
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
              <Button type="submit" className="w-full" loading={isLoading}>
                Send OTP
              </Button>
            </form>
          )}

          {step === "register" && (
            <>
              <p className="text-sm text-muted-foreground">
                You're not an existing customer for this business, but you can
                become one. Enter your name to register.
              </p>
              {registerInfo && registerInfo.registrationBonusPoints > 0 && (
                <p className="text-sm font-medium text-primary">
                  Register now and you'll get{" "}
                  {registerInfo.registrationBonusPoints.toLocaleString()}{" "}
                  {registerInfo.pointsName} extra!
                </p>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  registerAndRequestOtp();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" loading={isLoading}>
                  Register
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
            </>
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
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
