export type Path = string;

export function getByPath(obj: unknown, path: Path): unknown {
  if (!path) return obj;
  const parts = path.split(".");
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

export function pickByPaths<T extends Record<string, any>>(
  obj: T,
  paths: Path[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const p of paths) {
    out[p] = getByPath(obj, p);
  }
  return out;
}

export function stableSerialize(value: unknown): string {
  return JSON.stringify(sortForJson(value));
}

function sortForJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForJson);
  if (!value || typeof value !== "object") return value;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const out: Record<string, unknown> = {};
  for (const k of keys) out[k] = sortForJson(obj[k]);
  return out;
}
