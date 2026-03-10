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
      <div className="mb-4 flex items-center justify-end">
        <Button
          onClick={() => setIsCreateOpen(true)}
          icon={<Plus className="h-4 w-4" />}
        >
          Create segment
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Recency</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Monetary</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {segments.map((seg) => (
              <TableRow key={seg.id}>
                <TableCell>
                  <span className="font-medium">{seg.name}</span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
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
                <TableCell className="text-muted-foreground text-sm">
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
                <TableCell className="text-muted-foreground text-sm">
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
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(seg)}
                      disabled={isUpdating}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
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
      )}

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
