import { Sidebar, SidebarContent } from "@/components/ui/sidebar"
import { MainSection } from "./main-section"
import { Separator } from "@/components/ui/separator"
import { PersonalSection } from "./personal-section"


interface Props{
    collapsible:"icon" | "offcanvas" | "none" | undefined;
    variant:"sidebar" | "floating" | "inset" | undefined;
}
export const ExplorerSidebar = ({collapsible,variant}:Props) => {
    return (
        <Sidebar className="pt-16 z-40 -ml-2"   collapsible={collapsible} variant={variant} defaultOpen={false} >
            <SidebarContent className='bg-background' >
                <MainSection />
                <Separator />
                <PersonalSection />
            </SidebarContent>
        </Sidebar>
    )
}
