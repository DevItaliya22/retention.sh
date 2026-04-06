import type { Prisma } from "@reelo/db";
import type { LogMessageParams } from "./types";

export async function logMessage(
  tx: Prisma.TransactionClient,
  params: LogMessageParams,
): Promise<void> {
  await tx.messageLog.create({
    data: {
      businessId: params.businessId,
      channel: params.channel,
      recipient: params.recipient,
      subject: params.subject ?? null,
      body: params.body,
      source: params.source,
      sourceId: params.sourceId ?? null,
      scheduledAt: params.scheduledAt ?? null,
    },
  });
}
