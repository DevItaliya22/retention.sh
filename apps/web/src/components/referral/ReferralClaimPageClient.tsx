"use client";

import { useClaimReferral } from "@/hooks/referral/useClaimReferral";
import { nameSchema } from "@/lib/schemas/common";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@reelo/ui/components";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
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
  const router = useRouter();
  const searchParams = useSearchParams();
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
    } catch (error: any) {
      setIsFailed(true);
      setErrorMessage(error.message || "Failed to claim referral");
      toast.error(error.message || "Failed to claim referral");
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Success!</CardTitle>
            <CardDescription className="text-center">
              You've successfully joined through the referral program
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Welcome! You've received your referral reward. Check your account
              for details.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-destructive text-center text-2xl">
              Unable to Claim
            </CardTitle>
            <CardDescription className="text-center">
              {errorMessage || "This referral could not be processed"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              {errorMessage ||
                "You may already be a customer of this business, or the referral link is invalid."}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setIsFailed(false);
                form.reset();
              }}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Claim Your Referral Reward</CardTitle>
          <CardDescription>
            Enter your details to claim your referral reward
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your name" {...field} />
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
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="Enter your phone number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Processing..." : "Claim Reward"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
