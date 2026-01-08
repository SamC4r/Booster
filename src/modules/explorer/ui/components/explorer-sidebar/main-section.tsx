'use client';

import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { EarthIcon, PlayIcon, ShoppingCart, Users, Building2, Megaphone, TrophyIcon } from "lucide-react";
import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/trpc/client";

const items = [
    {
        title: "Next Up",
        url: "/next-up",
        icon: PlayIcon,
    },
    {
        title: "Explorer",
        url: "/",
        icon: EarthIcon
    },

    {
        title: "Following",
        url: "/feed/follows",
        icon: Users,
        auth: true,
    },
    {
        title: "Market",
        url: "/market",
        icon: ShoppingCart,
    },
    {
        title: "Communities",
        url: "/c",
        icon: Megaphone,
    },
    {
        title: "Top Channels",
        url: "/rankings",
        icon: TrophyIcon,
    }
];

export const MainSection = () => {
    const { isSignedIn, userId } = useAuth();
    const clerk = useClerk();
    const [activeItem, setActiveItem] = useState("");
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const { data: user } = trpc.users.getByClerkId.useQuery({ clerkId: userId }, { enabled: !!userId });

    const displayItems = useMemo(() => {
        const filtered = items.filter(item => {
            if (user?.accountType === 'business' && item.title === 'Market') return false;
            return true;
        });

        if (user?.accountType === 'business') {
            // Insert Business item after Following (index 2)
            const businessItem = {
                title: "Business",
                url: "/business",
                icon: Building2,
            };

            // Find index of Following to insert after, or just push if not found
            const followingIndex = filtered.findIndex(i => i.title === "Following");
            if (followingIndex !== -1) {
                filtered.splice(followingIndex + 1, 0, businessItem);
            } else {
                filtered.push(businessItem);
            }
        }

        return filtered;
    }, [user?.accountType]);

    useEffect(() => {
        const currentPath = window.location.pathname;
        const currentItem = displayItems.find(item =>
            item.url === currentPath ||
            (currentPath.startsWith(item.url) && item.url !== "/")
        );
        if (currentItem) {
            setActiveItem(currentItem.title);
        } else {
            setActiveItem("");
        }
    }, [displayItems]);

    return (
        <SidebarGroup className="relative bg-background pb-0">
            <SidebarGroupContent className="relative z-10 bg-background">
                <SidebarMenu>
                    {displayItems.map((item) => {
                        const isActive = activeItem === item.title;
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
                                    <Link
                                        href={item.url}
                                        className="flex items-center gap-3 w-full h-full  relative z-10"
                                    >
                                        {/* Icon container - simplified for collapsed mode */}
                                        <div className={`
                                            flex items-center justify-center
                                            transition-all duration-200
                                            ${isActive
                                                ? 'bg-amber-500 text-slate-900'
                                                : 'bg-muted text-muted-foreground group-hover:bg-amber-500/10 group-hover:text-foreground'
                                            }
                                            rounded-lg
                                            w-8 h-8 /* Smaller size for collapsed mode */
                                            min-w-[2rem] /* Prevent shrinking */
                                            flex-shrink-0 /* Prevent shrinking in flex container */
                                        `}>
                                            <Icon className="w-5 h-5" /> {/* Smaller icon */}
                                        </div>

                                        {/* Text - will be hidden by sidebar when collapsed */}
                                        <span className={`
                                            text-base font-medium transition-all duration-200
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
