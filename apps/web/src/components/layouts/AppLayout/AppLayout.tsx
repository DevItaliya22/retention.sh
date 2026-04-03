"use client";
import { BreadcrumbOverrideProvider } from "@/components/layouts/context/breadcrumb-override";
import { PropsWithChildren, useEffect, useState } from "react";

import { SidebarInset, SidebarProvider } from "@reelo/ui/components/sidebar";
import { DynamicSidebar } from "./components/dynamic-sidebar";

const SIDEBAR_AUTO_EXPAND_BREAKPOINT = 1280;

const AppLayout = ({ children }: PropsWithChildren) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const syncSidebarState = () => {
      setIsSidebarOpen(window.innerWidth >= SIDEBAR_AUTO_EXPAND_BREAKPOINT);
    };

    syncSidebarState();
    window.addEventListener("resize", syncSidebarState);

    return () => window.removeEventListener("resize", syncSidebarState);
  }, []);

  return (
    <BreadcrumbOverrideProvider>
      <div className="bg-muted/35">
        <SidebarProvider
          open={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
          className="bg-muted/35 flex h-screen flex-col"
        >
          <div className="flex h-screen w-screen flex-col p-2 md:p-3">
            {/* Main Content Area */}
            <div className="flex h-[100svh] flex-1 grow gap-3 overflow-y-auto">
              {/* Dynamic Sidebar */}
              <DynamicSidebar />

              {/* Main Content */}
              <SidebarInset className="@container flex h-full w-full min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
                {/* Page Content */}
                <div className="flex flex-1 flex-col">{children}</div>
              </SidebarInset>
            </div>
          </div>
        </SidebarProvider>
      </div>
    </BreadcrumbOverrideProvider>
  );
};

export default AppLayout;
