import { z } from "zod";

export const customersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).default(10).optional(),
  sort: z.string().max(100, "Sort parameter is too long").optional(),
  name: z.string().max(255, "Name filter is too long").trim().optional(),
  email: z.string().max(254, "Email filter is too long").trim().optional(),
  phone: z.string().max(20, "Phone filter is too long").trim().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export type CustomersQueryInput = z.infer<typeof customersQuerySchema>;

/** Validates customer detail route param – slugId is BusinessCustomer.slugId (uuid) */
export const customerSlugIdParamSchema = z.object({
  slugId: z.string().uuid("Invalid customer slug ID"),
});
export type CustomerSlugIdParam = z.infer<typeof customerSlugIdParamSchema>;
