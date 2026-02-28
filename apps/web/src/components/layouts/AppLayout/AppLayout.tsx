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
      <div>
        <SidebarProvider
          open={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
          className="flex h-screen flex-col"
        >
          <div className="flex h-screen w-screen flex-col">
            {/* Main Content Area */}
            <div className="h-100svh flex flex-1 grow overflow-y-auto">
              {/* Dynamic Sidebar */}
              <DynamicSidebar />

              {/* Main Content */}
              <SidebarInset className="@container flex h-full w-full flex-1 flex-col overflow-x-hidden overflow-y-auto">
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
