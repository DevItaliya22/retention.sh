"use client";

import { useCashierLogin } from "@/hooks/cashier/useCashierAuth";
import { cashierLoginSchema } from "@/lib/schemas/auth";
import { getErrorMessageFromResponse } from "@/lib/utils/error-handler";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@reelo/ui/components";
import { useState } from "react";
import { toast } from "sonner";

interface CashierLoginFormProps {
  businessSlug: string;
  cashierSlug: string;
  businessName: string;
  cashierName: string;
}

export function CashierLoginForm({
  businessSlug,
  cashierSlug,
  businessName,
  cashierName,
}: CashierLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const login = useCashierLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const validationResult = cashierLoginSchema.safeParse({
        businessSlug,
        cashierSlug,
        email,
        password,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        const errorMessage = firstError?.message || "Invalid input";
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      const result = await login.mutateAsync({
        businessSlug: validationResult.data.businessSlug,
        cashierSlug: validationResult.data.cashierSlug,
        email: validationResult.data.email,
        password: validationResult.data.password,
      });

      if (result.error) {
        const errorMsg = getErrorMessageFromResponse(
          result.error,
          "Invalid email or password. Please try again.",
        );
        setError(errorMsg);
        toast.error(errorMsg);
      } else {
        toast.success("Successfully signed in!");
      }
    } catch (err: any) {
      const errorMsg = getErrorMessageFromResponse(
        err,
        "An unexpected error occurred. Please try again.",
      );
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <Card className="bg-card border-border relative w-full max-w-md shadow-2xl backdrop-blur-xl">
      <CardHeader className="space-y-1 pb-6 text-center">
        <div className="bg-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary-foreground h-8 w-8"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
        </div>
        <CardTitle className="text-2xl font-bold">Cashier Login</CardTitle>
        <CardDescription>
          Sign in to {businessName} as {cashierName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-destructive/10 border-destructive/20 text-destructive mb-4 rounded-lg border p-3 text-center text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={login.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={login.isPending}
            />
          </div>

          <Button type="submit" loading={login.isPending} className="w-full">
            {login.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
