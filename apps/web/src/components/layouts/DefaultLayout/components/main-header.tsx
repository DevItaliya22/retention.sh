"use client";

import { Separator } from "@reelo/ui/components/separator";
import { SidebarTrigger } from "@reelo/ui/components/sidebar";
import { AnimatePresence, motion } from "framer-motion";
import { Breadcrumb } from "./breadcrumb";

interface MainHeaderProps {
  className?: string;
}

export function MainHeader({ className }: MainHeaderProps) {
  return (
    <header
      className={`flex h-10 shrink-0 items-center gap-2 border-b px-4 ${className || ""}`}
    >
      {/* Sidebar Trigger */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <SidebarTrigger className="-ml-1" />
        </motion.div>
      </AnimatePresence>

      {/* Separator after sidebar trigger */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
        </motion.div>
      </AnimatePresence>

      <div className="min-w-0 flex-1 overflow-hidden">
        <Breadcrumb />
      </div>
    </header>
  );
}
