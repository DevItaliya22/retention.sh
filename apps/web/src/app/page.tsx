"use client";

import { authClient } from "@/lib/auth/auth-client";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@dy/ui/components";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  if (isPending) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-t-2 border-b-2" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <Card className="bg-card border-border w-full max-w-md shadow-2xl backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Not Signed In</CardTitle>
            <CardDescription>
              Please sign in to view your session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/login")}
              text="Go to Login"
              className="w-full"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-primary/20 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl" />
        <div className="bg-secondary/20 absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl" />
      </div>

      <Card className="bg-card border-border relative w-full max-w-lg shadow-2xl backdrop-blur-xl">
        <CardHeader className="pb-6 text-center">
          <div className="bg-primary text-primary-foreground mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold shadow-lg">
            {session.user?.name?.charAt(0).toUpperCase() ||
              session.user?.email?.charAt(0).toUpperCase() ||
              "U"}
          </div>
          <CardTitle className="text-2xl font-bold">
            Welcome, {session.user?.name || "User"}!
          </CardTitle>
          <CardDescription>Your session is active</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="bg-muted/50 border-border rounded-lg border p-4">
              <h3 className="text-muted-foreground mb-3 text-sm font-medium">
                Session Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{session.user?.email}</span>
                </div>
                {session.user?.name && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{session.user.name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="bg-muted rounded px-2 py-1 font-mono text-sm">
                    {session.user?.id?.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-chart-2/10 border-chart-2/20 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <div className="bg-chart-2 h-2 w-2 animate-pulse rounded-full" />
                <span className="text-chart-2 text-sm font-medium">
                  Session Active
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSignOut}
            variant="outline"
            text="Sign Out"
            className="w-full"
          />
        </CardContent>
      </Card>
    </div>
  );
}
