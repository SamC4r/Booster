"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { LogOutIcon, VideoIcon, BarChart3Icon } from "lucide-react";
import { usePathname } from "next/navigation";
import { StudioSidebarHeader } from "./studio-sidebar-header";

export const StudioSidebar = () => {
  const pathname = usePathname();

  return (
    <Sidebar className="pt-16 z-40 [&>div:last-child]:border-none [&_div[data-sidebar='sidebar']]:border-none" collapsible="icon">
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarMenu>
            <StudioSidebarHeader />
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/studio"}
                tooltip="Content"
                asChild
              >
                <Link href="/studio">
                  <VideoIcon className="size-5" />
                  <span className="text-sm">Content</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/studio/analytics"}
                tooltip="Analytics"
                asChild
              >
                <Link href="/studio/analytics">
                  <BarChart3Icon className="size-5" />
                  <span className="text-sm">Analytics</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Separator />

            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Exit studio" asChild>
                <Link href="/">
                  <LogOutIcon className="size-5" />
                  <span className="text-sm">Exit Studio</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        {/* <PersonalSection /> */}
      </SidebarContent>
    </Sidebar>
  );
};
