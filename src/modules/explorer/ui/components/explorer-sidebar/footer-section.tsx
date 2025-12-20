"use client";

import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { ShieldQuestionIcon, BookOpen, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const items = [
    {
        title: "Settings",
        url: "/settings",
        icon: Settings,
    },
    {
        title: "Guidelines",
        url: "/guidelines",
        icon: BookOpen,
    },
    {
        title: "About",
        url: "/about",
        icon: ShieldQuestionIcon,
    },
];

export const FooterSection = () => {
    const pathname = usePathname();
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    return (
        <SidebarGroup className="relative bg-background mt-auto">
            <SidebarGroupContent className="relative z-10 bg-background">
                <SidebarMenu>
                    {items.map((item) => {
                        const isActive = pathname === item.url;
                        const isHovered = hoveredItem === item.title;
                        const Icon = item.icon;

                        return (
                            <SidebarMenuItem key={item.title} className="relative">
                                {/* Active state background */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-accent rounded-full border border-border shadow-sm" />
                                )}
                                
                                {/* Hover state background */}
                                {isHovered && !isActive && (
                                    <div className="absolute inset-0 bg-accent/50 rounded-full transition-all duration-200" />
                                )}

                                <SidebarMenuButton
                                    tooltip={item.title}
                                    asChild
                                    isActive={isActive}
                                    onMouseEnter={() => setHoveredItem(item.title)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                    className={`
                                        relative
                                        transition-all duration-200
                                        rounded-full
                                        ${isActive 
                                            ? 'bg-accent/50 rounded-full' 
                                            : 'hover:bg-accent/30'
                                        }
                                        group
                                        h-10 
                                        mx-0.5 
                                    `}
                                >
                                    <Link href={item.url} className="flex items-center gap-2 w-full h-full relative z-10">
                                        {/* Icon container */}
                                        <div className={`
                                            flex items-center justify-center
                                            transition-all duration-200
                                            ${isActive 
                                                ? 'bg-amber-500 text-slate-900' 
                                                : 'bg-muted text-muted-foreground group-hover:bg-amber-500/10 group-hover:text-foreground'
                                            }
                                            rounded-lg
                                            w-6 h-6
                                            min-w-[1.5rem]
                                            flex-shrink-0
                                        `}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        
                                        <span className={`
                                            text-sm font-medium transition-all duration-200
                                            ${isActive 
                                                ? 'text-foreground font-semibold' 
                                                : 'text-muted-foreground group-hover:text-foreground'
                                            }
                                            whitespace-nowrap
                                            overflow-hidden
                                        `}>
                                            {item.title}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
};
