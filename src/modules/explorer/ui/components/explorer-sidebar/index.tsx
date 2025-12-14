import { Sidebar, SidebarContent } from "@/components/ui/sidebar"
import { MainSection } from "./main-section"
import { Separator } from "@/components/ui/separator"
import { RankingsSection } from "./rankings-section"
// import { PersonalSection } from "./personal-section"


interface Props {
    collapsible: "icon" | "offcanvas" | "none" | undefined;
    variant: "sidebar" | "floating" | "inset" | undefined;
}
export const ExplorerSidebar = ({ collapsible, variant }: Props) => {
    return (
        <Sidebar className="pt-16 z-40 overflow-hidden bg-background [&>div:last-child]:border-none [&_div[data-sidebar='sidebar']]:border-none border-none " collapsible={collapsible} variant={variant}>
            <SidebarContent className='bg-sidebar overflow-hidden -ml-2' >
                <MainSection />
                <Separator />
                <RankingsSection />
                {/* <PersonalSection /> */}
            </SidebarContent>
        </Sidebar>
    )
}
