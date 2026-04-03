const RATING_LABELS: Record<string, string> = {
  rating_1: "1-star feedback",
  rating_2: "2-star feedback",
  rating_3: "3-star feedback",
  rating_4: "4-star feedback",
  rating_5: "5-star feedback",
};

function parseAudienceKey(key: string): { prefix: string; param: string } {
  const colonIndex = key.indexOf(":");
  if (colonIndex === -1) return { prefix: key, param: "" };
  return {
    prefix: key.slice(0, colonIndex),
    param: key.slice(colonIndex + 1),
  };
}

export function getAudienceLabel(key: string): string {
  const { prefix, param } = parseAudienceKey(key);
  if (prefix === "all" && param === "customers") return "ALL customers";
  if (prefix === "segment") return param.replace(/-/g, " ");
  if (prefix === "feedback")
    return RATING_LABELS[param] ?? `Feedback: ${param}`;
  return key;
}

export function getAudiencePrefix(key: string): string {
  return parseAudienceKey(key).prefix;
}
