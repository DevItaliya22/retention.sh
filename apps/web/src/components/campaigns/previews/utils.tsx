import type { ReactNode } from "react";

/** Parses **bold** markers in text and returns React nodes with <strong> tags */
export function renderBoldText(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-extrabold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function formatExpiryDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export const DEFAULT_THEME = "#7F4899";
export const DEFAULT_TEXT = "#ffffff";
