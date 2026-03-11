"use client";

import { checkAdminHasBusiness } from "@/lib/actions/auth";
import { authClient } from "@/lib/auth/auth-client";
import { loginSchema } from "@/lib/schemas/auth";
import { emailSchema } from "@/lib/schemas/common";
import { getErrorMessageFromResponse } from "@/lib/utils/error-handler";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  PasswordInput,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@reelo/ui/components";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function LoginPageClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("email");

  // Email/Password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Magic Link state
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const validationResult = loginSchema.safeParse({ email, password });

      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        const errorMessage = firstError?.message || "Invalid input";
        setError(errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      const result = await authClient.signIn.email({
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
        setSuccess("Successfully signed in!");
        toast.success("Successfully signed in!");

        // Check if user has business (first time login)
        const session = await authClient.getSession();
        const user = session.data?.user as any;
        if (user?.role === "ADMIN") {
          // Check if admin has a business
          const { hasBusiness } = await checkAdminHasBusiness();
          if (hasBusiness) {
            router.push("/dashboard");
          } else {
            router.push("/welcome");
          }
        } else {
          router.push("/welcome");
        }
        router.refresh();
      }
    } catch (err: any) {
      const errorMsg = getErrorMessageFromResponse(
        err,
        "An unexpected error occurred. Please try again.",
      );
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const validationResult = emailSchema.safeParse(magicLinkEmail);

      if (!validationResult.success) {
        const errorMessage =
          validationResult.error.issues[0]?.message || "Invalid email";
        setError(errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      const result = await authClient.signIn.magicLink({
        email: validationResult.data,
        callbackURL: "/dashboard",
        newUserCallbackURL: "/welcome",
      });

      if (result.error) {
        const errorMsg = getErrorMessageFromResponse(
          result.error,
          "Failed to send magic link. Please try again.",
        );
        setError(errorMsg);
        toast.error(errorMsg);
      } else {
        setMagicLinkSent(true);
        const successMsg = "Magic link sent! Check your email to sign in.";
        setSuccess(successMsg);
        toast.success("Magic link sent! Check your email.");
      }
    } catch (err: any) {
      const errorMsg = getErrorMessageFromResponse(
        err,
        "An unexpected error occurred. Please try again.",
      );
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-primary/20 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl" />
        <div className="bg-secondary/20 absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl" />
        <div className="bg-muted/10 absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
      </div>

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
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="magic">Magic Link</TabsTrigger>
            </TabsList>

            {error && (
              <div className="bg-destructive/10 border-destructive/20 text-destructive mt-4 rounded-lg border p-3 text-center text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-center text-sm text-green-600 dark:text-green-400">
                {success}
              </div>
            )}

            <TabsContent value="email" className="mt-4 space-y-4">
              <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="/forgot-password"
                      className="text-primary hover:text-primary/80 text-sm transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <PasswordInput
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" loading={isLoading} className="w-full">
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="magic" className="mt-4 space-y-4">
              {magicLinkSent ? (
                <div className="space-y-4">
                  <div className="bg-muted border-border rounded-lg border p-4">
                    <p className="text-muted-foreground mb-2 text-sm">
                      Magic link sent to <strong>{magicLinkEmail}</strong>
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Check your email inbox and click the link to sign in.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    loading={isLoading}
                    onClick={() => {
                      setMagicLinkSent(false);
                      setSuccess(null);
                    }}
                    className="w-full"
                  >
                    Send another link
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="magic-email">Email</Label>
                    <Input
                      id="magic-email"
                      type="email"
                      placeholder="you@example.com"
                      value={magicLinkEmail}
                      onChange={(e) => setMagicLinkEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" loading={isLoading} className="w-full">
                    {isLoading ? "Sending..." : "Send magic link"}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <p className="text-muted-foreground mt-6 border-t pt-6 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
