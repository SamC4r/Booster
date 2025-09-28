'use client';

import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useAuth, useClerk } from "@clerk/nextjs";
import { FileQuestionMark, FlameIcon, HistoryIcon, HomeIcon, ListVideoIcon, MessageCircleQuestion, PlaySquareIcon, Settings, Sidebar, Star, StarIcon, Stars, ThumbsUpIcon } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";


const items = [

    {
        title: "Rated videos",
        url: "/rated",
        icon: Stars,
        auth: true,
    },

    {
        title: "Help",
        url: "/help",
        icon: MessageCircleQuestion,
        auth: false,
    },

    {
        title: "Settings",
        url: "/settings",
        icon: Settings,
        auth: true,
    },


]

export const PersonalSection = () => {



    const { userId, isSignedIn } = useAuth();
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
        <SidebarGroup>
            <SidebarGroupLabel>
                Personal
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu className="">
                    {items.map((item) => {
                        const isActive = activeItem === item.title;
                        const isHovered = hoveredItem === item.title;
                        const Icon = item.icon;

                        return (
                            <SidebarMenuItem key={item.title} className="relative">
                                {/* Active state background with subtle animation */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-white/10 rounded-lg border  shadow-sm backdrop-blur-sm" />
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
                                        py-6
                                        transition-all duration-300 ease-out
                                        ${isActive
                                            ? ' bg-white/5 shadow-sm'
                                            : ' hover:scale-[1.01] hover:bg-white/3'
                                        }
                                        border border-transparent
                                        ${isActive ? '' : ''}
                                        rounded-lg
                                        overflow-hidden
                                        group
                                        backdrop-blur-sm
                                    `}
                                >
                                    <Link
                                        href={item.url}
                                        className="flex items-center gap-3 p-3 relative z-10"
                                    >
                                        {/* Icon with modern styling */}
                                        <div className={`
                                            relative
                                            transition-all duration-300 ease-out
                                            ${isActive
                                                ? 'bg-amber-500 text-slate-900 shadow-sm'
                                                : 'bg-white/5 text-white/70 group-hover:bg-amber-300/10 group-hover:text-white'
                                            }
                                            rounded-lg p-2
                                            ${isActive ? 'scale-100' : 'scale-100 group-hover:scale-105'}
                                        `}>
                                            <Icon className={`
                                                w-4 h-4 transition-transform duration-300
                                                ${isActive ? 'scale-100' : 'scale-100'}
                                            `} />

                                            {/* Active indicator dot
                                            {isActive && (
                                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-slate-900" />
                                            )} */}
                                        </div>

                                        {/* Text with modern typography */}
                                        <span className={`
                                            text-sm font-medium transition-all duration-300
                                            ${isActive
                                                ? 'text-white font-semibold'
                                                : 'text-white/70 group-hover:text-white/90'
                                            }
                                            ${isActive ? 'translate-x-1' : 'translate-x-0'}
                                        `}>
                                            {item.title}
                                        </span>



                                        {/* Subtle hover arrow */}
                                        {!isActive && (
                                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                <div className="w-1 h-1 bg-white/50 rounded-full" />
                                            </div>
                                        )}
                                    </Link>
                                </SidebarMenuButton>

                                {/* Subtle glow effect for active item
                                {isActive && (
                                    <div className="absolute inset-0 bg-white/3 blur-md rounded-lg -z-10 animate-pulse" />
                                )} */}
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}