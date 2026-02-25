"use client";

import { PageLayout, ScaffoldContainer } from "@/components/layouts";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
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

// ---------------------------------------------------------------------------
// General Settings Card
// ---------------------------------------------------------------------------
function GeneralSettingsCard() {
  const { data, isLoading } = usePartnershipSettings();
  const updateSettings = useUpdatePartnershipSettings();
  const [receiveOffers, setReceiveOffers] = useState<boolean | null>(null);
  const [maxPartners, setMaxPartners] = useState<string>("");

  const currentReceive =
    receiveOffers ?? data?.receivePartnershipOffers ?? false;
  const currentMax = maxPartners || String(data?.maxPartnerAllowed ?? 1);

  const hasChanges =
    (receiveOffers !== null &&
      receiveOffers !== data?.receivePartnershipOffers) ||
    (maxPartners !== "" && Number(maxPartners) !== data?.maxPartnerAllowed);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        receivePartnershipOffers: currentReceive,
        maxPartnerAllowed: Number(currentMax),
      });
      setReceiveOffers(null);
      setMaxPartners("");
      toast.success("Partnership settings updated.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update settings.");
    }
  };

  if (isLoading) {
    return (
      <Card className="gap-0 p-0!">
        <CardHeader className="border-b py-2!">
          <CardTitle className="text-base font-medium">
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 py-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          General Settings
        </CardTitle>
        <CardDescription className="text-xs">
          Control whether other businesses can send you partnership requests.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-4 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">Receive Partnership Offers</Label>
            <p className="text-muted-foreground text-xs">
              When enabled, other businesses can send you partnership requests.
            </p>
          </div>
          <Switch
            checked={currentReceive}
            onCheckedChange={(v) => setReceiveOffers(v)}
          />
        </div>
        <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
          <div className="col-span-4 flex flex-col gap-1">
            <Label className="text-sm">Maximum Partners Allowed</Label>
            <p className="text-muted-foreground text-xs">
              How many active partnerships your business can have
              simultaneously.
            </p>
          </div>
          <div className="col-span-8">
            <Input
              type="number"
              min={1}
              max={100}
              value={currentMax}
              onChange={(e) => setMaxPartners(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-end space-x-2 px-6 py-2">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateSettings.isPending}
        >
          {updateSettings.isPending ? "Saving..." : "Save"}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Send Request Card
// ---------------------------------------------------------------------------
function SendRequestCard() {
  const [slug, setSlug] = useState("");
  const sendRequest = useSendPartnerRequest();

  const handleSend = async () => {
    if (!slug.trim()) return;
    try {
      await sendRequest.mutateAsync({ targetBusinessSlug: slug.trim() });
      setSlug("");
      toast.success("Partnership request sent.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send request.");
    }
  };

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          Send Partnership Request
        </CardTitle>
        <CardDescription className="text-xs">
          Enter the business slug of the partner you want to connect with.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 border-b px-6 py-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label className="text-sm">Business Slug</Label>
          <Input
            placeholder="e.g. partner-cafe"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={!slug.trim() || sendRequest.isPending}
          icon={<Send className="h-4 w-4" />}
        >
          {sendRequest.isPending ? "Sending..." : "Send Request"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Incoming Requests Table
// ---------------------------------------------------------------------------
function IncomingRequestsSection() {
  const { data, isLoading } = usePartnerRequests("incoming");
  const respond = useRespondPartnerRequest();

  const pending = data?.items.filter((r) => r.status === "PENDING") ?? [];

  const handleAction = async (
    id: string,
    action: "accept" | "reject" | "permanently_reject",
  ) => {
    try {
      await respond.mutateAsync({ id, action });
      const msg =
        action === "accept"
          ? "Partnership request accepted!"
          : action === "reject"
            ? "Request rejected."
            : "Request permanently rejected.";
      toast.success(msg);
    } catch (e: any) {
      toast.error(e?.message || "Failed to respond.");
    }
  };

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          Incoming Requests
        </CardTitle>
        <CardDescription className="text-xs">
          Partnership requests from other businesses.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : pending.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No pending requests.
          </p>
        ) : (
          <div className="divide-y">
            {pending.map((req) => (
              <div
                key={req.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">
                    {req.senderBusiness?.name ?? "Unknown"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    @{req.senderBusiness?.slug} &middot;{" "}
                    {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAction(req.id, "accept")}
                    disabled={respond.isPending}
                    icon={<Check className="h-3 w-3" />}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(req.id, "reject")}
                    disabled={respond.isPending}
                    icon={<X className="h-3 w-3" />}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAction(req.id, "permanently_reject")}
                    disabled={respond.isPending}
                    icon={<Trash2 className="h-3 w-3" />}
                  >
                    Permanent Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Sent Requests Table
// ---------------------------------------------------------------------------
function SentRequestsSection() {
  const { data, isLoading } = usePartnerRequests("outgoing");
  const items = data?.items ?? [];

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "ACCEPTED":
        return <Badge variant="default">Accepted</Badge>;
      case "REJECTED":
        return <Badge variant="outline">Rejected</Badge>;
      case "PERMANENTLY_REJECTED":
        return <Badge variant="destructive">Permanently Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">Sent Requests</CardTitle>
        <CardDescription className="text-xs">
          Partnership requests you have sent to other businesses.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No sent requests.
          </p>
        ) : (
          <div className="divide-y">
            {items.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {req.receiverBusiness?.name ?? "Unknown"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    @{req.receiverBusiness?.slug} &middot;{" "}
                    {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {statusBadge(req.status)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Permanently Rejected Table
// ---------------------------------------------------------------------------
function PermanentlyRejectedSection() {
  const { data, isLoading } = usePartnerRequests("incoming");
  const unReject = useUnPermanentReject();
  const sendRequest = useSendPartnerRequest();

  const permanentlyRejected =
    data?.items.filter((r) => r.status === "PERMANENTLY_REJECTED") ?? [];

  if (isLoading || permanentlyRejected.length === 0) return null;

  const handleMoveToRejected = async (id: string) => {
    try {
      await unReject.mutateAsync(id);
      toast.success("Moved to rejected. They can now re-request.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update.");
    }
  };

  const handleSendFromYourSide = async (req: PartnerRequestItem) => {
    const targetSlug = req.senderBusiness?.slug;
    if (!targetSlug) return;
    try {
      await sendRequest.mutateAsync({ targetBusinessSlug: targetSlug });
      toast.success("Partnership request sent from your side.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send request.");
    }
  };

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          Permanently Rejected
        </CardTitle>
        <CardDescription className="text-xs">
          These businesses cannot re-request until you move them back to
          rejected, or you send a request from your side.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-4">
        <div className="divide-y">
          {permanentlyRejected.map((req) => (
            <div
              key={req.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium">
                  {req.senderBusiness?.name ?? "Unknown"}
                </p>
                <p className="text-muted-foreground text-xs">
                  @{req.senderBusiness?.slug}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMoveToRejected(req.id)}
                  disabled={unReject.isPending}
                  icon={<Undo2 className="h-3 w-3" />}
                >
                  Move to Rejected
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSendFromYourSide(req)}
                  disabled={sendRequest.isPending}
                  icon={<ArrowRight className="h-3 w-3" />}
                >
                  Send Request from Your Side
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Active Partnership Card
// ---------------------------------------------------------------------------
function ActivePartnershipCard({
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

  const handleSaveRates = async () => {
    try {
      await update.mutateAsync({
        exchangeRate: Number(exchangeRate),
        ...(showPointRate && { pointToCurrencyRate: Number(pointRate) }),
      });
      toast.success("Exchange rates updated.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update.");
    }
  };

  const handleToggle = async (
    field: "sharedReferrals" | "shareReferralRewards" | "sharedCampaigns",
    value: boolean,
  ) => {
    try {
      await update.mutateAsync({ [field]: value });
      toast.success("Partnership settings updated.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update.");
    }
  };

  const handleDissolve = async () => {
    try {
      await dissolve.mutateAsync(partnership.id);
      toast.success("Partnership dissolved.");
      setConfirmDissolve(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to dissolve.");
    }
  };

  const handleCreateCampaign = async () => {
    try {
      await createCampaign.mutateAsync({ partnershipId: partnership.id });
      toast.success("Partner campaign draft created.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to create campaign.");
    }
  };

  if (partnership.status === "DISSOLVED") {
    return (
      <Card className="gap-0 border-dashed p-0! opacity-60">
        <CardHeader className="border-b py-2!">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">
              {partnerMember?.business.name ?? "Unknown Partner"}
            </CardTitle>
            <Badge variant="outline">Dissolved</Badge>
          </div>
          <CardDescription className="text-xs">
            @{partnerMember?.business.slug}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            <Handshake className="mr-2 inline-block h-4 w-4" />
            {partnerMember?.business.name ?? "Unknown Partner"}
          </CardTitle>
          <Badge variant="default">Active</Badge>
        </div>
        <CardDescription className="text-xs">
          @{partnerMember?.business.slug} &middot; Partner since{" "}
          {new Date(partnership.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-5 border-b px-6 py-4">
        {/* Exchange Rates */}
        <div>
          <p className="mb-2 text-sm font-medium">Exchange Rates (Your Side)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Exchange Rate</Label>
              <Input
                type="number"
                step="0.01"
                min={0.01}
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                1 {myMember?.business.name} rupee = {exchangeRate} rupee at{" "}
                {partnerMember?.business.name}
              </p>
            </div>
            {showPointRate && (
              <div>
                <Label className="text-xs">Point to Currency Rate</Label>
                <Input
                  type="number"
                  step="0.001"
                  min={0.001}
                  value={pointRate}
                  onChange={(e) => setPointRate(e.target.value)}
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  1 point = {pointRate} rupee (for{" "}
                  {myLoyaltyType?.replace("_", " ").toLowerCase()} loyalty)
                </p>
              </div>
            )}
          </div>
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              onClick={handleSaveRates}
              disabled={update.isPending}
            >
              Save Rates
            </Button>
          </div>
        </div>

        {/* Partner's rates (read-only) */}
        <div className="bg-muted/40 rounded-md p-3">
          <p className="mb-1 text-xs font-medium">
            Partner&apos;s Rates (read-only)
          </p>
          <p className="text-muted-foreground text-xs">
            Exchange Rate: {partnerMember?.exchangeRate ?? 1} &middot;
            Point-to-Currency: {partnerMember?.pointToCurrencyRate ?? 1}
            {partnerLoyaltyType &&
              ` (${partnerLoyaltyType.replace("_", " ").toLowerCase()})`}
          </p>
        </div>

        {/* Feature Toggles */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Partnership Features</p>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Shared Referrals</Label>
              <p className="text-muted-foreground text-xs">
                New customers from either business&apos;s referral link join
                both businesses.
              </p>
            </div>
            <Switch
              checked={partnership.sharedReferrals}
              onCheckedChange={(v) => handleToggle("sharedReferrals", v)}
              disabled={update.isPending}
            />
          </div>
          {partnership.sharedReferrals && (
            <div className="flex items-center justify-between pl-4">
              <div>
                <Label className="text-sm">Share Referral Rewards</Label>
                <p className="text-muted-foreground text-xs">
                  <AlertTriangle className="mr-1 inline-block h-3 w-3 text-amber-500" />
                  When enabled, referral rewards trigger from both programs.
                  This doubles the cost per referral.
                </p>
              </div>
              <Switch
                checked={partnership.shareReferralRewards}
                onCheckedChange={(v) => handleToggle("shareReferralRewards", v)}
                disabled={update.isPending}
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Shared Campaigns</Label>
              <p className="text-muted-foreground text-xs">
                Create joint campaigns visible in both business dashboards.
              </p>
            </div>
            <Switch
              checked={partnership.sharedCampaigns}
              onCheckedChange={(v) => handleToggle("sharedCampaigns", v)}
              disabled={update.isPending}
            />
          </div>
        </div>

        {/* Partner Campaign Action */}
        {partnership.sharedCampaigns && (
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Create a new partner campaign for this partnership.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateCampaign}
              disabled={createCampaign.isPending}
              icon={<Plus className="h-3 w-3" />}
            >
              New Campaign
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-end px-6 py-2">
        {confirmDissolve ? (
          <div className="flex items-center gap-2">
            <p className="text-destructive text-sm">
              Are you sure? This cannot be undone easily.
            </p>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDissolve}
              disabled={dissolve.isPending}
            >
              Confirm Dissolve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmDissolve(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setConfirmDissolve(true)}
            icon={<Trash2 className="h-3 w-3" />}
          >
            Dissolve Partnership
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Active Partnerships Section
// ---------------------------------------------------------------------------
function ActivePartnershipsSection({ myBusinessId }: { myBusinessId: string }) {
  const { data, isLoading } = usePartnerships();
  const partnerships = data?.items ?? [];

  if (isLoading) {
    return (
      <Card className="gap-0 p-0!">
        <CardHeader className="border-b py-2!">
          <CardTitle className="text-base font-medium">
            Active Partnerships
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-6 py-4">
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (partnerships.length === 0) {
    return (
      <Card className="gap-0 p-0!">
        <CardHeader className="border-b py-2!">
          <CardTitle className="text-base font-medium">
            Active Partnerships
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-8">
          <div className="flex flex-col items-center text-center">
            <Handshake className="text-muted-foreground/50 h-10 w-10" />
            <p className="text-muted-foreground mt-2 text-sm">
              No partnerships yet. Send a request to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium">Active Partnerships</h3>
      {partnerships.map((p) => (
        <ActivePartnershipCard
          key={p.id}
          partnership={p}
          myBusinessId={myBusinessId}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Partner Campaigns Section
// ---------------------------------------------------------------------------
function PartnerCampaignsSection() {
  const { data, isLoading } = usePartnerCampaigns();
  const items = data?.items ?? [];

  if (isLoading || items.length === 0) return null;

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          Partner Campaigns
        </CardTitle>
        <CardDescription className="text-xs">
          Campaigns shared across your partnerships.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-4">
        <div className="divide-y">
          {items.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">
                  {c.title || "Untitled campaign"}
                </p>
                <p className="text-muted-foreground text-xs">
                  Created by {c.createdByBusiness.name} &middot; {c.status}
                </p>
              </div>
              <Badge variant={c.status === "DRAFT" ? "secondary" : "default"}>
                {c.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export function PartnersSettingsPageClient() {
  const { data: businessData } = useCurrentBusiness();
  const myBusinessId = businessData?.business?.id ?? "";

  return (
    <PageLayout
      size="default"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
    >
      <ScaffoldContainer>
        <div className="space-y-6 pb-8">
          <GeneralSettingsCard />
          <SendRequestCard />
          <IncomingRequestsSection />
          <ActivePartnershipsSection myBusinessId={myBusinessId} />
          <PartnerCampaignsSection />
          <SentRequestsSection />
          <PermanentlyRejectedSection />
        </div>
      </ScaffoldContainer>
    </PageLayout>
  );
}
