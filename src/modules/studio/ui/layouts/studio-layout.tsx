//layout for this (home) group only

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { StudioNavBar } from "../components/studio-navbar";
import { StudioSidebar } from "../components/studio-sidebar";


interface StudioLayoutProps {
    children: React.ReactNode;
}

export const StudioLayout = ({ children }: StudioLayoutProps) => {
    return (
        <SidebarProvider>
            <StudioSidebar />
            <SidebarInset>
                <div className='w-full min-h-screen'>
                    <StudioNavBar />
                    <div className="pt-16 min-h-screen">
                        <div className="h-full w-full p-4 md:p-6 ml-4 md:ml-8 lg:ml-12 mr-4 md:mr-6">
                            <div className="max-w-full">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

