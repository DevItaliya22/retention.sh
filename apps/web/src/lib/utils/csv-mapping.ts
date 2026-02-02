/**
 * Column mapping: our column key (lowercase, no special chars) -> user's CSV header (as-is).
 * Use this for backend: when you have a row keyed by user headers, use mapping[ourCol] to get the user header key.
 */
export type ColumnMapping = Record<string, string>;

export interface ColumnMappingConfig {
  /** Our column keys (required). Lowercase, no special chars. */
  requiredColumns: readonly string[];
  /** Our column keys (optional). Lowercase, no special chars. */
  optionalColumns?: readonly string[];
}

const SKIP_VALUE = "__skip__";

/** Value used in UI to mean "no mapping" for optional columns. */
export const COLUMN_MAPPING_SKIP = SKIP_VALUE;

/** Normalize headers for consistent key matching (empty -> __empty_N). */
export function normalizeHeadersForSelect(headers: string[]): string[] {
  return headers.map((h, i) =>
    h === "" || h.trim() === ""
      ? `__empty_${i}`
      : h.trim().replace(/^\uFEFF/, ""),
  );
}

/**
 * Returns true if all required columns have a mapping (and the value is not skip).
 */
export function isMappingValid(
  config: ColumnMappingConfig,
  mapping: ColumnMapping,
): boolean {
  for (const key of config.requiredColumns) {
    const value = mapping[key];
    if (value === undefined || value === "" || value === SKIP_VALUE) {
      return false;
    }
  }
  return true;
}

/**
 * Returns the one-to-one mapping for backend use.
 * Keys = our column keys, values = user's CSV header that maps to it.
 * Only includes entries where user header was actually selected (excludes skipped optional).
 */
export function getMappingForBackend(mapping: ColumnMapping): ColumnMapping {
  const out: ColumnMapping = {};
  for (const [ourCol, userHeader] of Object.entries(mapping)) {
    if (
      userHeader !== undefined &&
      userHeader !== "" &&
      userHeader !== SKIP_VALUE
    ) {
      out[ourCol] = userHeader;
    }
  }
  return out;
}

/**
 * Given a row keyed by user headers and our mapping, returns a row keyed by our column keys.
 * Use when sending data to backend so each field is under our expected key.
 */
export function applyMappingToRow(
  row: Record<string, unknown>,
  mapping: ColumnMapping,
): Record<string, unknown> {
  const backendMapping = getMappingForBackend(mapping);
  const out: Record<string, unknown> = {};
  for (const [ourCol, userHeader] of Object.entries(backendMapping)) {
    out[ourCol] = row[userHeader];
  }
  return out;
}

/**
 * Parse CSV text and return the first row (headers) only.
 * Handles quoted fields per RFC 4180.
 */
export function parseCsvHeaders(csvText: string): string[] {
  const firstRow = parseFirstCsvRow(csvText);
  return firstRow.map((h) => h.trim().replace(/^\uFEFF/, ""));
}

function parseFirstCsvRow(csvText: string): string[] {
  const row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const c = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (c === '"') {
        if (next === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
        continue;
      }
      current += c;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      continue;
    }
    if (c === "," || c === "\n" || c === "\r") {
      row.push(current.trim());
      if (c === "\n" || (c === "\r" && next !== "\n")) {
        return row;
      }
      current = "";
      if (c === "\r") continue;
      continue;
    }
    if (c === "\r") continue;
    current += c;
  }

  row.push(current.trim());
  return row;
}

/**
 * Parse CSV text into rows of cell values (array of arrays).
 * Handles quoted fields per RFC 4180. First row is typically headers.
 */
export function parseCsvToRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const c = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (c === '"') {
        if (next === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
        continue;
      }
      current += c;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      continue;
    }
    if (c === ",") {
      row.push(current.trim());
      current = "";
      continue;
    }
    if (c === "\n" || (c === "\r" && next !== "\n")) {
      row.push(current.trim());
      current = "";
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      continue;
    }
    if (c === "\r") continue;
    current += c;
  }

  row.push(current.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);
  return rows;
}

/**
 * Common header aliases for smart mapping.
 * Maps our column key to an array of possible user header names (all lowercase).
 */
const HEADER_ALIASES: Record<string, string[]> = {
  // Customer fields
  phone: [
    "phone",
    "phonenumber",
    "phone_number",
    "mobile",
    "mobilenumber",
    "mobile_number",
    "contact",
    "tel",
    "telephone",
  ],
  name: [
    "name",
    "fullname",
    "full_name",
    "customername",
    "customer_name",
    "username",
    "user_name",
  ],
  email: ["email", "emailaddress", "email_address", "mail", "e-mail"],
  addressline1: [
    "addressline1",
    "address_line_1",
    "address1",
    "address_1",
    "address",
    "streetaddress",
    "street_address",
    "street",
  ],
  addressline2: [
    "addressline2",
    "address_line_2",
    "address2",
    "address_2",
    "apartment",
    "apt",
    "suite",
    "unit",
  ],
  city: ["city", "town", "locality"],
  state: ["state", "province", "region"],
  country: ["country", "nation"],
  postalcode: [
    "postalcode",
    "postal_code",
    "zipcode",
    "zip_code",
    "zip",
    "pincode",
    "pin_code",
    "pin",
  ],
  tags: ["tags", "tag", "labels", "label", "categories", "category"],
  isblocked: [
    "isblocked",
    "is_blocked",
    "blocked",
    "block",
    "blacklisted",
    "blacklist",
  ],

  // SKU fields
  sku: [
    "sku",
    "sku_code",
    "skucode",
    "product_code",
    "productcode",
    "item_code",
    "itemcode",
    "code",
  ],
  description: [
    "description",
    "desc",
    "details",
    "product_description",
    "productdescription",
  ],
  price: ["price", "unit_price", "unitprice", "cost", "amount", "rate", "mrp"],
  unit: ["unit", "uom", "unit_of_measure", "unitofmeasure", "measurement"],
  isactive: ["isactive", "is_active", "active", "enabled", "status"],

  // Category fields
  sortorder: [
    "sortorder",
    "sort_order",
    "order",
    "sequence",
    "position",
    "rank",
  ],
};

/**
 * Normalize a header string for matching (lowercase, remove special chars except underscore).
 */
function normalizeForMatching(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9_]/g, "");
}

/**
 * Creates an auto-mapping by matching user headers to our columns (case-insensitive).
 * Uses common aliases for smart matching.
 *
 * @param userHeaders - Headers from CSV/Excel file
 * @param config - Our column configuration
 * @returns Auto-generated mapping (ourCol -> userHeader)
 */
export function createAutoMapping(
  userHeaders: string[],
  config: ColumnMappingConfig,
): ColumnMapping {
  const mapping: ColumnMapping = {};
  const usedHeaders = new Set<string>();

  const allOurColumns = [
    ...config.requiredColumns,
    ...(config.optionalColumns ?? []),
  ];

  // Normalize all user headers for comparison
  const normalizedUserHeaders = userHeaders.map((h) => ({
    original: h,
    normalized: normalizeForMatching(h),
  }));

  for (const ourCol of allOurColumns) {
    const ourColNormalized = normalizeForMatching(ourCol);
    const aliases = HEADER_ALIASES[ourColNormalized] ?? [ourColNormalized];

    // Find a matching user header
    for (const { original, normalized } of normalizedUserHeaders) {
      if (usedHeaders.has(original)) continue;

      // Check if normalized header matches any alias
      if (aliases.includes(normalized)) {
        mapping[ourCol] = original;
        usedHeaders.add(original);
        break;
      }
    }
  }

  return mapping;
}
