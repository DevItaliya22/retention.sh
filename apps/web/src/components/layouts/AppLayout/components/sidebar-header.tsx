"use client";

import { AnimatePresence, motion } from "framer-motion";

const headerVariants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
};

export function SidebarHeader() {
  return (
    <AnimatePresence>
      <motion.div
        className=""
        variants={headerVariants}
        initial="initial"
        animate="animate"
        exit={{ opacity: 0, y: -20 }}
      >
        <div className="px-2 py-2">
          <span className="text-sm font-semibold">Reelo</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
