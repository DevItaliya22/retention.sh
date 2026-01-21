"use client";
import { PropsWithChildren } from "react";

import { SidebarInset, SidebarProvider } from "@reelo/ui/components/sidebar";
import { DynamicSidebar } from "./components/dynamic-sidebar";
import { MainHeader } from "./components/main-header";

const AppLayout = ({ children }: PropsWithChildren) => {
  return (
    <div>
      <SidebarProvider className="flex h-screen flex-col">
        <div className="flex h-screen w-screen flex-col">
          {/* Main Content Area */}
          <div className="h-100svh flex flex-1 grow overflow-y-auto">
            {/* Dynamic Sidebar */}
            <DynamicSidebar />

            {/* Main Content with Header */}
            <SidebarInset className="@container flex h-full w-full flex-1 flex-col overflow-x-hidden overflow-y-auto">
              {/* Header inside SidebarInset */}
              <MainHeader />
              {/* Page Content */}
              <div className="flex flex-1 flex-col gap-4 p-2">{children}</div>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AppLayout;
