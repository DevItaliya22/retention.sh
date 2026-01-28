/**
 * Column mapping: our column key (lowercase, no special chars) -> user's CSV header (as-is).
 * Use this for backend: when you have a row keyed by user headers, use mapping[ourCol] to get the user header key.
 */
export type ColumnMapping = Record<string, string>;

export interface ColumnMappingConfig {
  /** Our column keys (required). Lowercase, no special chars. */
  requiredColumns: string[];
  /** Our column keys (optional). Lowercase, no special chars. */
  optionalColumns?: string[];
}

const SKIP_VALUE = "__skip__";

/** Value used in UI to mean "no mapping" for optional columns. */
export const COLUMN_MAPPING_SKIP = SKIP_VALUE;

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
