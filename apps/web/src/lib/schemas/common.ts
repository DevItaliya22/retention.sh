import {
  isReservedSlug,
  SLUG_MAX_LENGTH,
  SLUG_MIN_LENGTH,
} from "@/lib/utils/slug";
import { z } from "zod";

// Common field validations with proper length limits
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .max(254, "Email is too long (max 254 characters)")
  .email("Invalid email address")
  .trim();

export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(255, "Name is too long (max 255 characters)")
  .trim();

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(128, "Password is too long (max 128 characters)");

export const optionalPasswordSchema = z
  .string()
  .max(128, "Password is too long (max 128 characters)")
  .optional()
  .or(z.literal(""));

export const slugSchema = z
  .string()
  .min(SLUG_MIN_LENGTH, `Slug is too short (min ${SLUG_MIN_LENGTH} characters)`)
  .max(SLUG_MAX_LENGTH, `Slug is too long (max ${SLUG_MAX_LENGTH} characters)`)
  .regex(
    /^[a-z0-9-]+$/,
    "Slug can only contain lowercase letters, numbers, and hyphens",
  )
  .refine((slug) => !isReservedSlug(slug), {
    message: "This slug is reserved and cannot be used",
  })
  .trim();

export const businessNameSchema = z
  .string()
  .min(2, "Business name is too short (min 2 characters)")
  .max(255, "Business name is too long (max 255 characters)")
  .trim();

export const pointsNameSchema = z
  .string()
  .min(1, "Points name is required")
  .max(50, "Points name is too long (max 50 characters)")
  .trim();

export const currencySymbolSchema = z
  .string()
  .min(1, "Currency symbol is required")
  .max(10, "Currency symbol is too long (max 10 characters)")
  .trim();

export const currencyCodeSchema = z
  .string()
  .min(1, "Currency code is required")
  .max(10, "Currency code is too long (max 10 characters)")
  .trim()
  .toUpperCase();

export const themeColorSchema = z
  .string()
  .max(7, "Theme color is too long")
  .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format (must be #RRGGBB)")
  .optional()
  .nullable();

export const urlSchema = z
  .string()
  .max(2048, "URL is too long (max 2048 characters)")
  .url("Invalid URL format")
  .optional()
  .nullable();

export const textSchema = (maxLength: number = 1000) =>
  z
    .string()
    .max(maxLength, `Text is too long (max ${maxLength} characters)`)
    .optional()
    .nullable();
