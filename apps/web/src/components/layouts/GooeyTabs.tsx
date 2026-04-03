"use client";

import { GooeySvgFilter } from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

import { useIsChromium } from "@/lib/utils/browser";

export interface GooeyTabItem {
  value: string;
  label: ReactNode;
  path: string;
}

interface GooeyTabsProps {
  gooeyId: string;
  tabs: GooeyTabItem[];
  activeTab: string;
  onTabChange: (path: string) => void;
  children: ReactNode;
  contentClassName?: string;
  fullBleed?: boolean;
  bgClassName?: string;
  stickySafeAnimation?: boolean;
}

const FULL_BLEED_CLASS =
  "-mx-3 w-[calc(100%+1.5rem)] @lg:-mx-4 @lg:w-[calc(100%+2rem)] @xl:-mx-6 @xl:w-[calc(100%+3rem)]";

export function GooeyTabs({
  gooeyId,
  tabs,
  activeTab,
  onTabChange,
  children,
  contentClassName,
  fullBleed = true,
  bgClassName,
  stickySafeAnimation = false,
}: GooeyTabsProps) {
  const useGooey = useIsChromium();
  const bg = bgClassName ?? "bg-muted";

  return (
    <div className={fullBleed ? FULL_BLEED_CLASS : undefined}>
      <div className="relative min-h-[380px] w-full">
        {useGooey && <GooeySvgFilter id={gooeyId} strength={12} />}

        {useGooey && (
          <div
            className="pointer-events-none absolute inset-0 flex flex-col"
            style={{ filter: `url(#${gooeyId})` }}
          >
            <div className="flex h-12 w-full shrink-0">
              {tabs.map((tab) => (
                <div key={tab.value} className="relative flex-1">
                  {activeTab === tab.value && (
                    <motion.div
                      layoutId={`${gooeyId}-pill`}
                      className={cn(bg, "absolute inset-0 rounded-t-lg")}
                      transition={{
                        type: "spring",
                        bounce: 0,
                        duration: 0.35,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className={cn(bg, "min-h-[368px] flex-1 rounded-b-lg")} />
          </div>
        )}

        <div
          className={cn(
            "relative z-10 flex h-12 w-full",
            !useGooey && "border-border border-b",
          )}
        >
          {tabs.map((tab) => (
            <div key={tab.value} className="relative flex flex-1">
              <button
                type="button"
                onClick={() => onTabChange(tab.path)}
                className={cn(
                  "flex h-full w-full items-center justify-center gap-2 text-sm font-medium transition-colors",
                  activeTab === tab.value
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
              {!useGooey && activeTab === tab.value && (
                <div className="bg-primary absolute right-0 bottom-0 left-0 h-0.5" />
              )}
            </div>
          ))}
        </div>

        <div
          className={cn(
            "relative z-10 min-h-[368px] px-3 pt-4 pb-6 @lg:px-4 @xl:px-6",
            contentClassName,
          )}
        >
          {stickySafeAnimation ? (
            <div className="min-h-[calc(368px-2.5rem)]">{children}</div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                className="min-h-[calc(368px-2.5rem)]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
