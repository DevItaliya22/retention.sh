import { z } from "zod";
import { storageAssetSchema } from "./shared";

export const customersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).default(10).optional(),
  sort: z.string().max(100, "Sort parameter is too long").optional(),
  name: z.string().max(255, "Name filter is too long").trim().optional(),
  email: z.string().max(254, "Email filter is too long").trim().optional(),
  phone: z.string().max(20, "Phone filter is too long").trim().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  segment: z.string().max(500).trim().optional(),
});

export type CustomersQueryInput = z.infer<typeof customersQuerySchema>;

/** Validates customer detail route param – slugId is BusinessCustomer.slugId (uuid) */
export const customerSlugIdParamSchema = z.object({
  slugId: z.string().uuid("Invalid customer slug ID"),
});
export type CustomerSlugIdParam = z.infer<typeof customerSlugIdParamSchema>;

/** Query params for customer detail (bills + activity pagination) */
export const customerDetailQuerySchema = z.object({
  billsPage: z.coerce.number().int().min(1).default(1).optional(),
  billsPerPage: z.coerce.number().int().min(1).max(50).default(5).optional(),
  activityPage: z.coerce.number().int().min(1).default(1).optional(),
  activityPerPage: z.coerce.number().int().min(1).max(50).default(5).optional(),
});
export type CustomerDetailQueryInput = z.infer<
  typeof customerDetailQuerySchema
>;

// Customer validation limits
const MAX_PHONE_LENGTH = 20;
const MAX_NAME_LENGTH = 255;
const MAX_EMAIL_LENGTH = 254;
const MAX_ADDRESS_LENGTH = 500;
const MAX_CITY_LENGTH = 100;
const MAX_STATE_LENGTH = 100;
const MAX_COUNTRY_LENGTH = 100;
const MAX_POSTAL_CODE_LENGTH = 20;
const MAX_TAGS_LENGTH = 1000;

/** Single customer item for import */
export const customerImportItemSchema = z.object({
  // Required - phone is the unique identifier for customers
  phone: z
    .string()
    .min(1, "Phone number is required")
    .max(
      MAX_PHONE_LENGTH,
      `Phone number is too long (max ${MAX_PHONE_LENGTH} chars)`,
    )
    .trim(),

  // Optional fields
  name: z
    .string()
    .max(MAX_NAME_LENGTH, `Name is too long (max ${MAX_NAME_LENGTH} chars)`)
    .trim()
    .optional()
    .nullable(),
  email: z
    .string()
    .email("Invalid email format")
    .max(MAX_EMAIL_LENGTH, `Email is too long (max ${MAX_EMAIL_LENGTH} chars)`)
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")), // Allow empty string as null

  // Address fields
  addressLine1: z
    .string()
    .max(
      MAX_ADDRESS_LENGTH,
      `Address Line 1 is too long (max ${MAX_ADDRESS_LENGTH} chars)`,
    )
    .trim()
    .optional()
    .nullable(),
  addressLine2: z
    .string()
    .max(
      MAX_ADDRESS_LENGTH,
      `Address Line 2 is too long (max ${MAX_ADDRESS_LENGTH} chars)`,
    )
    .trim()
    .optional()
    .nullable(),
  city: z
    .string()
    .max(MAX_CITY_LENGTH, `City is too long (max ${MAX_CITY_LENGTH} chars)`)
    .trim()
    .optional()
    .nullable(),
  state: z
    .string()
    .max(MAX_STATE_LENGTH, `State is too long (max ${MAX_STATE_LENGTH} chars)`)
    .trim()
    .optional()
    .nullable(),
  country: z
    .string()
    .max(
      MAX_COUNTRY_LENGTH,
      `Country is too long (max ${MAX_COUNTRY_LENGTH} chars)`,
    )
    .trim()
    .optional()
    .nullable(),
  postalCode: z
    .string()
    .max(
      MAX_POSTAL_CODE_LENGTH,
      `Postal/Zip Code is too long (max ${MAX_POSTAL_CODE_LENGTH} chars)`,
    )
    .trim()
    .optional()
    .nullable(),

  // Business-specific fields
  // Comma-separated tags
  tags: z
    .string()
    .max(
      MAX_TAGS_LENGTH,
      `Tags value is too long (max ${MAX_TAGS_LENGTH} chars)`,
    )
    .trim()
    .optional()
    .nullable(),
  isBlocked: z.boolean().optional().nullable(),
});

export const customerAvatarSchema = z.object({
  avatarUrl: z.string().max(2048).optional().nullable(),
  avatarAsset: storageAssetSchema.optional().nullable(),
});

export type CustomerAvatarInput = z.infer<typeof customerAvatarSchema>;

export const customerImportSchema = z.object({
  items: z.array(customerImportItemSchema),
});

export type CustomerImportItemInput = z.infer<typeof customerImportItemSchema>;
export type CustomerImportInput = z.infer<typeof customerImportSchema>;
