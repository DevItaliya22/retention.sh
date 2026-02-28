"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Label,
  Skeleton,
} from "@reelo/ui/components";

const ROW_CLASS = "flex flex-col gap-2 md:grid md:grid-cols-12";
const LABEL_CLASS = "col-span-4 flex flex-col gap-2";
const CONTROL_CLASS = "col-span-8 flex flex-col gap-1";

export function FeedbackSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Follow-up messages - 2 fields (textarea) */}
      <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
        <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
          <CardTitle className="text-foreground text-base leading-none font-semibold">
            Follow-up messages
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            Messages shown after positive or negative feedback
          </CardDescription>
        </CardHeader>
        <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Positive follow-up</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Negative follow-up</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
            <Skeleton className="h-9 w-32" />
          </CardFooter>
        </Card>
      </Card>

      {/* Feedback rewards - 2 fields: Enable reward (checkbox), Reward amount (₹ cashback) */}
      <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
        <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
          <CardTitle className="text-foreground text-base leading-none font-semibold">
            Feedback rewards
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            Credit cashback to the customer&apos;s wallet when they submit
            feedback.
          </CardDescription>
        </CardHeader>
        <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Enable reward</Label>
              </div>
              <div
                className={`${CONTROL_CLASS} flex flex-row items-center gap-2`}
              >
                <Skeleton className="h-6 w-11 rounded-full" />
                <span className="text-muted-foreground text-sm">
                  Give cashback for feedback
                </span>
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Reward amount (₹ cashback)</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
            <Skeleton className="h-9 w-32" />
          </CardFooter>
        </Card>
      </Card>

      {/* Timing & collection - 4 fields */}
      <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
        <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
          <CardTitle className="text-foreground text-base leading-none font-semibold">
            Timing & collection
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            When and how to collect feedback
          </CardDescription>
        </CardHeader>
        <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">When to ask</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Delay (seconds)</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
                <p className="text-foreground-lighter text-xs">
                  Used when timing is After delay
                </p>
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Collection channel</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">
                  Send via SMS if WhatsApp fails
                </Label>
              </div>
              <div
                className={`${CONTROL_CLASS} flex flex-row items-center gap-2`}
              >
                <Skeleton className="h-6 w-11 rounded-full" />
                <span className="text-muted-foreground text-sm">
                  Fallback to SMS
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
            <Skeleton className="h-9 w-32" />
          </CardFooter>
        </Card>
      </Card>

      {/* Discovery & reviews - 4 fields */}
      <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
        <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
          <CardTitle className="text-foreground text-base leading-none font-semibold">
            Discovery & reviews
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            Ask how customers found you and prompt them to leave a review after
            feedback
          </CardDescription>
        </CardHeader>
        <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">How did you hear about us?</Label>
              </div>
              <div
                className={`${CONTROL_CLASS} flex flex-row items-center gap-2`}
              >
                <Skeleton className="h-6 w-11 rounded-full" />
                <span className="text-muted-foreground text-sm">
                  Ask customers how they discovered your business
                </span>
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Ask for online reviews</Label>
              </div>
              <div
                className={`${CONTROL_CLASS} flex flex-row items-center gap-2`}
              >
                <Skeleton className="h-6 w-11 rounded-full" />
                <span className="text-muted-foreground text-sm">
                  Show review prompt after feedback
                </span>
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Platform</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Review link</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
            <Skeleton className="h-9 w-32" />
          </CardFooter>
        </Card>
      </Card>

      {/* Selection options - standalone section (no NestedCard in actual UI) */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Selection options</h3>
          <p className="text-muted-foreground text-xs">
            Options customers can select when giving feedback (e.g. what they
            liked or didn&apos;t like). Order is used on the feedback form.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="min-h-9 flex-1 rounded-md" />
            <Skeleton className="h-9 w-16 rounded-md" />
          </div>
        </div>
      </div>

      {/* Negative feedback alerts - 6 fields */}
      <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
        <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
          <CardTitle className="text-foreground text-base leading-none font-semibold">
            Negative feedback alerts
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            Get notified when customers leave negative feedback
          </CardDescription>
        </CardHeader>
        <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Alert via WhatsApp</Label>
              </div>
              <div
                className={`${CONTROL_CLASS} flex flex-row items-center gap-2`}
              >
                <Skeleton className="h-6 w-11 rounded-full" />
                <span className="text-muted-foreground text-sm">
                  Send alert to WhatsApp
                </span>
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Alert via SMS</Label>
              </div>
              <div
                className={`${CONTROL_CLASS} flex flex-row items-center gap-2`}
              >
                <Skeleton className="h-6 w-11 rounded-full" />
                <span className="text-muted-foreground text-sm">
                  Send alert via SMS
                </span>
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Alert via email</Label>
              </div>
              <div
                className={`${CONTROL_CLASS} flex flex-row items-center gap-2`}
              >
                <Skeleton className="h-6 w-11 rounded-full" />
                <span className="text-muted-foreground text-sm">
                  Send alert via email
                </span>
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">WhatsApp number</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">SMS number</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Alert email address</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
            <Skeleton className="h-9 w-32" />
          </CardFooter>
        </Card>
      </Card>
    </div>
  );
}
