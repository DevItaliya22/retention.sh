"use client";

import type { PageLayoutProps } from "@/components/layouts";
import { PageLayout } from "@/components/layouts";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import {
  useCreatePartnerCampaign,
  usePartnerCampaigns,
} from "@/hooks/partnership/usePartnerCampaigns";
import {
  usePartnerRequests,
  useRespondPartnerRequest,
  useSendPartnerRequest,
  useUnPermanentReject,
  type PartnerRequestItem,
} from "@/hooks/partnership/usePartnerRequests";
import {
  useDissolvePartnership,
  usePartnerships,
  useUpdatePartnership,
  type Partnership,
} from "@/hooks/partnership/usePartnerships";
import {
  usePartnershipSettings,
  useUpdatePartnershipSettings,
} from "@/hooks/partnership/usePartnershipSettings";
import {
  Badge,
  Button,
  Input,
  Label,
  Separator,
  Skeleton,
  Switch,
} from "@reelo/ui/components";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Handshake,
  Plus,
  Send,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const MY_BUSINESS_LABEL = "Your business";
const PARTNER_LABEL = "Partner";

// ---------------------------------------------------------------------------
// General settings
// ---------------------------------------------------------------------------
function GeneralSettings() {
  const { data, isLoading } = usePartnershipSettings();
  const updateSettings = useUpdatePartnershipSettings();
  const [receiveOffers, setReceiveOffers] = useState<boolean | null>(null);

  const currentReceive =
    receiveOffers ?? data?.receivePartnershipOffers ?? false;
  const hasChanges =
    receiveOffers !== null && receiveOffers !== data?.receivePartnershipOffers;

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        receivePartnershipOffers: currentReceive,
      });
      setReceiveOffers(null);
      toast.success("Settings updated.");
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Failed to update settings.",
      );
    }
  };

  if (isLoading) {
    return <Skeleton className="h-14 w-full rounded-xl" />;
  }

  return (
    <div className="bg-muted/30 flex flex-col gap-4 rounded-xl p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div>
        <Label className="text-sm font-medium">
          Receive partnership offers
        </Label>
        <p className="text-muted-foreground mt-1 text-xs">
          When enabled, other businesses can send you partnership requests.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Switch
          checked={currentReceive}
          onCheckedChange={(v) => setReceiveOffers(v)}
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || updateSettings.isPending}
        >
          {updateSettings.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Send request
// ---------------------------------------------------------------------------
function SendRequest() {
  const [slug, setSlug] = useState("");
  const sendRequest = useSendPartnerRequest();

  const handleSend = async () => {
    if (!slug.trim()) return;
    try {
      await sendRequest.mutateAsync({ targetBusinessSlug: slug.trim() });
      setSlug("");
      toast.success("Request sent.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to send request.");
    }
  };

  return (
    <div className="bg-muted/30 grid grid-cols-1 gap-4 rounded-xl p-5 sm:grid-cols-[1fr_auto] sm:items-end">
      <div className="min-w-0 space-y-1.5">
        <Label className="text-sm font-medium">Business slug</Label>
        <Input
          placeholder="e.g. partner-cafe"
          className="border-border/80 bg-background rounded-lg"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
      </div>
      <Button
        onClick={handleSend}
        disabled={!slug.trim() || sendRequest.isPending}
        className="shrink-0 rounded-lg"
        icon={<Send className="h-4 w-4" />}
      >
        {sendRequest.isPending ? "Sending…" : "Send request"}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Incoming requests
// ---------------------------------------------------------------------------
function IncomingRequests() {
  const { data, isLoading } = usePartnerRequests("incoming");
  const respond = useRespondPartnerRequest();
  const pending = data?.items.filter((r) => r.status === "PENDING") ?? [];

  const handleAction = async (
    id: string,
    action: "accept" | "reject" | "permanently_reject",
  ) => {
    try {
      await respond.mutateAsync({ id, action });
      toast.success(
        action === "accept"
          ? "Partnership accepted!"
          : action === "reject"
            ? "Request rejected."
            : "Permanently rejected.",
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to respond.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
        <p className="text-muted-foreground text-sm font-medium">
          No pending requests
        </p>
        <p className="text-muted-foreground mt-1 max-w-[220px] text-xs">
          When someone sends a request, it will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border overflow-x-auto rounded-lg border">
      <table
        className="w-full border-collapse text-sm"
        style={{ minWidth: 520 }}
      >
        <thead>
          <tr className="border-border bg-muted/50 border-b">
            <th className="text-muted-foreground w-[28%] min-w-[90px] overflow-hidden px-3 py-2.5 text-left text-xs font-medium text-ellipsis whitespace-nowrap">
              Business
            </th>
            <th className="text-muted-foreground w-[22%] min-w-[70px] overflow-hidden px-3 py-2.5 text-left text-xs font-medium text-ellipsis whitespace-nowrap">
              Slug
            </th>
            <th className="text-muted-foreground w-[18%] min-w-[88px] overflow-hidden px-3 py-2.5 text-left text-xs font-medium text-ellipsis whitespace-nowrap">
              Date
            </th>
            <th className="w-[32%] min-w-[200px] px-3 py-2.5 text-right text-xs font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {pending.map((req) => (
            <tr
              key={req.id}
              className="border-border/60 bg-background hover:bg-muted/30 border-b last:border-b-0"
            >
              <td className="max-w-0 overflow-hidden px-3 py-2.5 font-medium text-ellipsis whitespace-nowrap">
                {req.senderBusiness?.name ?? "Unknown"}
              </td>
              <td className="text-muted-foreground max-w-0 overflow-hidden px-3 py-2.5 text-xs text-ellipsis whitespace-nowrap">
                @{req.senderBusiness?.slug}
              </td>
              <td className="text-muted-foreground shrink-0 overflow-hidden px-3 py-2.5 text-xs text-ellipsis whitespace-nowrap">
                {new Date(req.createdAt).toLocaleDateString()}
              </td>
              <td className="shrink-0 px-3 py-2.5 text-right">
                <div className="flex flex-nowrap justify-end gap-1.5">
                  <Button
                    size="sm"
                    className="h-7 shrink-0 rounded px-2 text-xs"
                    onClick={() => handleAction(req.id, "accept")}
                    disabled={respond.isPending}
                    icon={<Check className="h-3 w-3" />}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 rounded px-2 text-xs"
                    onClick={() => handleAction(req.id, "reject")}
                    disabled={respond.isPending}
                    icon={<X className="h-3 w-3" />}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 shrink-0 rounded px-2 text-xs"
                    onClick={() => handleAction(req.id, "permanently_reject")}
                    disabled={respond.isPending}
                    icon={<Trash2 className="h-3 w-3" />}
                  >
                    Permanent
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sent requests
// ---------------------------------------------------------------------------
function SentRequests() {
  const { data, isLoading } = usePartnerRequests("outgoing");
  const items = data?.items ?? [];

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary" className="rounded-full font-medium">
            Pending
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge variant="default" className="rounded-full font-medium">
            Accepted
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="rounded-full">
            Rejected
          </Badge>
        );
      case "PERMANENTLY_REJECTED":
        return (
          <Badge variant="destructive" className="rounded-full font-medium">
            Permanently rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="rounded-full">
            {status}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return <Skeleton className="h-14 w-full rounded-xl" />;
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
        <p className="text-muted-foreground text-sm font-medium">
          No sent requests
        </p>
        <p className="text-muted-foreground mt-1 max-w-[220px] text-xs">
          Requests you send will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border overflow-x-auto rounded-lg border">
      <table
        className="w-full border-collapse text-sm"
        style={{ minWidth: 460 }}
      >
        <thead>
          <tr className="border-border bg-muted/50 border-b">
            <th className="text-muted-foreground w-[28%] min-w-[90px] overflow-hidden px-3 py-2.5 text-left text-xs font-medium text-ellipsis whitespace-nowrap">
              Business
            </th>
            <th className="text-muted-foreground w-[22%] min-w-[70px] overflow-hidden px-3 py-2.5 text-left text-xs font-medium text-ellipsis whitespace-nowrap">
              Slug
            </th>
            <th className="text-muted-foreground w-[22%] min-w-[88px] overflow-hidden px-3 py-2.5 text-left text-xs font-medium text-ellipsis whitespace-nowrap">
              Date
            </th>
            <th className="w-[28%] min-w-[90px] px-3 py-2.5 text-right text-xs font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((req) => (
            <tr
              key={req.id}
              className="border-border/60 bg-background hover:bg-muted/30 border-b last:border-b-0"
            >
              <td className="max-w-0 overflow-hidden px-3 py-2.5 font-medium text-ellipsis whitespace-nowrap">
                {req.receiverBusiness?.name ?? "Unknown"}
              </td>
              <td className="text-muted-foreground max-w-0 overflow-hidden px-3 py-2.5 text-xs text-ellipsis whitespace-nowrap">
                @{req.receiverBusiness?.slug}
              </td>
              <td className="text-muted-foreground shrink-0 overflow-hidden px-3 py-2.5 text-xs text-ellipsis whitespace-nowrap">
                {new Date(req.createdAt).toLocaleDateString()}
              </td>
              <td className="shrink-0 px-3 py-2.5 text-right">
                {statusBadge(req.status)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Permanently rejected
// ---------------------------------------------------------------------------
function PermanentlyRejected() {
  const { data, isLoading } = usePartnerRequests("incoming");
  const unReject = useUnPermanentReject();
  const sendRequest = useSendPartnerRequest();
  const permanentlyRejected =
    data?.items.filter((r) => r.status === "PERMANENTLY_REJECTED") ?? [];

  if (isLoading || permanentlyRejected.length === 0) return null;

  const handleMoveToRejected = async (id: string) => {
    try {
      await unReject.mutateAsync(id);
      toast.success("Moved to rejected.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update.");
    }
  };

  const handleSendFromYourSide = async (req: PartnerRequestItem) => {
    const targetSlug = req.senderBusiness?.slug;
    if (!targetSlug) return;
    try {
      await sendRequest.mutateAsync({ targetBusinessSlug: targetSlug });
      toast.success("Request sent from your side.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to send request.");
    }
  };

  return (
    <section className="bg-muted/20 space-y-4 rounded-2xl p-6">
      <div>
        <h3 className="text-sm font-semibold">Permanently rejected</h3>
        <p className="text-muted-foreground mt-0.5 text-xs">
          They can&apos;t re-request until you move them back or send a request
          from your side.
        </p>
      </div>
      <div className="border-border overflow-x-auto rounded-lg border">
        <table
          className="w-full border-collapse text-sm"
          style={{ minWidth: 480 }}
        >
          <thead>
            <tr className="border-border bg-muted/50 border-b">
              <th className="text-muted-foreground w-[28%] min-w-[90px] overflow-hidden px-3 py-2.5 text-left text-xs font-medium text-ellipsis whitespace-nowrap">
                Business
              </th>
              <th className="text-muted-foreground w-[22%] min-w-[70px] overflow-hidden px-3 py-2.5 text-left text-xs font-medium text-ellipsis whitespace-nowrap">
                Slug
              </th>
              <th className="w-[50%] min-w-[220px] px-3 py-2.5 text-right text-xs font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {permanentlyRejected.map((req) => (
              <tr
                key={req.id}
                className="border-border/60 bg-background hover:bg-muted/30 border-b last:border-b-0"
              >
                <td className="max-w-0 overflow-hidden px-3 py-2.5 font-medium text-ellipsis whitespace-nowrap">
                  {req.senderBusiness?.name ?? "Unknown"}
                </td>
                <td className="text-muted-foreground max-w-0 overflow-hidden px-3 py-2.5 text-xs text-ellipsis whitespace-nowrap">
                  @{req.senderBusiness?.slug}
                </td>
                <td className="shrink-0 px-3 py-2.5 text-right">
                  <div className="flex flex-nowrap justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 shrink-0 rounded px-2 text-xs"
                      onClick={() => handleMoveToRejected(req.id)}
                      disabled={unReject.isPending}
                      icon={<Undo2 className="h-3 w-3" />}
                    >
                      Move to rejected
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 shrink-0 rounded px-2 text-xs"
                      onClick={() => handleSendFromYourSide(req)}
                      disabled={sendRequest.isPending}
                      icon={<ArrowRight className="h-3 w-3" />}
                    >
                      Send from your side
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Single partnership block (no card)
// ---------------------------------------------------------------------------
function PartnershipBlock({
  partnership,
  myBusinessId,
}: {
  partnership: Partnership;
  myBusinessId: string;
}) {
  const myMember = partnership.members.find(
    (m) => m.businessId === myBusinessId,
  );
  const partnerMember = partnership.members.find(
    (m) => m.businessId !== myBusinessId,
  );

  const update = useUpdatePartnership(partnership.id);
  const dissolve = useDissolvePartnership();
  const createCampaign = useCreatePartnerCampaign();

  const [exchangeRate, setExchangeRate] = useState(
    String(myMember?.exchangeRate ?? 1),
  );
  const [pointRate, setPointRate] = useState(
    String(myMember?.pointToCurrencyRate ?? 1),
  );
  const [confirmDissolve, setConfirmDissolve] = useState(false);

  const partnerLoyaltyType = partnerMember?.business.loyalty?.loyaltyType;
  const myLoyaltyType = myMember?.business.loyalty?.loyaltyType;
  const showPointRate =
    myLoyaltyType === "AMOUNT_SPENT" || myLoyaltyType === "VISIT_MADE";

  const myRateNum = Number(exchangeRate) || 1;
  const partnerRateNum = partnerMember?.exchangeRate ?? 1;
  const ratioLabel = `${myRateNum} : ${partnerRateNum}`;

  const myBusinessName = myMember?.business.name ?? MY_BUSINESS_LABEL;
  const partnerBusinessName = partnerMember?.business.name ?? PARTNER_LABEL;

  const handleSaveRates = async () => {
    try {
      await update.mutateAsync({
        exchangeRate: Number(exchangeRate),
        ...(showPointRate && { pointToCurrencyRate: Number(pointRate) }),
      });
      toast.success("Rates updated.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update.");
    }
  };

  const handleToggle = async (
    field: "sharedReferrals" | "shareReferralRewards" | "sharedCampaigns",
    value: boolean,
  ) => {
    try {
      await update.mutateAsync({ [field]: value });
      toast.success("Updated.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update.");
    }
  };

  const handleDissolve = async () => {
    try {
      await dissolve.mutateAsync(partnership.id);
      toast.success("Partnership dissolved.");
      setConfirmDissolve(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to dissolve.");
    }
  };

  const handleCreateCampaign = async () => {
    try {
      await createCampaign.mutateAsync({ partnershipId: partnership.id });
      toast.success("Campaign draft created.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create.");
    }
  };

  if (partnership.status === "DISSOLVED") {
    return (
      <div className="border-border/60 bg-muted/10 flex items-center justify-between rounded-2xl border px-5 py-4 opacity-70">
        <div>
          <p className="font-medium">
            {partnerMember?.business.name ?? "Unknown partner"}
          </p>
          <p className="text-muted-foreground text-xs">
            @{partnerMember?.business.slug} · Dissolved
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border/60 bg-muted/20 rounded-2xl border p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/15 flex h-12 w-12 items-center justify-center rounded-xl">
            <Handshake className="text-primary h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold">{partnerBusinessName}</p>
            <p className="text-muted-foreground text-xs">
              @{partnerMember?.business.slug} · Since{" "}
              {new Date(partnership.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge variant="default" className="rounded-full font-medium">
          Active
        </Badge>
      </div>

      {/* Exchange rates */}
      <div className="mb-6 space-y-4">
        <p className="text-sm font-semibold">Exchange rates</p>
        <p className="text-muted-foreground text-xs">
          You set your rate; partner sets theirs. Your rate converts your coins
          to their value; theirs converts their coins to yours.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="bg-background/80 space-y-2 rounded-xl p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Your rate (you set)
            </p>
            <p className="text-sm">
              1 of your coins →{" "}
              <span className="font-mono font-semibold">
                {exchangeRate || "—"}
              </span>{" "}
              at {partnerBusinessName}
            </p>
            <Input
              type="number"
              step="0.01"
              min={0.01}
              className="rounded-lg"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
            />
            {showPointRate && (
              <div className="mt-3 space-y-1">
                <Label className="text-xs">Point → currency</Label>
                <Input
                  type="number"
                  step="0.001"
                  min={0.001}
                  className="rounded-lg"
                  value={pointRate}
                  onChange={(e) => setPointRate(e.target.value)}
                />
              </div>
            )}
            <Button
              size="sm"
              className="mt-2 rounded-lg"
              onClick={handleSaveRates}
              disabled={update.isPending}
            >
              {update.isPending ? "Saving…" : "Save your rate"}
            </Button>
          </div>
          <div className="border-border/80 bg-muted/30 space-y-2 rounded-xl border border-dashed p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Partner&apos;s rate (they set)
            </p>
            <p className="text-sm">
              1 of {partnerBusinessName}&apos;s coins →{" "}
              <span className="font-mono font-semibold">{partnerRateNum}</span>{" "}
              at {myBusinessName}
            </p>
            <p className="text-muted-foreground text-xs">
              They set this on their Partners page. Read-only for you.
            </p>
          </div>
        </div>
        <div className="bg-primary/10 flex flex-wrap items-center gap-2 rounded-lg px-4 py-2">
          <span className="text-muted-foreground text-sm">
            Ratio (you → them : them → you)
          </span>
          <span className="text-primary font-mono text-sm font-semibold">
            {ratioLabel}
          </span>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Features */}
      <div className="space-y-4">
        <p className="text-sm font-semibold">Features</p>
        <div className="space-y-3">
          <div className="bg-background/60 hover:bg-background/80 flex items-start justify-between gap-4 rounded-lg px-4 py-3 transition-colors">
            <div>
              <Label className="text-sm">Shared referrals</Label>
              <p className="text-muted-foreground text-xs">
                New customers from either referral link join both businesses.
              </p>
            </div>
            <Switch
              checked={partnership.sharedReferrals}
              onCheckedChange={(v) => handleToggle("sharedReferrals", v)}
              disabled={update.isPending}
            />
          </div>
          {partnership.sharedReferrals && (
            <div className="bg-background/60 hover:bg-background/80 flex items-start justify-between gap-4 rounded-lg px-4 py-3 pl-6 transition-colors">
              <div>
                <Label className="text-sm">Share referral rewards</Label>
                <p className="text-muted-foreground text-xs">
                  <AlertTriangle className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
                  Rewards trigger from both programs (doubles cost per
                  referral).
                </p>
              </div>
              <Switch
                checked={partnership.shareReferralRewards}
                onCheckedChange={(v) => handleToggle("shareReferralRewards", v)}
                disabled={update.isPending}
              />
            </div>
          )}
          <div className="bg-background/60 hover:bg-background/80 flex items-start justify-between gap-4 rounded-lg px-4 py-3 transition-colors">
            <div>
              <Label className="text-sm">Shared campaigns</Label>
              <p className="text-muted-foreground text-xs">
                Joint campaigns visible in both dashboards.
              </p>
            </div>
            <Switch
              checked={partnership.sharedCampaigns}
              onCheckedChange={(v) => handleToggle("sharedCampaigns", v)}
              disabled={update.isPending}
            />
          </div>
        </div>
      </div>

      {partnership.sharedCampaigns && (
        <div className="bg-muted/30 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3">
          <p className="text-muted-foreground text-sm">
            Create a partner campaign for this partnership.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            onClick={handleCreateCampaign}
            disabled={createCampaign.isPending}
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            New campaign
          </Button>
        </div>
      )}

      <Separator className="my-6" />

      {/* Dissolve */}
      <div className="border-destructive/20 bg-destructive/5 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3">
        {confirmDissolve ? (
          <>
            <span className="text-destructive text-sm font-medium">
              Are you sure? This can&apos;t be undone easily.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg"
              onClick={() => setConfirmDissolve(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="rounded-lg"
              onClick={handleDissolve}
              disabled={dissolve.isPending}
            >
              Confirm dissolve
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="destructive"
            className="rounded-lg"
            onClick={() => setConfirmDissolve(true)}
            icon={<Trash2 className="h-3.5 w-3.5" />}
          >
            Dissolve partnership
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active partnerships
// ---------------------------------------------------------------------------
function ActivePartnerships({ myBusinessId }: { myBusinessId: string }) {
  const { data, isLoading } = usePartnerships();
  const partnerships = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (partnerships.length === 0) {
    return (
      <div className="border-border/60 bg-muted/20 flex flex-col items-center rounded-2xl border border-dashed py-20 text-center">
        <div className="bg-muted/50 flex h-16 w-16 items-center justify-center rounded-2xl">
          <Handshake className="text-muted-foreground/50 h-8 w-8" />
        </div>
        <p className="text-muted-foreground mt-5 text-base font-semibold">
          No partnerships yet
        </p>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          Send a request to get started. When they accept, you can set exchange
          rates and features here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {partnerships.map((p) => (
        <PartnershipBlock
          key={p.id}
          partnership={p}
          myBusinessId={myBusinessId}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Partner campaigns list
// ---------------------------------------------------------------------------
function PartnerCampaignsList() {
  const { data, isLoading } = usePartnerCampaigns();
  const items = data?.items ?? [];

  if (isLoading || items.length === 0) return null;

  return (
    <section className="bg-muted/20 space-y-4 rounded-2xl p-6">
      <h3 className="text-sm font-semibold">Partner campaigns</h3>
      <ul className="space-y-2">
        {items.map((c) => (
          <li className="border-border/60 bg-background/80 hover:bg-muted/30 flex items-center justify-between rounded-xl border px-4 py-3 transition-colors">
            <div>
              <p className="font-medium">{c.title || "Untitled campaign"}</p>
              <p className="text-muted-foreground text-xs">
                {c.createdByBusiness.name} · {c.status}
              </p>
            </div>
            <Badge
              variant={c.status === "DRAFT" ? "secondary" : "default"}
              className="rounded-full font-medium"
            >
              {c.status}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const PAGE_SUBTITLE =
  "Partner with other businesses to share referrals, run joint campaigns, and let customers use loyalty value across both. Each business sets only their own exchange rate.";

export function PartnersSettingsPageClient() {
  const { data: businessData } = useCurrentBusiness();
  const myBusinessId: string = businessData?.business?.id ?? "";

  const contentPadding = "px-6 lg:px-10";
  const contentMaxWidth = "max-w-3xl";

  const layoutProps: Pick<
    PageLayoutProps,
    | "size"
    | "scaffoldSectionClassName"
    | "scaffoldContainerClassName"
    | "title"
    | "subtitle"
  > = {
    size: "default",
    scaffoldSectionClassName: "h-full w-full pt-2 pb-0",
    scaffoldContainerClassName: `mx-auto w-full ${contentMaxWidth} ${contentPadding}`,
    title: "Connect with partners",
    subtitle: PAGE_SUBTITLE,
  };

  return (
    <PageLayout {...layoutProps}>
      <div
        className={`mx-auto w-full ${contentMaxWidth} ${contentPadding} space-y-14 pb-20`}
      >
        {/* Setup */}
        <section className="space-y-5">
          <h2 className="text-lg font-semibold tracking-tight">Setup</h2>
          <div className="space-y-4">
            <GeneralSettings />
            <SendRequest />
          </div>
        </section>

        <Separator className="my-2" />

        {/* Requests */}
        <section className="space-y-8">
          <h2 className="text-lg font-semibold tracking-tight">Requests</h2>

          <div className="w-full">
            <h3 className="text-muted-foreground mb-3 text-sm font-medium">
              Incoming
            </h3>
            <div className="border-border bg-muted/20 min-h-[120px] rounded-2xl border p-4">
              <IncomingRequests />
            </div>
          </div>

          <div className="w-full">
            <h3 className="text-muted-foreground mb-3 text-sm font-medium">
              Sent
            </h3>
            <div className="border-border bg-muted/20 min-h-[120px] rounded-2xl border p-4">
              <SentRequests />
            </div>
          </div>
        </section>

        <PermanentlyRejected />

        <Separator className="my-2" />

        {/* Active partnerships */}
        <section className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Active partnerships
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Exchange rates and features per partner.
            </p>
          </div>
          <ActivePartnerships myBusinessId={myBusinessId} />
        </section>

        <PartnerCampaignsList />
      </div>
    </PageLayout>
  );
}
