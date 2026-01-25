import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@reelo/ui/components";
import { AlertCircle, Mail } from "lucide-react";

interface CashierNoSessionPageProps {
  businessName: string;
}

export function CashierNoSessionPage({ businessName }: CashierNoSessionPageProps) {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-primary/20 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl" />
        <div className="bg-secondary/20 absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl" />
        <div className="bg-muted/10 absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
      </div>

      <Card className="bg-card border-border relative w-full max-w-md shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-1 pb-6 text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
            <AlertCircle className="text-destructive h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">Session Required</CardTitle>
          <CardDescription>
            You need to be logged in to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center text-sm">
            Please sign in to your cashier account to continue.
          </p>
          <div className="bg-muted/50 rounded-lg border p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Mail className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Need Help?</p>
                <p className="text-muted-foreground text-xs">
                  Contact the administrator of <strong>{businessName}</strong> if you need assistance accessing your cashier account.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
