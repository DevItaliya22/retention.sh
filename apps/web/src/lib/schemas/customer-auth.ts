import { z } from "zod";

export const requestOtpSchema = z.object({
  phoneNumber: z.string().min(6).max(20).trim(),
});

export const verifyOtpSchema = z.object({
  phoneNumber: z.string().min(6).max(20).trim(),
  otp: z.string().min(4).max(8).trim(),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
