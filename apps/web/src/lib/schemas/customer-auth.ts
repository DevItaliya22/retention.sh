import { slugSchema } from "@/lib/schemas/common";
import { z } from "zod";

export const requestOtpSchema = z.object({
  phoneNumber: z.string().min(6).max(20).trim(),
  businessSlug: slugSchema,
});

export const registerRequestOtpSchema = z.object({
  phoneNumber: z.string().min(6).max(20).trim(),
  businessSlug: slugSchema,
  name: z.string().min(1).max(255).trim(),
});

export const verifyOtpSchema = z.object({
  phoneNumber: z.string().min(6).max(20).trim(),
  otp: z.string().min(4).max(8).trim(),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type RegisterRequestOtpInput = z.infer<typeof registerRequestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
