"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import { Badge, Button, NavMenu, NavMenuItem } from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";
import { ScaffoldContainer, ScaffoldSection } from "../Scaffold";
import { PageHeader } from "./PageHeader";

export interface NavigationItem {
  id?: string;
  label: string;
  href?: string;
  icon?: ReactNode;
  onClick?: () => void;
  badge?: string;
  active?: boolean;
}

export interface PageLayoutProps {
  children?: ReactNode;
  title?: string | ReactNode;
  subtitle?: string | ReactNode;
  icon?: ReactNode;
  primaryActions?: ReactNode;
  secondaryActions?: ReactNode;
  navigationItems?: NavigationItem[];
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
  primaryActions,
  secondaryActions,
  navigationItems = [],
  className,
  size = "default",
  isCompact = false,
  isWidthFull = true,
  scaffoldContainerClassName,
  scaffoldSectionClassName,
}: PageLayoutProps) => {
  const pathname = usePathname();

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
        {(title || subtitle || primaryActions || secondaryActions) && (
          <PageHeader
            title={title}
            subtitle={subtitle}
            icon={icon}
            primaryActions={primaryActions}
            secondaryActions={secondaryActions}
            isCompact={isCompact}
          />
        )}

        {/* Navigation section */}
        {navigationItems.length > 0 && (
          <NavMenu
            className={cn(
              isCompact ? "mt-2" : "mt-4",
              size === "full" && "border-none",
            )}
          >
            {navigationItems.map((item) => {
              const isActive =
                item.active !== undefined
                  ? item.active
                  : pathname === item.href;
              return (
                <NavMenuItem key={item.label} active={isActive}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={cn(
                        "inline-flex items-center gap-2",
                        isActive && "text-foreground",
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
                      className={cn(isActive && "text-foreground font-medium")}
                      icon={item.icon && <span>{item.icon}</span>}
                      text={
                        <>
                          {item.label}
                          {item.badge && (
                            <Badge variant="default">{item.badge}</Badge>
                          )}
                        </>
                      }
                    />
                  )}
                </NavMenuItem>
              );
            })}
          </NavMenu>
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
