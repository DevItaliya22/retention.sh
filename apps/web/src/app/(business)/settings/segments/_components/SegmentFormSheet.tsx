"use client";

import type { SegmentItem } from "@/hooks/segments";
import {
  createSegmentSchema,
  FREQUENCY_MAX,
  FREQUENCY_MIN,
  MONETARY_ABSOLUTE_MAX,
  MONETARY_MAX,
  MONETARY_MIN,
  RECENCY_DAYS_MAX,
  RECENCY_DAYS_MIN,
  RECENCY_MONTHS_MAX,
  RECENCY_MONTHS_MIN,
  SEGMENT_DESCRIPTION_MAX_LENGTH,
  SEGMENT_NAME_MAX_LENGTH,
  SEGMENT_SLUG_MAX_LENGTH,
} from "@/lib/schemas/segment";
import {
  getSegmentTagHex,
  SEGMENT_TAG_PALETTE,
  tagColourForPersist,
} from "@/lib/segmentation/segment-tag-colours";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Textarea,
} from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function getRecencyLimits(unit: string) {
  return unit === "MONTHS"
    ? { min: RECENCY_MONTHS_MIN, max: RECENCY_MONTHS_MAX }
    : { min: RECENCY_DAYS_MIN, max: RECENCY_DAYS_MAX };
}

function validateRecency(val: string, unit: string): string | null {
  if (!val.trim()) return null;
  const n = parseFloat(val);
  if (Number.isNaN(n)) return "Enter a number";
  const { min, max } = getRecencyLimits(unit);
  if (n < min || n > max) return `Must be ${min}–${max}`;
  return null;
}

function validateFrequency(val: string): string | null {
  if (!val.trim()) return null;
  const n = parseInt(val, 10);
  if (Number.isNaN(n)) return "Enter a whole number";
  if (n < FREQUENCY_MIN || n > FREQUENCY_MAX)
    return `Must be ${FREQUENCY_MIN}–${FREQUENCY_MAX}`;
  return null;
}

function getMonetaryLimits(unit: string) {
  return unit === "ABSOLUTE"
    ? { min: MONETARY_MIN, max: MONETARY_ABSOLUTE_MAX }
    : { min: MONETARY_MIN, max: MONETARY_MAX };
}

function validateMonetary(val: string, unit: string): string | null {
  if (!val.trim()) return null;
  const n = parseFloat(val);
  if (Number.isNaN(n)) return "Enter a number";
  const { min, max } = getMonetaryLimits(unit);
  if (n < min || n > max)
    return unit === "ABSOLUTE"
      ? `Must be ₹${min}–${max}`
      : `Must be ${min}–${max}x`;
  return null;
}

function clampRecency(val: string, unit: string): string {
  const n = parseFloat(val);
  if (Number.isNaN(n)) return val;
  const { min, max } = getRecencyLimits(unit);
  return String(Math.round(Math.min(max, Math.max(min, n))));
}

function clampFrequency(val: string): string {
  const n = parseInt(val, 10);
  if (Number.isNaN(n)) return val;
  return String(Math.min(FREQUENCY_MAX, Math.max(FREQUENCY_MIN, n)));
}

function clampMonetary(val: string, unit: string): string {
  const n = parseFloat(val);
  if (Number.isNaN(n)) return val;
  const { min, max } = getMonetaryLimits(unit);
  const clamped = Math.min(max, Math.max(min, n));
  return unit === "ABSOLUTE"
    ? String(Math.round(clamped))
    : clamped % 1 === 0
      ? String(clamped)
      : clamped.toFixed(2);
}

const OPERATORS = [
  { value: "LESS_THAN", label: "Less than" },
  { value: "GREATER_THAN", label: "Greater than" },
  { value: "LESS_THAN_OR_EQUAL", label: "Less than or equal" },
  { value: "GREATER_THAN_OR_EQUAL", label: "Greater than or equal" },
  { value: "IN_RANGE", label: "In range" },
  { value: "NOT_IN_RANGE", label: "Not in range" },
] as const;

const UNITS = [
  { value: "DAYS", label: "Days" },
  { value: "MONTHS", label: "Months" },
] as const;

const MONETARY_UNITS = [
  { value: "RATIO", label: "Ratio (× avg spend)" },
  { value: "ABSOLUTE", label: "Absolute (₹)" },
] as const;

interface SegmentFormSheetProps {
  segment: SegmentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
}

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function SegmentFormSheet({
  segment,
  open,
  onOpenChange,
  onSave,
  isSaving,
}: SegmentFormSheetProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [recencyOp, setRecencyOp] = useState<string | null>(null);
  const [recencyVal, setRecencyVal] = useState<string>("");
  const [recencyVal2, setRecencyVal2] = useState<string>("");
  const [recencyUnit, setRecencyUnit] = useState<string>("DAYS");
  const [freqOp, setFreqOp] = useState<string | null>(null);
  const [freqVal, setFreqVal] = useState<string>("");
  const [freqVal2, setFreqVal2] = useState<string>("");
  const [monUnit, setMonUnit] = useState<string>("RATIO");
  const [monOp, setMonOp] = useState<string | null>(null);
  const [monVal, setMonVal] = useState<string>("");
  const [monVal2, setMonVal2] = useState<string>("");
  const [selectedTagColour, setSelectedTagColour] = useState<string>(
    SEGMENT_TAG_PALETTE[10],
  );

  useEffect(() => {
    if (segment) {
      setName(segment.name);
      setSlug(segment.slug);
      setDescription(segment.description ?? "");
      setRecencyOp(segment.recencyOperator);
      setRecencyVal(segment.recencyValue?.toString() ?? "");
      setRecencyVal2(segment.recencyValue2?.toString() ?? "");
      setRecencyUnit(segment.recencyUnit ?? "DAYS");
      setFreqOp(segment.frequencyOperator);
      setFreqVal(segment.frequencyValue?.toString() ?? "");
      setFreqVal2(segment.frequencyValue2?.toString() ?? "");
      setMonUnit(segment.monetaryUnit ?? "RATIO");
      setMonOp(segment.monetaryOperator);
      setMonVal(segment.monetaryValue?.toString() ?? "");
      setMonVal2(segment.monetaryValue2?.toString() ?? "");
      setSelectedTagColour(getSegmentTagHex(segment.tagColour, segment.slug));
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setRecencyOp(null);
      setRecencyVal("");
      setRecencyVal2("");
      setRecencyUnit("DAYS");
      setFreqOp(null);
      setFreqVal("");
      setFreqVal2("");
      setMonUnit("RATIO");
      setMonOp(null);
      setMonVal("");
      setMonVal2("");
      setSelectedTagColour(SEGMENT_TAG_PALETTE[10]);
    }
  }, [segment, open]);

  const handleNameChange = useCallback(
    (v: string) => {
      setName(v);
      if (!segment) setSlug(slugFromName(v));
    },
    [segment],
  );

  const buildData = useCallback((): Record<string, unknown> => {
    const needsRange = (op: string | null) =>
      op === "IN_RANGE" || op === "NOT_IN_RANGE";

    const slugKey = slug.trim().toLowerCase().replace(/\s+/g, "-") || "segment";

    return {
      name: name.trim(),
      slug: slugKey,
      description: description.trim() || null,
      ...(segment ? {} : { proTip: null }),
      sortOrder: 0,
      tagColour: tagColourForPersist(selectedTagColour, slugKey),
      recencyOperator: recencyOp || null,
      recencyValue: recencyVal ? parseFloat(recencyVal) : null,
      recencyValue2:
        needsRange(recencyOp) && recencyVal2 ? parseFloat(recencyVal2) : null,
      recencyUnit: recencyOp ? recencyUnit : null,
      frequencyOperator: freqOp || null,
      frequencyValue: freqVal ? parseInt(freqVal, 10) : null,
      frequencyValue2:
        needsRange(freqOp) && freqVal2 ? parseInt(freqVal2, 10) : null,
      monetaryUnit: monOp ? monUnit : null,
      monetaryOperator: monOp || null,
      monetaryValue: monVal ? parseFloat(monVal) : null,
      monetaryValue2: needsRange(monOp) && monVal2 ? parseFloat(monVal2) : null,
    };
  }, [
    segment,
    name,
    slug,
    description,
    recencyOp,
    recencyVal,
    recencyVal2,
    recencyUnit,
    freqOp,
    freqVal,
    freqVal2,
    monUnit,
    monOp,
    monVal,
    monVal2,
    selectedTagColour,
  ]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    const data = buildData();
    const result = createSegmentSchema.safeParse(data);
    if (!result.success) {
      const msg = result.error.issues?.[0];
      toast.error(
        msg ? `${msg.path.join(".")}: ${msg.message}` : "Invalid segment data",
      );
      return;
    }
    await onSave(data);
  }, [name, slug, onSave, buildData]);

  const needsRange = (op: string | null) =>
    op === "IN_RANGE" || op === "NOT_IN_RANGE";

  const recencyErr1 = useMemo(
    () => validateRecency(recencyVal, recencyUnit),
    [recencyVal, recencyUnit],
  );
  const recencyErr2 = useMemo(
    () => validateRecency(recencyVal2, recencyUnit),
    [recencyVal2, recencyUnit],
  );
  const freqErr1 = useMemo(() => validateFrequency(freqVal), [freqVal]);
  const freqErr2 = useMemo(() => validateFrequency(freqVal2), [freqVal2]);
  const monErr1 = useMemo(
    () => validateMonetary(monVal, monUnit),
    [monVal, monUnit],
  );
  const monErr2 = useMemo(
    () => validateMonetary(monVal2, monUnit),
    [monVal2, monUnit],
  );

  const handleRecencyBlur = useCallback(
    (which: 1 | 2) => {
      if (which === 1 && recencyVal)
        setRecencyVal(clampRecency(recencyVal, recencyUnit));
      if (which === 2 && recencyVal2)
        setRecencyVal2(clampRecency(recencyVal2, recencyUnit));
    },
    [recencyVal, recencyVal2, recencyUnit],
  );
  const handleFreqBlur = useCallback(
    (which: 1 | 2) => {
      if (which === 1 && freqVal) setFreqVal(clampFrequency(freqVal));
      if (which === 2 && freqVal2) setFreqVal2(clampFrequency(freqVal2));
    },
    [freqVal, freqVal2],
  );
  const handleMonBlur = useCallback(
    (which: 1 | 2) => {
      if (which === 1 && monVal) setMonVal(clampMonetary(monVal, monUnit));
      if (which === 2 && monVal2) setMonVal2(clampMonetary(monVal2, monUnit));
    },
    [monVal, monVal2, monUnit],
  );

  const hasErrors =
    !!recencyErr1 ||
    !!recencyErr2 ||
    !!freqErr1 ||
    !!freqErr2 ||
    !!monErr1 ||
    !!monErr2;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{segment ? "Edit segment" : "Create segment"}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. VIP"
              maxLength={SEGMENT_NAME_MAX_LENGTH}
            />
          </div>
          <div className="space-y-2">
            <Label>Slug (URL-safe)</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. vip"
              maxLength={SEGMENT_SLUG_MAX_LENGTH}
            />
          </div>
          <div className="space-y-2">
            <Label>Tag colour</Label>
            <p className="text-muted-foreground text-xs">
              Shown on the segments list and RFM overview. Defaults follow
              system presets; pick any swatch to override.
            </p>
            <div
              className="grid w-full min-w-0 grid-cols-5 gap-2 p-1"
              role="listbox"
              aria-label="Segment colour"
            >
              {SEGMENT_TAG_PALETTE.map((hex) => {
                const selected = selectedTagColour === hex;
                return (
                  <button
                    key={hex}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      "focus-visible:ring-ring size-9 shrink-0 rounded-md border-2 transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
                      selected
                        ? "z-[1] scale-105 border-transparent shadow-sm ring-2 ring-blue-500 ring-inset dark:ring-blue-400"
                        : "border-transparent ring-0",
                    )}
                    style={{ backgroundColor: hex }}
                    title={hex}
                    onClick={() => setSelectedTagColour(hex)}
                  />
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this segment..."
              rows={2}
              maxLength={SEGMENT_DESCRIPTION_MAX_LENGTH}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="mb-3 text-sm font-medium">
              Recency (days since last visit)
            </h4>
            <p className="text-muted-foreground mb-2 text-xs">
              Days: {RECENCY_DAYS_MIN}–{RECENCY_DAYS_MAX}, months:{" "}
              {RECENCY_MONTHS_MIN}–{RECENCY_MONTHS_MAX}
            </p>
            <div className="flex flex-wrap gap-2">
              <Select
                value={recencyOp ?? "none"}
                onValueChange={(v) => {
                  const op = v === "none" ? null : v;
                  setRecencyOp(op);
                  if (op) {
                    if (recencyVal === "") setRecencyVal("0");
                    if (
                      (op === "IN_RANGE" || op === "NOT_IN_RANGE") &&
                      recencyVal2 === ""
                    )
                      setRecencyVal2("0");
                  }
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="No filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No filter</SelectItem>
                  {OPERATORS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {recencyOp && (
                <>
                  <div className="flex flex-col gap-0.5">
                    <Input
                      type="number"
                      min={
                        recencyUnit === "MONTHS"
                          ? RECENCY_MONTHS_MIN
                          : RECENCY_DAYS_MIN
                      }
                      max={
                        recencyUnit === "MONTHS"
                          ? RECENCY_MONTHS_MAX
                          : RECENCY_DAYS_MAX
                      }
                      placeholder="Value"
                      value={recencyVal}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "" || v === "-" || v === ".")
                          setRecencyVal(v);
                        else {
                          const n = parseFloat(v);
                          if (Number.isNaN(n)) setRecencyVal(v);
                          else {
                            const { min, max } = getRecencyLimits(recencyUnit);
                            if (n > max) setRecencyVal(String(max));
                            else if (n < min) setRecencyVal(String(min));
                            else setRecencyVal(v);
                          }
                        }
                      }}
                      onBlur={() => handleRecencyBlur(1)}
                      aria-invalid={!!recencyErr1}
                      className={cn(
                        "w-20",
                        recencyErr1 &&
                          "border-destructive focus-visible:ring-destructive/50",
                      )}
                    />
                    {recencyErr1 && (
                      <p className="text-destructive text-xs">{recencyErr1}</p>
                    )}
                  </div>
                  {needsRange(recencyOp) && (
                    <div className="flex flex-col gap-0.5">
                      <Input
                        type="number"
                        min={
                          recencyUnit === "MONTHS"
                            ? RECENCY_MONTHS_MIN
                            : RECENCY_DAYS_MIN
                        }
                        max={
                          recencyUnit === "MONTHS"
                            ? RECENCY_MONTHS_MAX
                            : RECENCY_DAYS_MAX
                        }
                        placeholder="To"
                        value={recencyVal2}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || v === "-" || v === ".")
                            setRecencyVal2(v);
                          else {
                            const n = parseFloat(v);
                            if (Number.isNaN(n)) setRecencyVal2(v);
                            else {
                              const { min, max } =
                                getRecencyLimits(recencyUnit);
                              if (n > max) setRecencyVal2(String(max));
                              else if (n < min) setRecencyVal2(String(min));
                              else setRecencyVal2(v);
                            }
                          }
                        }}
                        onBlur={() => handleRecencyBlur(2)}
                        aria-invalid={!!recencyErr2}
                        className={cn(
                          "w-20",
                          recencyErr2 &&
                            "border-destructive focus-visible:ring-destructive/50",
                        )}
                      />
                      {recencyErr2 && (
                        <p className="text-destructive text-xs">
                          {recencyErr2}
                        </p>
                      )}
                    </div>
                  )}
                  <Select value={recencyUnit} onValueChange={setRecencyUnit}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="mb-3 text-sm font-medium">Frequency (visits)</h4>
            <p className="text-muted-foreground mb-2 text-xs">
              Visits: {FREQUENCY_MIN}–{FREQUENCY_MAX}
            </p>
            <div className="flex flex-wrap gap-2">
              <Select
                value={freqOp ?? "none"}
                onValueChange={(v) => {
                  const op = v === "none" ? null : v;
                  setFreqOp(op);
                  if (op) {
                    if (freqVal === "") setFreqVal("0");
                    if (
                      (op === "IN_RANGE" || op === "NOT_IN_RANGE") &&
                      freqVal2 === ""
                    )
                      setFreqVal2("0");
                  }
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="No filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No filter</SelectItem>
                  {OPERATORS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {freqOp && (
                <>
                  <div className="flex flex-col gap-0.5">
                    <Input
                      type="number"
                      min={FREQUENCY_MIN}
                      max={FREQUENCY_MAX}
                      placeholder="Value"
                      value={freqVal}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "" || v === "-") setFreqVal(v);
                        else {
                          const n = parseInt(v, 10);
                          if (Number.isNaN(n)) setFreqVal(v);
                          else {
                            if (n > FREQUENCY_MAX)
                              setFreqVal(String(FREQUENCY_MAX));
                            else if (n < FREQUENCY_MIN)
                              setFreqVal(String(FREQUENCY_MIN));
                            else setFreqVal(v);
                          }
                        }
                      }}
                      onBlur={() => handleFreqBlur(1)}
                      aria-invalid={!!freqErr1}
                      className={cn(
                        "w-20",
                        freqErr1 &&
                          "border-destructive focus-visible:ring-destructive/50",
                      )}
                    />
                    {freqErr1 && (
                      <p className="text-destructive text-xs">{freqErr1}</p>
                    )}
                  </div>
                  {needsRange(freqOp) && (
                    <div className="flex flex-col gap-0.5">
                      <Input
                        type="number"
                        min={FREQUENCY_MIN}
                        max={FREQUENCY_MAX}
                        placeholder="To"
                        value={freqVal2}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || v === "-") setFreqVal2(v);
                          else {
                            const n = parseInt(v, 10);
                            if (Number.isNaN(n)) setFreqVal2(v);
                            else {
                              if (n > FREQUENCY_MAX)
                                setFreqVal2(String(FREQUENCY_MAX));
                              else if (n < FREQUENCY_MIN)
                                setFreqVal2(String(FREQUENCY_MIN));
                              else setFreqVal2(v);
                            }
                          }
                        }}
                        onBlur={() => handleFreqBlur(2)}
                        aria-invalid={!!freqErr2}
                        className={cn(
                          "w-20",
                          freqErr2 &&
                            "border-destructive focus-visible:ring-destructive/50",
                        )}
                      />
                      {freqErr2 && (
                        <p className="text-destructive text-xs">{freqErr2}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="mb-3 text-sm font-medium">Monetary</h4>
            <p className="text-muted-foreground mb-2 text-xs">
              {monUnit === "ABSOLUTE"
                ? `Lifetime spend (₹): ${MONETARY_MIN}–${MONETARY_ABSOLUTE_MAX.toLocaleString()}`
                : `Ratio (× avg spend): ${MONETARY_MIN}–${MONETARY_MAX}x`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={monUnit}
                onValueChange={(v) => {
                  setMonUnit(v);
                  if (
                    monVal &&
                    v === "ABSOLUTE" &&
                    parseFloat(monVal) > MONETARY_ABSOLUTE_MAX
                  )
                    setMonVal(String(MONETARY_ABSOLUTE_MAX));
                  if (
                    monVal &&
                    v === "RATIO" &&
                    parseFloat(monVal) > MONETARY_MAX
                  )
                    setMonVal(String(MONETARY_MAX));
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONETARY_UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={monOp ?? "none"}
                onValueChange={(v) => {
                  const op = v === "none" ? null : v;
                  setMonOp(op);
                  if (op) {
                    if (monVal === "") setMonVal("0");
                    if (
                      (op === "IN_RANGE" || op === "NOT_IN_RANGE") &&
                      monVal2 === ""
                    )
                      setMonVal2("0");
                  }
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="No filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No filter</SelectItem>
                  {OPERATORS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {monOp && (
                <>
                  <div className="flex flex-col gap-0.5">
                    <Input
                      type="number"
                      step={monUnit === "ABSOLUTE" ? "1" : "0.1"}
                      min={MONETARY_MIN}
                      max={
                        monUnit === "ABSOLUTE"
                          ? MONETARY_ABSOLUTE_MAX
                          : MONETARY_MAX
                      }
                      placeholder={
                        monUnit === "ABSOLUTE" ? "e.g. 50000" : "e.g. 3"
                      }
                      value={monVal}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "" || v === "-" || v === ".") setMonVal(v);
                        else {
                          const n = parseFloat(v);
                          if (Number.isNaN(n)) setMonVal(v);
                          else {
                            const max =
                              monUnit === "ABSOLUTE"
                                ? MONETARY_ABSOLUTE_MAX
                                : MONETARY_MAX;
                            if (n > max) setMonVal(String(max));
                            else if (n < MONETARY_MIN)
                              setMonVal(String(MONETARY_MIN));
                            else setMonVal(v);
                          }
                        }
                      }}
                      onBlur={() => handleMonBlur(1)}
                      aria-invalid={!!monErr1}
                      className={cn(
                        "w-20",
                        monErr1 &&
                          "border-destructive focus-visible:ring-destructive/50",
                      )}
                    />
                    {monErr1 && (
                      <p className="text-destructive text-xs">{monErr1}</p>
                    )}
                  </div>
                  {needsRange(monOp) && (
                    <div className="flex flex-col gap-0.5">
                      <Input
                        type="number"
                        step={monUnit === "ABSOLUTE" ? "1" : "0.1"}
                        min={MONETARY_MIN}
                        max={
                          monUnit === "ABSOLUTE"
                            ? MONETARY_ABSOLUTE_MAX
                            : MONETARY_MAX
                        }
                        placeholder="To"
                        value={monVal2}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || v === "-" || v === ".") setMonVal2(v);
                          else {
                            const n = parseFloat(v);
                            if (Number.isNaN(n)) setMonVal2(v);
                            else {
                              const max =
                                monUnit === "ABSOLUTE"
                                  ? MONETARY_ABSOLUTE_MAX
                                  : MONETARY_MAX;
                              if (n > max) setMonVal2(String(max));
                              else if (n < MONETARY_MIN)
                                setMonVal2(String(MONETARY_MIN));
                              else setMonVal2(v);
                            }
                          }
                        }}
                        onBlur={() => handleMonBlur(2)}
                        aria-invalid={!!monErr2}
                        className={cn(
                          "w-20",
                          monErr2 &&
                            "border-destructive focus-visible:ring-destructive/50",
                        )}
                      />
                      {monErr2 && (
                        <p className="text-destructive text-xs">{monErr2}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || hasErrors}>
            {segment ? "Save" : "Create"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
