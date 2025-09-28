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
        <Sidebar className="pt-16 z-40 overflow-hidden"   collapsible={collapsible} variant={variant}  >
            <SidebarContent className='bg-background overflow-hidden' >
                <MainSection />
                <Separator />
                <PersonalSection />
            </SidebarContent>
        </Sidebar>
    )
}
