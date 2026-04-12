"use client";

import { DataTableToolbarActionsProvider } from "@reelo/ui/components";
import { SidebarTrigger } from "@reelo/ui/components/sidebar";
import { cn } from "@reelo/ui/lib/utils";
import { ReactNode } from "react";

import { PageLayout, type PageLayoutProps } from "./PageLayout";
import { ScaffoldContainer } from "./Scaffold";

export const DASHBOARD_PAGE_SECTION_CLASS = "h-full w-full pt-3 pb-0";
export const DASHBOARD_PAGE_HEADER_CLASS =
  "max-w-none border-0! px-3! @lg:px-4! @xl:px-6! pt-2! pb-0!";
export const DASHBOARD_PAGE_HEADER_ROW_CLASS = "items-center gap-2";
export const DASHBOARD_PAGE_HEADER_CONTENT_CLASS =
  "bg-transparent px-0 py-0 space-y-0! min-h-8";
export const DASHBOARD_PAGE_CONTENT_CLASS =
  "h-full w-full px-3 @lg:px-4 @xl:px-6";
export const DASHBOARD_PAGE_NO_PADDING_CLASS = "px-0! @lg:px-0! @xl:px-0!";

type DashboardPageContentVariant = "contained" | "full";
type DashboardPageContentPadding = "default" | "none";

export interface DashboardPageShellProps extends Omit<
  PageLayoutProps,
  | "children"
  | "size"
  | "headerLeading"
  | "headerRowClassName"
  | "pageHeaderClassName"
  | "scaffoldSectionClassName"
  | "scaffoldContainerClassName"
> {
  children: ReactNode;
  showSidebarTrigger?: boolean;
  contentVariant?: DashboardPageContentVariant;
  contentPadding?: DashboardPageContentPadding;
  sectionClassName?: string;
  headerContentClassName?: string;
  contentClassName?: string;
  /** Optional anchor for onboarding product tour (`data-tour` on main content). */
  tourAnchor?: string;
}

export function DashboardPageShell({
  children,
  showSidebarTrigger = true,
  primaryActions,
  secondaryActions,
  contentVariant = "contained",
  contentPadding = "default",
  sectionClassName,
  headerContentClassName,
  contentClassName,
  tourAnchor,
  isWidthFull = true,
  ...pageLayoutProps
}: DashboardPageShellProps) {
  const contentSize = contentVariant === "full" ? "full" : "default";
  const hasHeaderContent = Boolean(pageLayoutProps.title);
  const compactTitle = pageLayoutProps.title ? (
    <span className="font-display text-foreground/90 inline-flex h-8 items-center text-[15px] leading-none font-semibold tracking-tight @xl:text-base">
      {pageLayoutProps.title}
    </span>
  ) : undefined;
  const headerLeading =
    hasHeaderContent && showSidebarTrigger ? (
      <div className="flex items-center pr-0.5">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted/40 size-8 rounded-md transition-colors [&>svg]:size-4" />
      </div>
    ) : undefined;
  const toolbarActions =
    primaryActions || secondaryActions ? (
      <div className="[&_a]:border-border/60 [&_a]:bg-background/50 [&_a]:text-foreground [&_a]:hover:bg-background/70 [&_button]:border-border/60 [&_button]:!bg-background/50 [&_button]:!text-foreground [&_button]:hover:!bg-background/70 flex items-center gap-2 [&_a]:inline-flex [&_a]:h-10 [&_a]:items-center [&_a]:rounded-lg [&_a]:border [&_a]:px-3 [&_a]:text-sm [&_button]:h-10 [&_button]:rounded-lg [&_button]:border [&_button]:px-3 [&_button]:text-sm [&_button]:font-normal">
        {secondaryActions && (
          <div className="flex items-center gap-2">{secondaryActions}</div>
        )}
        {primaryActions && (
          <div className="flex items-center gap-2">{primaryActions}</div>
        )}
      </div>
    ) : null;

  return (
    <PageLayout
      {...pageLayoutProps}
      title={compactTitle}
      icon={undefined}
      subtitle={undefined}
      primaryActions={undefined}
      secondaryActions={undefined}
      headerLeading={headerLeading}
      headerRowClassName={DASHBOARD_PAGE_HEADER_ROW_CLASS}
      isCompact={true}
      size={contentSize}
      isWidthFull={isWidthFull}
      pageHeaderClassName={cn(
        DASHBOARD_PAGE_HEADER_CONTENT_CLASS,
        headerContentClassName,
      )}
      scaffoldContainerClassName={DASHBOARD_PAGE_HEADER_CLASS}
      scaffoldSectionClassName={cn(
        DASHBOARD_PAGE_SECTION_CLASS,
        sectionClassName,
      )}
    >
      <DataTableToolbarActionsProvider actions={toolbarActions}>
        <ScaffoldContainer
          size={contentSize}
          data-tour={tourAnchor}
          className={cn(
            DASHBOARD_PAGE_CONTENT_CLASS,
            contentPadding === "none" && DASHBOARD_PAGE_NO_PADDING_CLASS,
            contentClassName,
          )}
        >
          {children}
        </ScaffoldContainer>
      </DataTableToolbarActionsProvider>
    </PageLayout>
  );
}
