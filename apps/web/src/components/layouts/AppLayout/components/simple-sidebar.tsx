"use client";

import { useSessionContext } from "@/hooks/misc/useSessionContext";
import { motion } from "framer-motion";
import { Inbox, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarHeader as UISidebarHeader,
  useSidebar,
} from "@reelo/ui/components/sidebar";
import { SidebarHeader } from "./sidebar-header";
import { UserSidebarFooter } from "./UserSidebarFooter";
import { ContactUsModal } from "./ContactUsModal";

const sidebarVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const groupVariants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
};

export function SimpleSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { user } = useSessionContext();
  const [isContactModalOpen, setIsContactModalOpen] = React.useState(false);

  return (
    <Sidebar collapsible="icon" {...props}>
      <UISidebarHeader>
        <SidebarHeader />
      </UISidebarHeader>
      <SidebarContent>
        <motion.div
          key="sidebar-content"
          variants={sidebarVariants}
          initial="initial"
          animate="animate"
          className="space-y-2"
        >
          <motion.div variants={groupVariants}>
            <SidebarGroup className="gap-0.5">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/inbox"}
                    tooltip="Inbox"
                  >
                    <Link href="/inbox">
                      <Inbox className="h-4 w-4" />
                      <span className="sidebar-text">Inbox</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/settings"}
                    tooltip="Settings"
                  >
                    <Link href="/settings">
                      <Settings className="h-4 w-4" />
                      <span className="sidebar-text">Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </motion.div>
        </motion.div>
      </SidebarContent>
      <SidebarFooter>
        <div
          role="button"
          tabIndex={0}
          className={`bg-sidebar-accent/50 focus-visible:ring-sidebar-accent/60 group flex w-full items-center rounded-md transition-colors focus-visible:ring-1 focus-visible:outline-none ${
            isCollapsed ? "justify-center" : "px-2 py-2"
          }`}
        >
          <UserSidebarFooter
            className="flex w-full items-center justify-between"
            isCollapsed={isCollapsed}
            onContactClick={() => {
                setIsContactModalOpen(true);
            }}
          />
        </div>
      </SidebarFooter>
      {user && (
        <ContactUsModal
          open={isContactModalOpen}
          onOpenChange={setIsContactModalOpen}
          userEmail={user.email || ""}
          userName={user.name}
        />
      )}
      <SidebarRail />
    </Sidebar>
  );
}
