"use client";

import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const RankingsSection = () => {
    const pathname = usePathname();
    const isActive = pathname === "/rankings";

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Rankings</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Top Channels"
                            asChild
                            isActive={isActive}
                        >
                            <Link href="/rankings" className="flex items-center gap-3">
                                <Trophy className="size-4" />
                                <span className="text-sm font-medium">Top Channels</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
};
