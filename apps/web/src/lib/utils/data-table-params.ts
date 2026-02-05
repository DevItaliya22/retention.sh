/**
 * Single source of truth for DataTable URL params: prefix and filter keys per table.
 * Tables and hooks both use getDataTableConfig(id) so they cannot get out of sync.
 * buildApiParams is the only place that maps prefixed URL params to API params.
 */

export type DataTableConfigId =
  | "skus"
  | "bills"
  | "customers"
  | "cashiers"
  | "categories"
  | "referralStats"
  | "loyaltyStats";

export interface DataTableConfigEntry {
  prefix: string;
  filterKeys: string[];
}

export const DATA_TABLE_CONFIG: Record<
  DataTableConfigId,
  DataTableConfigEntry
> = {
  skus: {
    prefix: "skus",
    filterKeys: ["name", "sku", "categoryId", "isActive"],
  },
  bills: {
    prefix: "bills",
    filterKeys: ["billNumber", "email", "customerName", "dateFrom", "dateTo"],
  },
  customers: {
    prefix: "customers",
    filterKeys: ["name", "email", "phone", "dateFrom", "dateTo"],
  },
  cashiers: {
    prefix: "cashiers",
    filterKeys: ["name", "email", "isActive"],
  },
  categories: {
    prefix: "categories",
    filterKeys: ["name", "parentId", "all"],
  },
  referralStats: {
    prefix: "referralStats",
    filterKeys: [],
  },
  loyaltyStats: {
    prefix: "loyaltyStats",
    filterKeys: [
      "type",
      "source",
      "customerName",
      "billNumber",
      "dateFrom",
      "dateTo",
    ],
  },
};

export function getDataTableConfig(
  id: DataTableConfigId,
): DataTableConfigEntry {
  return DATA_TABLE_CONFIG[id];
}

/**
 * Map DataTable URL params (e.g. skusPage, skusPerPage, skusSort) to API params
 * (page, perPage, sort). Optionally forward filter keys from searchParams.
 * Fallback to unprefixed page/perPage/sort when prefixed keys are missing.
 */
export function buildApiParams(
  searchParams: URLSearchParams,
  prefix: string,
  filterKeys: string[] = [],
): URLSearchParams {
  const params = new URLSearchParams();
  const pageKey = `${prefix}Page`;
  const perPageKey = `${prefix}PerPage`;
  const sortKey = `${prefix}Sort`;

  const page = searchParams.get(pageKey) ?? searchParams.get("page") ?? "1";
  const perPage =
    searchParams.get(perPageKey) ?? searchParams.get("perPage") ?? "10";
  params.set("page", page);
  params.set("perPage", perPage);

  const sortRaw = searchParams.get(sortKey) ?? searchParams.get("sort");
  if (sortRaw) {
    try {
      const parsed = JSON.parse(sortRaw) as Array<{
        id: string;
        desc: boolean;
      }>;
      const first = parsed[0];
      if (first?.id)
        params.set("sort", `${first.id}:${first.desc ? "desc" : "asc"}`);
    } catch {
      if (sortRaw.includes(":")) params.set("sort", sortRaw);
    }
  }

  for (const key of filterKeys) {
    const val = searchParams.get(key);
    if (val != null && val !== "") params.set(key, val);
  }
  return params;
}
