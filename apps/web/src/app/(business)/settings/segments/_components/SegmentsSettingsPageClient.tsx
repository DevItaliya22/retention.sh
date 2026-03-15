"use client";

import { DashboardPageShell } from "@/components/layouts";
import {
  useSegmentMutation,
  useSegmentsQuery,
  type SegmentItem,
} from "@/hooks/segments";
import {
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@reelo/ui/components";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SegmentFormSheet } from "./SegmentFormSheet";

const OPERATOR_LABELS: Record<string, string> = {
  LESS_THAN: "<",
  GREATER_THAN: ">",
  LESS_THAN_OR_EQUAL: "≤",
  GREATER_THAN_OR_EQUAL: "≥",
  IN_RANGE: "in range",
  NOT_IN_RANGE: "not in range",
};

function formatFilter(
  op: string | null,
  v1: number | null,
  v2: number | null,
  unit?: string | null,
): string {
  if (!op || v1 == null) return "—";
  const label = OPERATOR_LABELS[op] ?? op;
  const suffix =
    unit === "MONTHS"
      ? " mo"
      : unit === "DAYS"
        ? " d"
        : unit === "ABSOLUTE"
          ? " ₹"
          : unit === "RATIO"
            ? "x"
            : "";
  const fmt =
    unit === "ABSOLUTE"
      ? (n: number) => n.toLocaleString("en-IN")
      : (n: number) => String(n);
  if (op === "IN_RANGE" || op === "NOT_IN_RANGE") {
    return v2 != null ? `${fmt(v1)}–${fmt(v2)}${suffix}` : "—";
  }
  return `${label} ${fmt(v1)}${suffix}`;
}

function getRecencyTooltip(
  op: string | null,
  v1: number | null,
  v2: number | null,
  unit?: string | null,
): string | null {
  if (!op || v1 == null) return null;
  const u = unit === "MONTHS" ? "months" : "days";
  const fmt = (n: number) => (unit === "MONTHS" ? Math.round(n) : n);
  if (op === "LESS_THAN" || op === "LESS_THAN_OR_EQUAL") {
    return `Customer visited within the last ${fmt(v1)} ${u}`;
  }
  if (op === "GREATER_THAN" || op === "GREATER_THAN_OR_EQUAL") {
    return `Customer has not visited in the last ${fmt(v1)} ${u}`;
  }
  if (op === "IN_RANGE" && v2 != null) {
    return `Customer last visited between ${fmt(v1)} and ${fmt(v2)} ${u} ago`;
  }
  if (op === "NOT_IN_RANGE" && v2 != null) {
    return `Customer last visited either less than ${fmt(v1)} or more than ${fmt(v2)} ${u} ago`;
  }
  return null;
}

function getFrequencyTooltip(
  op: string | null,
  v1: number | null,
  v2: number | null,
): string | null {
  if (!op || v1 == null) return null;
  const times = (n: number) => (n === 1 ? "1 time" : `${n} times`);
  if (op === "LESS_THAN") return `Customer has visited less than ${times(v1)}`;
  if (op === "LESS_THAN_OR_EQUAL")
    return `Customer has visited at most ${times(v1)}`;
  if (op === "GREATER_THAN")
    return `Customer has visited more than ${times(v1)}`;
  if (op === "GREATER_THAN_OR_EQUAL")
    return `Customer has visited at least ${times(v1)}`;
  if (op === "IN_RANGE" && v2 != null)
    return `Customer has visited between ${v1} and ${v2} times`;
  if (op === "NOT_IN_RANGE" && v2 != null)
    return `Customer has visited either less than ${v1} or more than ${v2} times`;
  return null;
}

function getMonetaryTooltip(
  op: string | null,
  v1: number | null,
  v2: number | null,
  unit?: string | null,
): string | null {
  if (!op || v1 == null) return null;
  if (unit === "ABSOLUTE") {
    const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
    if (op === "LESS_THAN") return `Customer has spent less than ${fmt(v1)}`;
    if (op === "LESS_THAN_OR_EQUAL")
      return `Customer has spent at most ${fmt(v1)}`;
    if (op === "GREATER_THAN") return `Customer has spent more than ${fmt(v1)}`;
    if (op === "GREATER_THAN_OR_EQUAL")
      return `Customer has spent at least ${fmt(v1)}`;
    if (op === "IN_RANGE" && v2 != null)
      return `Customer has spent between ${fmt(v1)} and ${fmt(v2)}`;
    if (op === "NOT_IN_RANGE" && v2 != null)
      return `Customer has spent either less than ${fmt(v1)} or more than ${fmt(v2)}`;
  } else {
    const fmt = (n: number) => `${n}×`;
    if (op === "LESS_THAN")
      return `Customer spends less than ${fmt(v1)} the average`;
    if (op === "LESS_THAN_OR_EQUAL")
      return `Customer spends at most ${fmt(v1)} the average`;
    if (op === "GREATER_THAN")
      return `Customer spends more than ${fmt(v1)} the average`;
    if (op === "GREATER_THAN_OR_EQUAL")
      return `Customer spends at least ${fmt(v1)} the average`;
    if (op === "IN_RANGE" && v2 != null)
      return `Customer spends between ${fmt(v1)} and ${fmt(v2)} the average`;
    if (op === "NOT_IN_RANGE" && v2 != null)
      return `Customer spends either less than ${fmt(v1)} or more than ${fmt(v2)} the average`;
  }
  return null;
}

function FilterCell({
  display,
  tooltip,
}: {
  display: string;
  tooltip: string | null;
}) {
  if (!tooltip) {
    return <span>{display}</span>;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help underline decoration-dotted underline-offset-2">
          {display}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-max">
        <p className="text-sm">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function SegmentsSettingsPageClient() {
  const { data, isLoading } = useSegmentsQuery();
  const {
    createSegment,
    updateSegment,
    deleteSegment,
    isCreating,
    isUpdating,
    isDeleting,
  } = useSegmentMutation();
  const [editingSegment, setEditingSegment] = useState<SegmentItem | null>(
    null,
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const segments = data?.items ?? [];

  const handleEdit = (segment: SegmentItem) => {
    setEditingSegment(segment);
  };

  const handleDelete = async (segment: SegmentItem) => {
    if (segment.isSystem) {
      toast.error("System segments cannot be deleted");
      return;
    }
    try {
      await deleteSegment(segment.id);
      toast.success("Segment deleted");
      setEditingSegment(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const handleSave = async (id: string, formData: Record<string, unknown>) => {
    try {
      await updateSegment({ id, data: formData });
      toast.success("Segment updated");
      setEditingSegment(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  };

  return (
    <DashboardPageShell
      title="Customer Segments"
      subtitle="Configure recency, frequency, and monetary thresholds. Recency = days since last visit. Frequency = number of visits. Monetary = ratio (× avg spend) or absolute (₹ lifetime spend)."
      contentVariant="contained"
    >
      <div className="space-y-6">
        <div className="bg-muted/40 flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm font-medium">
              Define smart customer slices using RFM-style rules.
            </p>
            <p className="text-muted-foreground text-xs">
              Use recency, frequency, and monetary thresholds to group customers
              into meaningful segments for campaigns and insights.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <div className="text-muted-foreground flex items-center gap-3 text-xs">
              <div>
                <span className="text-foreground font-semibold">
                  {segments.length}
                </span>{" "}
                segments
              </div>
              <span className="bg-border h-4 w-px" />
              <div>
                <span className="text-foreground font-semibold">
                  {segments.filter((s) => s.isSystem).length}
                </span>{" "}
                system
              </div>
              <span className="bg-border h-4 w-px" />
              <div>
                <span className="text-foreground font-semibold">
                  {segments.filter((s) => !s.isSystem).length}
                </span>{" "}
                custom
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              icon={<Plus className="h-4 w-4" />}
            >
              Create segment
            </Button>
          </div>
        </div>

        <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
          <div className="bg-muted/40 border-b px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Segment rules</p>
                <p className="text-muted-foreground text-xs">
                  Hover on values to see a plain-language explanation.
                </p>
              </div>
            </div>
          </div>
          <div className="max-h-[540px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Recency</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Monetary</TableHead>
                  <TableHead className="w-[112px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 4 }).map((_, idx) => (
                    <TableRow key={`skeleton-${idx}`}>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-8 w-16" />
                      </TableCell>
                    </TableRow>
                  ))}

                {!isLoading && segments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                        <p className="text-sm font-medium">No segments yet</p>
                        <p className="text-muted-foreground max-w-md text-xs">
                          Create your first segment to start grouping customers
                          by how recently and frequently they visit, and how
                          much they spend.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setIsCreateOpen(true)}
                          icon={<Plus className="h-4 w-4" />}
                        >
                          Create segment
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  segments.map((seg) => (
                    <TableRow key={seg.id}>
                      <TableCell className="align-top">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{seg.name}</span>
                            {seg.isSystem && (
                              <span className="bg-muted text-muted-foreground rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
                                System
                              </span>
                            )}
                          </div>
                          {seg.description && (
                            <p className="text-muted-foreground line-clamp-2 text-xs">
                              {seg.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground align-top text-sm">
                        <FilterCell
                          display={formatFilter(
                            seg.recencyOperator,
                            seg.recencyValue,
                            seg.recencyValue2,
                            seg.recencyUnit,
                          )}
                          tooltip={getRecencyTooltip(
                            seg.recencyOperator,
                            seg.recencyValue,
                            seg.recencyValue2,
                            seg.recencyUnit,
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground align-top text-sm">
                        <FilterCell
                          display={formatFilter(
                            seg.frequencyOperator,
                            seg.frequencyValue,
                            seg.frequencyValue2,
                            null,
                          )}
                          tooltip={getFrequencyTooltip(
                            seg.frequencyOperator,
                            seg.frequencyValue,
                            seg.frequencyValue2,
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground align-top text-sm">
                        <FilterCell
                          display={formatFilter(
                            seg.monetaryOperator,
                            seg.monetaryValue,
                            seg.monetaryValue2,
                            seg.monetaryUnit ?? "RATIO",
                          )}
                          tooltip={getMonetaryTooltip(
                            seg.monetaryOperator,
                            seg.monetaryValue,
                            seg.monetaryValue2,
                            seg.monetaryUnit ?? "RATIO",
                          )}
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(seg)}
                            disabled={isUpdating}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(seg)}
                            disabled={seg.isSystem || isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {editingSegment && (
        <SegmentFormSheet
          segment={editingSegment}
          open={!!editingSegment}
          onOpenChange={(open: boolean) => !open && setEditingSegment(null)}
          onSave={(data: Record<string, unknown>) =>
            handleSave(editingSegment.id, data)
          }
          isSaving={isUpdating}
        />
      )}

      {isCreateOpen && (
        <SegmentFormSheet
          segment={null}
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSave={async (data: Record<string, unknown>) => {
            try {
              await createSegment(data);
              toast.success("Segment created");
              setIsCreateOpen(false);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed to create");
            }
          }}
          isSaving={isCreating}
        />
      )}
    </DashboardPageShell>
  );
}
