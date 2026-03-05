import type { MessageChannel, MessageSource } from "@reelo/db";

export interface ChannelConfig {
  whatsappEnabled?: boolean;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
}

export interface LogMessageParams {
  channel: MessageChannel;
  recipient: string;
  subject?: string | null;
  body: string;
  source: MessageSource;
  sourceId?: string | null;
  businessId: string;
}
