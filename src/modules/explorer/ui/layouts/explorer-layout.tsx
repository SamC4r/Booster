//layout for this (home) group only

import { SidebarProvider } from "@/components/ui/sidebar";
import { ExplorerNavBar, } from "../components/explorer-navbar";
import { ExplorerSidebar, } from "../components/explorer-sidebar";


interface HomeLayoutProps {
    children: React.ReactNode;
}

export const ExplorerLayout= ({children}: HomeLayoutProps) => {
    return (
        <SidebarProvider>
            <div className='w-full'>
                <ExplorerNavBar />
                <div className="flex min-h-screen pt-[4rem]">
                    <ExplorerSidebar collapsible="icon" variant="inset"/>
                    <main className="flex-1 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    )
}

