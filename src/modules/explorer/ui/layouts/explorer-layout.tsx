"use client";

import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ExplorerNavBar } from "../components/explorer-navbar";
import { ExplorerSidebar } from "../components/explorer-sidebar";

export const ExplorerLayout = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className="w-full">
        <ExplorerNavBar />
        <div className="-ml-2 min-h-screen pt-[4rem] bg-background relative">
          {/* Ensure the sidebar is ABOVE the overlay */}
          {open && (
            <div
              className="fixed z-40 inset-0 w-full h-full bg-black/30"
              onClick={() => setOpen(false)}
              aria-hidden
            />
          )}
          <div className="relative z-40 ">
            <ExplorerSidebar collapsible="icon" variant="floating" />
          </div>



          <main className="relative z-30 flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
