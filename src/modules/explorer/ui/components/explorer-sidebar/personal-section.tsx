'use client';

import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useAuth, useClerk } from "@clerk/nextjs";
import {  MessageCircleQuestion,  Settings, Stars } from "lucide-react";
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



    const {  isSignedIn } = useAuth();
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
                                        h-10
                                        mx-0.5
                                    `}
                                >
                                    <Link
                                        href={item.url}
                                        className="flex items-center gap-3 w-full h-full relative z-10"
                                    >
                                        {/* Icon with modern styling */}
                                        <div className={`
                                            flex items-center justify-center
                                            transition-all duration-300 ease-out
                                            ${isActive
                                                ? 'bg-amber-500 text-slate-900 shadow-sm'
                                                : 'bg-white/5 text-white/70 group-hover:bg-amber-300/10 group-hover:text-white'
                                            }
                                            rounded-lg 
                                            w-6 h-6
                                            min-w-[1.5rem]
                                            flex-shrink-0
                                        `}>
                                            <Icon className='w-4 h-4'/>

                                           
                                        </div>

                                        {/* Text with modern typography */}
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



                                        {/* Subtle hover arrow */}
                                       
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