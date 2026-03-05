import { z } from "zod";

export const messageLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).default(10).optional(),
  sort: z.string().max(100).optional(),
  channel: z.enum(["EMAIL", "WHATSAPP", "SMS"]).optional(),
  source: z.string().max(100).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type MessageLogQueryInput = z.infer<typeof messageLogQuerySchema>;
