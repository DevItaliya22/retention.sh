"use client";

import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ReactNode,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { Badge, Button, NavMenu, NavMenuItem } from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";
import { ScaffoldContainer, ScaffoldSection } from "../Scaffold";
import { PageHeader } from "./PageHeader";

const EMPTY_NAVIGATION_ITEMS: NavigationItem[] = [];

export interface NavigationItem {
  id?: string;
  label: string;
  href?: string;
  icon?: ReactNode;
  onClick?: () => void;
  badge?: string;
  active?: boolean;
}

export type NavigationVariant = "default" | "gooey";

export interface PageLayoutProps {
  children?: ReactNode;
  title?: string | ReactNode;
  subtitle?: string | ReactNode;
  icon?: ReactNode;
  headerLeading?: ReactNode;
  headerRowClassName?: string;
  primaryActions?: ReactNode;
  secondaryActions?: ReactNode;
  pageHeaderClassName?: string;
  navigationItems?: NavigationItem[];
  navigationVariant?: NavigationVariant;
  className?: string;
  size?: "default" | "full" | "large" | "small";
  isCompact?: boolean;
  isWidthFull?: boolean;
  scaffoldSectionClassName?: string;
  scaffoldContainerClassName?: string;
}

/**
 * For rendering a general single column based UI (which covers most of the dashboard's use case)
 *
 * Pages that would use this would for example be: Auth Sign In / Up, Organization settings, Advisors, etc
 *
 * Pages that would deviate from this are those with dedicated UI, for example: Table Editor, SQL Editor, etc
 *
 * Handles rendering the following UI behaviors:
 * - Page padding depending on the size property
 * - Top level page header (If applicable)
 * - Top level tab navigations (If applicable)
 * @param title - Title rendered in page header
 * @param subtitle - Subtitle rendered in page header, below title
 * @param icon - Icon rendered in Page header, to the left of title and subtitle
 * @param primaryActions - TBD
 * @param secondaryActions - TBD
 * @param navigationItems - Tab navigation rendered below the page header
 * @param className - Optional additional class names to be applied
 * @param size - Controls padding of the page header only, padding for the content to be controlled by PageContainer (Default: 'default')
 * @param isCompact - TBD (Default: false)
 */
const PageLayout = ({
  children,
  title,
  subtitle,
  icon,
  headerLeading,
  headerRowClassName,
  primaryActions,
  secondaryActions,
  pageHeaderClassName,
  navigationItems = EMPTY_NAVIGATION_ITEMS,
  navigationVariant = "default",
  className,
  size = "default",
  isCompact = false,
  isWidthFull = true,
  scaffoldContainerClassName,
  scaffoldSectionClassName,
}: PageLayoutProps) => {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const activeIndex = navigationItems.findIndex((item) =>
    item.active !== undefined ? item.active : pathname === item.href,
  );
  const isGooey = navigationVariant === "gooey" && navigationItems.length > 0;
  // Unique id for SVG filter so url(#id) resolves correctly (React useId can contain : which breaks in CSS)
  const gooeyFilterId = useId().replace(/:/g, "-");

  // Dynamic gooey: measure tab sizes so the pill fits each tab's content
  const gooeyContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLElement | null)[]>([]);
  const [tabRects, setTabRects] = useState<
    { left: number; top: number; width: number; height: number }[]
  >([]);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  const measureTabs = useCallback(() => {
    const container = gooeyContainerRef.current;
    if (!container) return;
    const refs = tabRefs.current;
    const crect = container.getBoundingClientRect();
    const rects: {
      left: number;
      top: number;
      width: number;
      height: number;
    }[] = [];
    for (let i = 0; i < navigationItems.length; i++) {
      const el = refs[i];
      if (el) {
        const r = el.getBoundingClientRect();
        rects.push({
          left: r.left - crect.left,
          top: r.top - crect.top,
          width: r.width,
          height: r.height,
        });
      }
    }
    if (rects.length === navigationItems.length) {
      setTabRects(rects);
      setContainerRect(crect);
    }
  }, [navigationItems.length]);

  useLayoutEffect(() => {
    if (!isGooey) return;
    measureTabs();
  }, [isGooey, measureTabs, activeIndex, pathname]);

  useLayoutEffect(() => {
    if (!isGooey || !gooeyContainerRef.current) return;
    const el = gooeyContainerRef.current;
    const ro = new ResizeObserver(measureTabs);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isGooey, measureTabs]);

  const hasMeasuredRects =
    isGooey && tabRects.length === navigationItems.length && containerRect;

  return (
    <div
      className={cn(
        "flex h-full min-h-full w-full flex-col items-stretch",
        className,
      )}
    >
      <ScaffoldContainer
        size={size}
        className={cn(
          "mx-auto w-full",
          size === "full" &&
            (isCompact
              ? "max-w-none border-b px-6! pt-4"
              : "max-w-none border-b px-10! pt-6"),
          size !== "full" && (isCompact ? "pt-4" : "pt-12"),
          navigationItems.length === 0 &&
            size === "full" &&
            (isCompact ? "pb-4" : "pb-8"),
          scaffoldContainerClassName,
        )}
      >
        {/* Header section */}
        {(headerLeading ||
          title ||
          subtitle ||
          primaryActions ||
          secondaryActions) && (
          <div className={cn("flex items-stretch gap-3", headerRowClassName)}>
            {headerLeading && (
              <div className={cn("flex shrink-0 items-center")}>
                {headerLeading}
              </div>
            )}
            {(title || subtitle || primaryActions || secondaryActions) && (
              <PageHeader
                title={title}
                subtitle={subtitle}
                icon={icon}
                primaryActions={primaryActions}
                secondaryActions={secondaryActions}
                className={cn("min-w-0 flex-1", pageHeaderClassName)}
                isCompact={isCompact}
              />
            )}
          </div>
        )}

        {/* Navigation section */}
        {navigationItems.length > 0 && (
          <LayoutGroup id="page-layout-tabs">
            <div className={cn(isCompact ? "mt-2" : "mt-4")}>
              <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
                {isGooey ? (
                  <div
                    ref={gooeyContainerRef}
                    className="border-border relative min-h-14 border-b pb-0"
                  >
                    {/* Gooey filter: turns blur into liquid (must be in DOM for url(#id) to resolve) */}
                    <svg
                      aria-hidden
                      className="absolute size-0 overflow-hidden"
                      style={{ position: "absolute", width: 0, height: 0 }}
                    >
                      <defs>
                        <filter
                          id={gooeyFilterId}
                          x="-50%"
                          y="-50%"
                          width="200%"
                          height="200%"
                        >
                          <feGaussianBlur
                            in="SourceGraphic"
                            stdDeviation="10"
                            result="blur"
                          />
                          <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                            result="goo"
                          />
                        </filter>
                      </defs>
                    </svg>
                    {/* Layer 1: Gooey background – filter applied here only; pill + blobs sized to tab content when measured */}
                    <div
                      className="pointer-events-none absolute inset-0 flex h-14 items-center px-0"
                      style={{ filter: `url(#${gooeyFilterId})` }}
                    >
                      {hasMeasuredRects ? (
                        <>
                          {/* Static blobs at each tab center */}
                          {tabRects.map((r, i) => (
                            <div
                              key={`blob-${i}`}
                              className="absolute size-8 rounded-full bg-[#E8EBEF]/50"
                              style={{
                                left: r.left + r.width / 2 - 16,
                                top: r.top + r.height / 2 - 16,
                              }}
                            />
                          ))}
                          {/* Pill: position/size from active tab rect, animated */}
                          {tabRects[activeIndex] && (
                            <motion.div
                              className="rounded-lg bg-[#E8EBEF]"
                              animate={{
                                left: tabRects[activeIndex].left,
                                top: tabRects[activeIndex].top,
                                width: tabRects[activeIndex].width,
                                height: tabRects[activeIndex].height,
                              }}
                              transition={
                                prefersReducedMotion
                                  ? { duration: 0 }
                                  : {
                                      type: "spring",
                                      stiffness: 140,
                                      damping: 15,
                                      mass: 1.2,
                                    }
                              }
                              style={{ position: "absolute" }}
                            />
                          )}
                        </>
                      ) : (
                        /* Fallback: equal-width until we have measurements */
                        navigationItems.map((_, i) => (
                          <div
                            key={`blob-${i}`}
                            className="relative flex h-10 flex-1 items-center justify-center"
                          >
                            <div className="size-8 rounded-full bg-[#E8EBEF]/50" />
                            {i === activeIndex && (
                              <motion.div
                                layoutId="page-layout-gooey-pill"
                                className="absolute inset-0 rounded-lg bg-[#E8EBEF]"
                                transition={
                                  prefersReducedMotion
                                    ? { duration: 0 }
                                    : {
                                        type: "spring",
                                        stiffness: 140,
                                        damping: 15,
                                        mass: 1.2,
                                      }
                                }
                              />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    {/* Layer 2: Sharp foreground – content-sized tabs, refs for measurement */}
                    <NavMenu
                      className={cn(
                        size === "full" && "border-none",
                        "relative z-10 min-w-full overflow-visible bg-transparent pt-4 [&>ul]:flex [&>ul]:flex-nowrap [&>ul]:gap-1 [&>ul]:bg-transparent [&>ul>li]:flex-initial [&>ul>li]:shrink-0",
                      )}
                    >
                      {navigationItems.map((item, i) => {
                        const isActive =
                          item.active !== undefined
                            ? item.active
                            : pathname === item.href;
                        return (
                          <NavMenuItem
                            key={item.label}
                            ref={(el) => {
                              tabRefs.current[i] = el;
                            }}
                            active={isActive}
                            className="!border-0"
                          >
                            <span className="relative inline-flex items-center !py-0">
                              {item.href ? (
                                <Link
                                  href={item.href}
                                  className={cn(
                                    "relative z-10 inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                    "focus-visible:ring-primary/40 focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                                    isActive
                                      ? "text-primary"
                                      : "text-muted-foreground hover:text-foreground",
                                  )}
                                  onClick={item.onClick}
                                >
                                  {item.icon && <span>{item.icon}</span>}
                                  {item.label}
                                  {item.badge && (
                                    <Badge variant="default">
                                      {item.badge}
                                    </Badge>
                                  )}
                                </Link>
                              ) : (
                                <Button
                                  variant="link"
                                  onClick={item.onClick}
                                  className={cn(
                                    "relative z-10 h-auto rounded-lg px-3 py-2.5 text-sm font-medium",
                                    "focus-visible:ring-primary/40 focus-visible:ring-offset-background",
                                    "hover:!no-underline",
                                    isActive
                                      ? "!text-primary"
                                      : "!text-muted-foreground hover:!text-foreground",
                                  )}
                                  icon={item.icon && <span>{item.icon}</span>}
                                >
                                  {item.label}
                                  {item.badge && (
                                    <Badge variant="default">
                                      {item.badge}
                                    </Badge>
                                  )}
                                </Button>
                              )}
                            </span>
                          </NavMenuItem>
                        );
                      })}
                    </NavMenu>
                  </div>
                ) : (
                  <NavMenu
                    className={cn(
                      size === "full" && "border-none",
                      "relative w-max min-w-full overflow-visible pt-4 [&>ul]:flex-nowrap [&>ul]:gap-2 [&>ul>li]:shrink-0",
                    )}
                  >
                    {navigationItems.map((item) => {
                      const isActive =
                        item.active !== undefined
                          ? item.active
                          : pathname === item.href;
                      return (
                        <NavMenuItem
                          key={item.label}
                          active={isActive}
                          className={cn(
                            "!border-0 transition-transform",
                            "data-[state=active]:z-10 data-[state=active]:-translate-y-[1px]",
                          )}
                        >
                          <span className="relative inline-flex items-center !py-0">
                            {isActive && (
                              <motion.span
                                layoutId="page-layout-active-tab"
                                transition={
                                  prefersReducedMotion
                                    ? { duration: 0 }
                                    : {
                                        type: "spring",
                                        stiffness: 420,
                                        damping: 32,
                                        mass: 0.6,
                                      }
                                }
                                className={cn(
                                  "border-primary/30 bg-primary/10 pointer-events-none absolute inset-0 -bottom-px -z-10 rounded-t-xl border shadow-sm",
                                )}
                              />
                            )}
                            {item.href ? (
                              <Link
                                href={item.href}
                                className={cn(
                                  "relative z-10 inline-flex items-center gap-2 rounded-t-xl rounded-b-none px-3 py-2 text-sm font-medium transition-colors",
                                  "focus-visible:ring-primary/40 focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                                  isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground",
                                )}
                                onClick={item.onClick}
                              >
                                {item.icon && <span>{item.icon}</span>}
                                {item.label}
                                {item.badge && (
                                  <Badge variant="default">{item.badge}</Badge>
                                )}
                              </Link>
                            ) : (
                              <Button
                                variant="link"
                                onClick={item.onClick}
                                className={cn(
                                  "relative z-10 h-auto rounded-t-xl rounded-b-none px-3 py-2 text-sm font-medium",
                                  "focus-visible:ring-primary/40 focus-visible:ring-offset-background",
                                  "hover:!no-underline",
                                  isActive
                                    ? "!text-primary"
                                    : "!text-muted-foreground hover:!text-foreground",
                                )}
                                icon={item.icon && <span>{item.icon}</span>}
                              >
                                {item.label}
                                {item.badge && (
                                  <Badge variant="default">{item.badge}</Badge>
                                )}
                              </Button>
                            )}
                          </span>
                        </NavMenuItem>
                      );
                    })}
                  </NavMenu>
                )}
              </div>
            </div>
          </LayoutGroup>
        )}
      </ScaffoldContainer>
      <ScaffoldSection
        isFullWidth={isWidthFull}
        className={scaffoldSectionClassName}
      >
        {children}
      </ScaffoldSection>
    </div>
  );
};

export default PageLayout;
