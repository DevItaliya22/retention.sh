import type { Prisma } from "@reelo/db";
import { db } from "@reelo/db";

type PartnershipEventType =
  | "REQUEST_SENT"
  | "REQUEST_ACCEPTED"
  | "REQUEST_REJECTED"
  | "REQUEST_PERMANENTLY_REJECTED"
  | "REQUEST_UN_PERMANENTLY_REJECTED"
  | "PARTNERSHIP_DISSOLVED"
  | "SETTINGS_UPDATED"
  | "SETTINGS_LOCKED"
  | "SETTINGS_UNLOCK_REQUESTED"
  | "SETTINGS_UNLOCK_ACCEPTED"
  | "SETTINGS_UNLOCK_REJECTED";

interface WriteLogOptions {
  actorBusinessId: string;
  event: PartnershipEventType;
  partnershipId?: string;
  partnerRequestId?: string;
  metadata?: Prisma.InputJsonValue;
}

export async function writePartnershipLog(
  options: WriteLogOptions,
): Promise<void> {
  try {
    await db.partnershipEventLog.create({
      data: {
        actorBusinessId: options.actorBusinessId,
        event: options.event,
        ...(options.partnershipId && {
          partnershipId: options.partnershipId,
        }),
        ...(options.partnerRequestId && {
          partnerRequestId: options.partnerRequestId,
        }),
        ...(options.metadata !== undefined && { metadata: options.metadata }),
      },
    });
  } catch (err) {
    // Logging must never break the main operation
    console.error("Failed to write partnership event log:", err);
  }
}
