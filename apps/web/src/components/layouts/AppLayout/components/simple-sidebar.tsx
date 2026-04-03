"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@reelo/ui/components";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarHeader as UISidebarHeader,
  useSidebar,
} from "@reelo/ui/components/sidebar";
import { motion } from "framer-motion";
import {
  Award,
  ChevronRight,
  FileText,
  Gift,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Send,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { SidebarHeader } from "./sidebar-header";
import { UserSidebarFooter } from "./UserSidebarFooter";

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
  const [, setIsContactModalOpen] = React.useState(false);
  const settingsCollapsibleId = React.useId();

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="md:py-3 md:pr-0 md:pl-3"
      {...props}
    >
      <UISidebarHeader className="px-4 pt-3 pb-1">
        <SidebarHeader />
      </UISidebarHeader>
      <SidebarContent className="px-3 pb-3">
        <motion.div
          key="sidebar-content"
          variants={sidebarVariants}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          <motion.div variants={groupVariants}>
            <SidebarGroup className="gap-1 px-0">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/dashboard"}
                    tooltip="Dashboard"
                  >
                    <Link href="/dashboard">
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="sidebar-text">Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === "/customers" ||
                      pathname.startsWith("/customers/")
                    }
                    tooltip="Customers"
                  >
                    <Link href="/customers">
                      <Users className="h-4 w-4" />
                      <span className="sidebar-text">Customers</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === "/campaigns" ||
                      pathname.startsWith("/campaigns/")
                    }
                    tooltip="Campaigns"
                  >
                    <Link href="/campaigns">
                      <Megaphone className="h-4 w-4" />
                      <span className="sidebar-text">Campaigns</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === "/loyalty-stats" ||
                      pathname.startsWith("/loyalty-stats/")
                    }
                    tooltip="Loyalty stats"
                  >
                    <Link href="/loyalty-stats">
                      <Award className="h-4 w-4" />
                      <span className="sidebar-text">Loyalty stats</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/referral-stats"}
                    tooltip="Referral stats"
                  >
                    <Link href="/referral-stats">
                      <Gift className="h-4 w-4" />
                      <span className="sidebar-text">Referral stats</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === "/feedback-stats" ||
                      pathname.startsWith("/feedback-stats/")
                    }
                    tooltip="Feedback stats"
                  >
                    <Link href="/feedback-stats">
                      <MessageSquare className="h-4 w-4" />
                      <span className="sidebar-text">Feedback stats</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === "/message-logs" ||
                      pathname.startsWith("/message-logs")
                    }
                    tooltip="Message logs"
                  >
                    <Link href="/message-logs">
                      <Send className="h-4 w-4" />
                      <span className="sidebar-text">Message logs</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/bills"}
                    tooltip="Bills"
                  >
                    <Link href="/bills">
                      <FileText className="h-4 w-4" />
                      <span className="sidebar-text">Bills</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <Collapsible
                  asChild
                  defaultOpen={true}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={
                          pathname === "/settings" ||
                          pathname.startsWith("/settings/")
                        }
                        tooltip="Settings"
                      >
                        <Settings className="h-4 w-4" />
                        <span className="sidebar-text">Settings</span>
                        <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent id={settingsCollapsibleId}>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === "/settings"}
                          >
                            <Link href="/settings">General</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={
                              pathname === "/settings/sku" ||
                              pathname.startsWith("/settings/sku/")
                            }
                          >
                            <Link href="/settings/sku">
                              {/* <Package className="h-4 w-4" /> */}
                              SKU & Categories
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === "/settings/partners"}
                          >
                            <Link href="/settings/partners">Partners</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <div className="bg-sidebar-border my-2 h-px rounded-full opacity-90" />
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === "/settings/loyalty"}
                          >
                            <Link href="/settings/loyalty">Loyalty</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === "/settings/referral"}
                          >
                            <Link href="/settings/referral">Referral</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === "/settings/feedback"}
                          >
                            <Link href="/settings/feedback">Feedback</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <div className="bg-sidebar-border my-2 h-px rounded-full opacity-90" />
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === "/settings/segments"}
                          >
                            <Link href="/settings/segments">Segments</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === "/settings/cashier"}
                          >
                            <Link href="/settings/cashier">Cashier</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <div className="bg-sidebar-border my-2 h-px rounded-full opacity-90" />
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === "/settings/shopify"}
                          >
                            <Link href="/settings/shopify">Shopify</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroup>
          </motion.div>
        </motion.div>
      </SidebarContent>
      <SidebarFooter className="px-3 pt-2 pb-3">
        <div
          role="button"
          tabIndex={0}
          className={`border-sidebar-border/70 bg-background/80 focus-visible:ring-sidebar-accent/60 group flex w-full items-center rounded-2xl border transition-colors focus-visible:ring-1 focus-visible:outline-none ${
            isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-3"
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
      <SidebarRail />
    </Sidebar>
  );
}
