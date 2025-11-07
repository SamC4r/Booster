'use client';

import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { EarthIcon, FlameIcon, PlayIcon, ShoppingCart, Users, ShieldQuestionIcon, BoxesIcon } from "lucide-react";
import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useEffect } from "react";

const items = [
    {
        title: "Next Up",
        url: "/",
        icon: PlayIcon,
    },
    {
        title: "Explorer",
        url: "/explorer",
        icon: EarthIcon
    },
    {
        title: "Following",
        url: "/feed/follows",
        icon: Users,
        auth: true,
    },
    {
        title: "Trending",
        url: "/feed/trending",
        icon: FlameIcon,
    }, 
    {
        title: "Market",
        url: "/market",
        icon: ShoppingCart,
    },
    {
        title: "About",
        url: "/about",
        icon: ShieldQuestionIcon,
    },
];

export const MainSection = () => {
    const { isSignedIn } = useAuth();
    const clerk = useClerk();
    const [activeItem, setActiveItem] = useState("Next Up");
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    useEffect(() => {
        const currentPath = window.location.pathname;
        const currentItem = items.find(item => 
            item.url === currentPath || 
            (currentPath.startsWith(item.url) && item.url !== "/")
        );
        if (currentItem) {
            setActiveItem(currentItem.title);
        }
    }, []);

    return (
        <SidebarGroup className="relative bg-background">
            <SidebarGroupContent className="relative z-10 bg-background">
                <SidebarMenu>
                    {items.map((item) => {
                        const isActive = activeItem === item.title;
                        const isHovered = hoveredItem === item.title;
                        const Icon = item.icon;
                        
                        return (
                            <SidebarMenuItem key={item.title} className="relative">
                                {/* Active state background */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-white/10 rounded-lg border border-white/20 shadow-sm" />
                                )}
                                
                                {/* Hover state background */}
                                {isHovered && !isActive && (
                                    <div className="absolute inset-0 bg-white/5 rounded-lg transition-all duration-200" />
                                )}

                                <SidebarMenuButton
                                    tooltip={item.title}
                                    asChild
                                    isActive={isActive}
                                    onClick={(e) => {
                                        if (!isSignedIn && item.auth) {
                                            e.preventDefault();
                                            return clerk.openSignIn();
                                        }
                                        setActiveItem(item.title);
                                    }}
                                    onMouseEnter={() => setHoveredItem(item.title)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                    className={`
                                        relative
                                        transition-all duration-200
                                        ${isActive 
                                            ? 'bg-white/5' 
                                            : 'hover:bg-white/3'
                                        }
                                        rounded-lg
                                        group
                                        h-10 /* Fixed height for consistency */
                                        mx-0.5 /* Add some horizontal margin */
                                    `}
                                >
                                    <Link 
                                        href={item.url} 
                                        className="flex items-center gap-2 w-full h-full  relative z-10"
                                    >
                                        {/* Icon container - simplified for collapsed mode */}
                                        <div className={`
                                            flex items-center justify-center
                                            transition-all duration-200
                                            ${isActive 
                                                ? 'bg-amber-500 text-slate-900' 
                                                : 'bg-white/10 text-white/70 group-hover:bg-amber-300/10 group-hover:text-white'
                                            }
                                            rounded-lg
                                            w-6 h-6 /* Smaller size for collapsed mode */
                                            min-w-[1.5rem] /* Prevent shrinking */
                                            flex-shrink-0 /* Prevent shrinking in flex container */
                                        `}>
                                            <Icon className="w-4 h-4" /> {/* Smaller icon */}
                                        </div>
                                        
                                        {/* Text - will be hidden by sidebar when collapsed */}
                                        <span className={`
                                            text-sm font-medium transition-all duration-200
                                            ${isActive 
                                                ? 'text-white font-semibold' 
                                                : 'text-white/70 group-hover:text-white/90'
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