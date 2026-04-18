import { db } from "@reelo/db";

export async function logGameAudit(input: {
  businessId: string;
  campaignId?: string | null;
  actorUserId?: string | null;
  action: string;
  requestId?: string | null;
  beforeJson?: unknown;
  afterJson?: unknown;
}) {
  await db.gameAuditLog.create({
    data: {
      businessId: input.businessId,
      campaignId: input.campaignId ?? undefined,
      actorUserId: input.actorUserId ?? undefined,
      action: input.action,
      requestId: input.requestId ?? undefined,
      beforeJson: input.beforeJson as object | undefined,
      afterJson: input.afterJson as object | undefined,
    },
  });
}
