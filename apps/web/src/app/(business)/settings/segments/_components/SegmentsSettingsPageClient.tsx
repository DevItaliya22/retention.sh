"use client";

import { DashboardPageShell } from "@/components/layouts";
import {
  useSegmentMutation,
  useSegmentsQuery,
  type SegmentItem,
} from "@/hooks/segments";
import { SEGMENTS_MAX_PER_BUSINESS } from "@/lib/schemas/segment";
import { DEFAULT_SEGMENTS } from "@/lib/segmentation/defaults";
import {
  getSegmentTagHex,
  segmentIconSurfaceStyle,
} from "@/lib/segmentation/segment-tag-colours";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  InfoTooltip,
  Input,
  Skeleton,
} from "@reelo/ui/components";
import { Globe, MoreVertical, Plus, Search, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SegmentFormSheet } from "./SegmentFormSheet";

type SegmentListRow =
  | {
      kind: "system";
      id: string;
      name: string;
      slug: string;
      liveSegment: SegmentItem | null;
      isEditable: boolean;
    }
  | { kind: "custom"; segment: SegmentItem };

export function SegmentsSettingsSkeleton() {
  return (
    <div className="space-y-4">
      <div
        className="border-border -mx-3 border-b @lg:-mx-4 @xl:-mx-6"
        aria-hidden
      />
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <div className="border-border overflow-hidden rounded-xl border">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={`segments-skeleton-${idx}`}
            className="border-border flex items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-md" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="size-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SegmentsSettingsPageClient() {
  const { data } = useSegmentsQuery();
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
  const [search, setSearch] = useState("");

  const segments = data?.items ?? [];
  const hasResolvedSegments = Array.isArray(data?.items);
  const segmentTotal =
    data?.total ?? (hasResolvedSegments ? segments.length : 0);
  const atSegmentCap =
    hasResolvedSegments && segmentTotal >= SEGMENTS_MAX_PER_BUSINESS;

  const rows: SegmentListRow[] = useMemo(() => {
    const systemSegmentsMap = new Map(
      segments
        .filter((segment) => segment.isSystem)
        .map((segment) => [segment.slug, segment]),
    );
    const systemRows: SegmentListRow[] = DEFAULT_SEGMENTS.map(
      (defaultSegment) => {
        const liveSegment = systemSegmentsMap.get(defaultSegment.slug);
        return {
          kind: "system" as const,
          id: liveSegment?.id ?? `default-${defaultSegment.slug}`,
          name: liveSegment?.name ?? defaultSegment.name,
          slug: defaultSegment.slug,
          liveSegment: liveSegment ?? null,
          isEditable: Boolean(liveSegment),
        };
      },
    );
    const customRows: SegmentListRow[] = segments
      .filter((s) => !s.isSystem)
      .map((segment) => ({ kind: "custom" as const, segment }));
    return [...systemRows, ...customRows];
  }, [segments]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const name = row.kind === "system" ? row.name : row.segment.name;
      return name.toLowerCase().includes(q);
    });
  }, [rows, search]);

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

  const resolveSegmentForRow = (row: SegmentListRow): SegmentItem | null => {
    if (row.kind === "custom") return row.segment;
    return row.liveSegment;
  };

  return (
    <DashboardPageShell
      title={
        <span className="inline-flex items-center gap-1.5">
          Segments
          <InfoTooltip content="Segments group customers by rules so you can target campaigns and reporting." />
        </span>
      }
      pageHeaderPrimaryActions={
        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          icon={<Plus className="h-4 w-4" />}
          disabled={atSegmentCap}
          title={
            atSegmentCap
              ? `Maximum ${SEGMENTS_MAX_PER_BUSINESS} segments per account`
              : undefined
          }
        >
          Create segment
        </Button>
      }
      contentVariant="contained"
    >
      <div className="space-y-4">
        <div
          className="border-border -mx-3 border-b @lg:-mx-4 @xl:-mx-6"
          aria-hidden
        />

        <div className="relative max-w-md">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg pl-9"
            aria-label="Search segments"
          />
        </div>

        <div className="border-border overflow-hidden rounded-xl border">
          {!hasResolvedSegments ? (
            <div className="divide-border divide-y">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={`seg-loading-${idx}`}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Skeleton className="size-9 shrink-0 rounded-md" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-20 rounded-full" />
                    <Skeleton className="size-8 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="text-muted-foreground px-4 py-12 text-center text-sm">
              {search.trim()
                ? "No segments match your search."
                : "No segments yet."}
            </div>
          ) : (
            <ul className="divide-border divide-y" role="list">
              {filteredRows.map((row) => {
                const name =
                  row.kind === "system" ? row.name : row.segment.name;
                const segment = resolveSegmentForRow(row);
                const canEdit =
                  row.kind === "custom" ||
                  (row.kind === "system" && row.isEditable);
                const canDelete =
                  row.kind === "custom" && !row.segment.isSystem;
                const slug =
                  row.kind === "system" ? row.slug : row.segment.slug;
                const storedColour =
                  row.kind === "system"
                    ? row.liveSegment?.tagColour
                    : row.segment.tagColour;
                const tagHex = getSegmentTagHex(storedColour, slug);

                return (
                  <li key={row.kind === "system" ? row.id : row.segment.id}>
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex size-9 shrink-0 items-center justify-center rounded-md border"
                          aria-hidden
                          style={segmentIconSurfaceStyle(tagHex)}
                        >
                          <Tag className="size-4" />
                        </div>
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate font-medium">{name}</span>
                          {row.kind === "system" && (
                            <span className="bg-muted text-muted-foreground shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
                              System
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-muted-foreground bg-muted/60 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs">
                          <Globe className="size-3.5 shrink-0" aria-hidden />
                          {"0 links"}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label={`Actions for ${name}`}
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={!canEdit || isUpdating}
                              onClick={() =>
                                segment ? handleEdit(segment) : undefined
                              }
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={!canDelete || isDeleting}
                              onClick={() =>
                                row.kind === "custom"
                                  ? handleDelete(row.segment)
                                  : undefined
                              }
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Keep mounted while closing so Radix can finish portal teardown (avoids removeChild errors). */}
      <SegmentFormSheet
        segment={editingSegment}
        open={Boolean(editingSegment)}
        onOpenChange={(open: boolean) => {
          if (!open) setEditingSegment(null);
        }}
        onSave={(data: Record<string, unknown>) => {
          if (!editingSegment) return Promise.resolve();
          return handleSave(editingSegment.id, data);
        }}
        isSaving={isUpdating}
      />

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
    </DashboardPageShell>
  );
}
