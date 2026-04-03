"use client";

import {
  Badge,
  Button,
  DateDisplay,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@reelo/ui/components";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CampaignScheduledMessagesSectionProps {
  audienceCount: number;
  audienceKeys: string[];
  customers: Array<{
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
  }>;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  scheduledAt: string | null;
}

const CHANNEL_LABELS: Record<string, string> = {
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
};
const ALL_CUSTOMERS_AUDIENCE_KEY = "all:customers";

export function CampaignScheduledMessagesSection({
  audienceCount,
  audienceKeys,
  customers,
  page,
  perPage,
  onPageChange,
  whatsappEnabled,
  emailEnabled,
  scheduledAt,
}: CampaignScheduledMessagesSectionProps) {
  const activeChannels = [
    ...(whatsappEnabled ? (["WHATSAPP"] as const) : []),
    ...(emailEnabled ? (["EMAIL"] as const) : []),
  ];
  const totalPages = Math.max(1, Math.ceil(audienceCount / perPage));
  const normalizedAudienceKeys = audienceKeys.filter(
    (key) => key !== ALL_CUSTOMERS_AUDIENCE_KEY,
  );
  const audienceLabel =
    normalizedAudienceKeys.length > 0
      ? `${normalizedAudienceKeys.length} selected audience${normalizedAudienceKeys.length === 1 ? "" : "s"}`
      : "All customers";

  return (
    <div className="bg-sidebar-accent/50 flex flex-col gap-0 rounded-lg border-0 p-2">
      <div className="mb-3 px-0 pt-0.5 pl-3">
        <h3 className="text-base leading-none font-semibold">
          Scheduled Message Reach
        </h3>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Live preview from current campaign settings, so you can see expected
          reach before activation.
        </p>
      </div>
      <div className="border-border/45 bg-background/55 overflow-hidden rounded-lg border px-5 py-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {audienceCount.toLocaleString()} customers
          </Badge>
          {scheduledAt ? (
            <Badge variant="outline">
              Sends at: <DateDisplay date={scheduledAt} />
            </Badge>
          ) : (
            <Badge variant="outline">No send time scheduled yet</Badge>
          )}
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Identity</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Send time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeChannels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    Enable at least one channel (WhatsApp or Email) to preview
                    scheduled message reach.
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No customer identities available for this audience yet.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="text-sm font-medium">
                      {customer.name?.trim() || "Unknown customer"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-mono">{customer.phone || "—"}</div>
                        <div className="text-muted-foreground text-xs">
                          {customer.email || "—"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="space-x-1">
                      {activeChannels.map((channel) => (
                        <Badge
                          key={`${customer.id}-${channel}`}
                          variant="secondary"
                          className="font-normal"
                        >
                          {CHANNEL_LABELS[channel]}
                        </Badge>
                      ))}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {scheduledAt ? (
                        <DateDisplay date={scheduledAt} className="text-sm" />
                      ) : (
                        "On campaign activation"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {!scheduledAt ? (
          <p className="text-muted-foreground mt-2 text-xs">
            Audience source: {audienceLabel}
          </p>
        ) : null}
        {audienceCount > 0 ? (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              Page {page} of {totalPages} ({audienceCount.toLocaleString()}{" "}
              total customers)
            </p>
            <TooltipProvider>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={page <= 1}
                      onClick={() => onPageChange(page - 1)}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Previous page</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={page >= totalPages}
                      onClick={() => onPageChange(page + 1)}
                      aria-label="Next page"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Next page</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        ) : null}
      </div>
    </div>
  );
}
