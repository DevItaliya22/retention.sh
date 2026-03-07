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
  const suffix = unit ? (unit === "MONTHS" ? " mo" : " d") : "";
  if (op === "IN_RANGE" || op === "NOT_IN_RANGE") {
    return v2 != null ? `${v1}-${v2}${suffix}` : "—";
  }
  return `${label} ${v1}${suffix}`;
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
      subtitle="Configure recency, frequency, and monetary thresholds. Recency = days since last visit. Frequency = Wallet.visitCount. Monetary = multiple of average spend (e.g. 3 = 3x)."
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
                  {formatFilter(
                    seg.recencyOperator,
                    seg.recencyValue,
                    seg.recencyValue2,
                    seg.recencyUnit,
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatFilter(
                    seg.frequencyOperator,
                    seg.frequencyValue,
                    seg.frequencyValue2,
                    null,
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatFilter(
                    seg.monetaryOperator,
                    seg.monetaryValue,
                    seg.monetaryValue2,
                    null,
                  )}
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
