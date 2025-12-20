"use client";

import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export const RankingsSection = () => {
    const pathname = usePathname();
    const isActive = pathname === "/rankings";
    const [isHovered, setIsHovered] = useState(false);

    return (
        <SidebarGroup className="relative bg-background pt-0">
            <SidebarGroupContent className="relative z-10 bg-background">
                <SidebarMenu>
                    <SidebarMenuItem className="relative">
                        {/* Active state background */}
                        {isActive && (
                            <div className="absolute inset-0 bg-accent rounded-full border border-border shadow-sm" />
                        )}
                        
                        {/* Hover state background */}
                        {isHovered && !isActive && (
                            <div className="absolute inset-0 bg-accent/50 rounded-full transition-all duration-200" />
                        )}

                        <SidebarMenuButton
                            tooltip="Top Channels"
                            asChild
                            isActive={isActive}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            className={`
                                relative
                                transition-all duration-200
                                rounded-full
                                ${isActive 
                                    ? 'bg-accent/50 rounded-full' 
                                    : 'hover:bg-accent/30'
                                }
                                group
                                h-12 
                                mx-0.5 
                            `}
                        >
                            <Link href="/rankings" className="flex items-center gap-3 w-full h-full relative z-10">
                                {/* Icon container */}
                                <div className={`
                                    flex items-center justify-center
                                    transition-all duration-200
                                    ${isActive 
                                        ? 'bg-amber-500 text-slate-900' 
                                        : 'bg-muted text-muted-foreground group-hover:bg-amber-500/10 group-hover:text-foreground'
                                    }
                                    rounded-lg
                                    w-8 h-8
                                    min-w-[2rem]
                                    flex-shrink-0
                                `}>
                                    <Trophy className="w-5 h-5" />
                                </div>
                                
                                <span className={`
                                    text-base font-medium transition-all duration-200
                                    ${isActive 
                                        ? 'text-foreground font-semibold' 
                                        : 'text-muted-foreground group-hover:text-foreground'
                                    }
                                    whitespace-nowrap
                                    overflow-hidden
                                `}>
                                    Top Channels
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
};
