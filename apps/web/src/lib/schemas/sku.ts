import { z } from "zod";

import { nameSchema } from "./common";

const skuCodeSchema = z
  .string()
  .min(1, "SKU code is required")
  .max(100, "SKU code is too long (max 100 characters)")
  .trim();

const descriptionSchema = z
  .string()
  .max(500, "Description is too long (max 500 characters)")
  .trim()
  .optional()
  .nullable();

const priceSchema = z
  .number()
  .min(0, "Price must be 0 or greater")
  .optional()
  .nullable();

const unitSchema = z
  .string()
  .max(50, "Unit is too long (max 50 characters)")
  .trim()
  .optional()
  .nullable();

// SKU schemas
export const createSkuSchema = z.object({
  sku: skuCodeSchema,
  name: nameSchema,
  description: descriptionSchema,
  price: priceSchema,
  unit: unitSchema,
  categoryId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateSkuSchema = z.object({
  sku: skuCodeSchema.optional(),
  name: nameSchema.optional(),
  description: descriptionSchema,
  price: priceSchema,
  unit: unitSchema,
  categoryId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const skusQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).default(10).optional(),
  sort: z.string().max(100).optional(),
  name: z.string().max(255).trim().optional(),
  sku: z.string().max(100).trim().optional(),
  categoryId: z.string().uuid().optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) =>
      v === "true" ? true : v === "false" ? false : undefined,
    ),
});

// Category schemas
export const createCategorySchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  sortOrder: z.number().int().min(0).default(0).optional(),
});

export const updateCategorySchema = z.object({
  name: nameSchema.optional(),
  description: descriptionSchema,
  sortOrder: z.number().int().min(0).optional(),
});

export const categoriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  perPage: z.coerce.number().int().min(1).max(500).default(10).optional(),
  sort: z.string().max(100).optional(),
  name: z.string().max(255).trim().optional(),
});

export type CreateSkuInput = z.infer<typeof createSkuSchema>;
export type UpdateSkuInput = z.infer<typeof updateSkuSchema>;
export type SkusQueryInput = z.infer<typeof skusQuerySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoriesQueryInput = z.infer<typeof categoriesQuerySchema>;
