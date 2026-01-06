"use client"

import { useRouter } from "next/navigation"
import { Button } from "@reelo/ui/components"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@reelo/ui/components"
import { authClient } from "@/lib/auth/auth-client"


export default function HomePage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/login")
    router.refresh()
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md backdrop-blur-xl bg-card border-border shadow-2xl">
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
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-lg relative backdrop-blur-xl bg-card border-border shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-20 h-20 mb-4 rounded-full bg-primary flex items-center justify-center shadow-lg text-primary-foreground text-2xl font-bold">
            {session.user?.name?.charAt(0).toUpperCase() || session.user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <CardTitle className="text-2xl font-bold">
            Welcome, {session.user?.name || "User"}!
          </CardTitle>
          <CardDescription>
            Your session is active
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Session Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{session.user?.email}</span>
                </div>
                {session.user?.name && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{session.user.name}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {session.user?.id?.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-chart-2/10 border border-chart-2/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-chart-2 animate-pulse" />
                <span className="text-chart-2 text-sm font-medium">Session Active</span>
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
  )
}
