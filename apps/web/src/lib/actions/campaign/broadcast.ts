import { resolveAudiences } from "@/lib/audiences";
import { db } from "@reelo/db";

const BATCH_SIZE = 500;

type BroadcastRow = {
  businessId: string;
  channel: "WHATSAPP" | "EMAIL";
  recipient: string;
  subject: string | null;
  body: string;
  source: "CAMPAIGN_BROADCAST";
  sourceId: string | null;
  campaignId: string;
  scheduledAt: Date;
};

export async function createCampaignBroadcastLogs(
  campaignId: string,
): Promise<number> {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: {
      businessId: true,
      title: true,
      offerStatement: true,
      targetAudiences: true,
      messageScheduledAt: true,
      whatsappEnabled: true,
      emailEnabled: true,
    },
  });

  if (!campaign) return 0;
  if (!campaign.whatsappEnabled && !campaign.emailEnabled) return 0;

  const existingCount = await db.messageLog.count({
    where: { campaignId, source: "CAMPAIGN_BROADCAST" },
  });
  if (existingCount > 0) return 0;

  let customerIds: string[];
  const audiences = campaign.targetAudiences ?? [];
  if (audiences.length > 0) {
    customerIds = await resolveAudiences(campaign.businessId, audiences);
  } else {
    const wallets = await db.wallet.findMany({
      where: { businessId: campaign.businessId },
      select: { customerId: true },
    });
    customerIds = wallets.map((w) => w.customerId);
  }

  if (customerIds.length === 0) return 0;

  const customers = await db.customer.findMany({
    where: { id: { in: customerIds } },
    select: {
      id: true,
      email: true,
      user: { select: { phoneNumber: true } },
    },
  });

  const title = campaign.title ?? "Campaign";
  const body = campaign.offerStatement ?? `You have a new offer from ${title}!`;
  const scheduledAt =
    campaign.messageScheduledAt instanceof Date
      ? campaign.messageScheduledAt
      : campaign.messageScheduledAt
        ? new Date(campaign.messageScheduledAt)
        : new Date();

  const rows: BroadcastRow[] = [];

  for (const customer of customers) {
    const phone = customer.user?.phoneNumber;
    const email = customer.email;

    if (campaign.whatsappEnabled && phone) {
      rows.push({
        businessId: campaign.businessId,
        channel: "WHATSAPP",
        recipient: phone,
        subject: null,
        body,
        source: "CAMPAIGN_BROADCAST",
        sourceId: campaignId,
        campaignId,
        scheduledAt,
      });
    }

    if (campaign.emailEnabled && email) {
      rows.push({
        businessId: campaign.businessId,
        channel: "EMAIL",
        recipient: email,
        subject: title,
        body,
        source: "CAMPAIGN_BROADCAST",
        sourceId: campaignId,
        campaignId,
        scheduledAt,
      });
    }
  }

  if (rows.length === 0) return 0;

  let totalCreated = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const result = await db.messageLog.createMany({ data: batch });
    totalCreated += result.count;
  }

  return totalCreated;
}
