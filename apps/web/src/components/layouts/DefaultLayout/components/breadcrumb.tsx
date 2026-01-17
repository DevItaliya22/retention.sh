"use client";

import { useBreadcrumbs } from "@/hooks/layout";
import type { BreadcrumbItem as BreadcrumbItemType } from "@/lib/utils/breadcrumb";
import {
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  Breadcrumb as BreadcrumbPrimitive,
  BreadcrumbSeparator,
} from "@reelo/ui/components/breadcrumb";
import { Button } from "@reelo/ui/components/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@reelo/ui/components/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@reelo/ui/components/dropdown-menu";
import { ScrollArea, ScrollBar } from "@reelo/ui/components/scroll-area";
import { useMediaQuery } from "@reelo/ui/hooks";
import Link from "next/link";
import React, { useState } from "react";

interface BreadcrumbProps {
  className?: string;
}

export function Breadcrumb({ className }: BreadcrumbProps) {
  const { items, shouldShow } = useBreadcrumbs();
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (!shouldShow || items.length === 0) {
    return null;
  }

  const shouldShowEllipsis = items.length > 40;
  const shouldShowMobileDrawer = isMobile && items.length > 10;

  const renderItems = () => {
    if (shouldShowMobileDrawer) {
      // Mobile: Show first item + drawer trigger + last item
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const hiddenItems = items.slice(1, -1);

      if (!firstItem || !lastItem) {
        return null;
      }

      return (
        <>
          {/* First item */}
          <BreadcrumbItem>
            {firstItem.href && !firstItem.isActive ? (
              <BreadcrumbLink asChild>
                <Link href={firstItem.href} className={firstItem.className}>
                  {firstItem.label}
                </Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage className={firstItem.className}>
                {firstItem.label}
              </BreadcrumbPage>
            )}
          </BreadcrumbItem>
          <BreadcrumbSeparator />

          {/* Drawer trigger */}
          <BreadcrumbItem>
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger
                aria-label="Toggle Menu"
                className="flex items-center gap-1"
              >
                <BreadcrumbEllipsis className="size-4" />
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader className="text-left">
                  <DrawerTitle>Navigate to</DrawerTitle>
                  <DrawerDescription>
                    Select a page to navigate to.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="px-4">
                  <ScrollArea className="h-[300px]">
                    <div className="grid gap-1">
                      {hiddenItems.map(
                        (item: BreadcrumbItemType, index: number) => (
                          <Link
                            key={index}
                            href={item.href ? item.href : "#"}
                            className="hover:text-foreground py-1 text-sm"
                            onClick={() => setDrawerOpen(false)}
                          >
                            {item.label}
                          </Link>
                        ),
                      )}
                    </div>
                  </ScrollArea>
                </div>
                <DrawerFooter className="pt-4">
                  <DrawerClose asChild>
                    <Button variant="outline">Close</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </BreadcrumbItem>
          <BreadcrumbSeparator />

          {/* Last item */}
          <BreadcrumbItem>
            {lastItem.href && !lastItem.isActive ? (
              <BreadcrumbLink asChild>
                <Link href={lastItem.href} className={lastItem.className}>
                  {lastItem.label}
                </Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage className={lastItem.className}>
                {lastItem.label}
              </BreadcrumbPage>
            )}
          </BreadcrumbItem>
        </>
      );
    }

    if (shouldShowEllipsis) {
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const hiddenItems = items.slice(1, -1);

      if (!firstItem || !lastItem) {
        return null;
      }

      return (
        <>
          {/* First item */}
          <BreadcrumbItem>
            {firstItem.href && !firstItem.isActive ? (
              <BreadcrumbLink asChild>
                <Link href={firstItem.href} className={firstItem.className}>
                  {firstItem.label}
                </Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage className={firstItem.className}>
                {firstItem.label}
              </BreadcrumbPage>
            )}
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger
                className="flex items-center gap-1"
                aria-label="Toggle menu"
              >
                <BreadcrumbEllipsis className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <ScrollArea className="h-[260px]">
                  {hiddenItems.map(
                    (item: BreadcrumbItemType, index: number) => (
                      <DropdownMenuItem key={index}>
                        <Link href={item.href ? item.href : "#"}>
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ),
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          </BreadcrumbItem>
          <BreadcrumbSeparator />

          {/* Last item */}
          <BreadcrumbItem>
            {lastItem.href && !lastItem.isActive ? (
              <BreadcrumbLink asChild>
                <Link href={lastItem.href} className={lastItem.className}>
                  {lastItem.label}
                </Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage className={lastItem.className}>
                {lastItem.label}
              </BreadcrumbPage>
            )}
          </BreadcrumbItem>
        </>
      );
    }

    return (
      <ScrollArea className="w-full overflow-x-auto whitespace-nowrap [-webkit-overflow-scrolling:touch]">
        <div className="flex min-w-max items-center space-x-1">
          {items.map((item: BreadcrumbItemType, index: number) => (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {item.href && !item.isActive ? (
                  <BreadcrumbLink asChild>
                    <Link href={item.href} className={item.className}>
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className={item.className}>
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {index < items.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  };

  return (
    <BreadcrumbPrimitive className={className}>
      <BreadcrumbList className="flex-nowrap overflow-visible">
        {renderItems()}
      </BreadcrumbList>
    </BreadcrumbPrimitive>
  );
}
