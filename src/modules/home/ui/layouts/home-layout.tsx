//layout for this (home) group only

import { SidebarProvider } from "@/components/ui/sidebar";
import { ExplorerNavBar } from "@/modules/explorer/ui/components/explorer-navbar";
import { ExplorerSidebar } from "@/modules/explorer/ui/components/explorer-sidebar";


interface HomeLayoutProps {
    children: React.ReactNode;
}

export const HomeLayout = ({children}: HomeLayoutProps) => {
    return (
        <SidebarProvider defaultOpen={false}>
            <div className='w-full'>
                <ExplorerNavBar />
                <div className="flex min-h-screen pt-[4rem]">
                    <main className="flex-1 ">
                        {children}
                    </main>
                </div>
                <ExplorerSidebar  collapsible="offcanvas" variant="floating"/>
            </div>
        </SidebarProvider>
    )
}

