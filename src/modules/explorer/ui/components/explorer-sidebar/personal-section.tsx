'use client';

import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useAuth, useClerk } from "@clerk/nextjs";
import { FileQuestionMark, FlameIcon, HistoryIcon, HomeIcon, ListVideoIcon, MessageCircleQuestion, PlaySquareIcon, Settings, Sidebar, Star, StarIcon, Stars, ThumbsUpIcon } from "lucide-react";
import Link from "next/link";


const items = [
    
    {
        title: "Rated videos",
        url: "/rated",
        icon: Stars,
        auth:true,
    },
   
    {
        title: "Settings",
        url: "/settings",
        icon: Settings,
        auth:true,
    },

    {
        title: "Help",
        url: "/help",
        icon: MessageCircleQuestion,
        auth:false,
    },


]

export const PersonalSection = () => {


    const {userId, isSignedIn}= useAuth();
    const clerk = useClerk();



    return (
        <SidebarGroup>
            <SidebarGroupLabel>
                Personal
            </SidebarGroupLabel>
            <SidebarGroupContent>
               <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                tooltip={item.title}
                                asChild
                                isActive={false}
                                onClick={(e)=>{
                                    if(!isSignedIn && item.auth){
                                        e.preventDefault(); //cancel the event
                                        clerk.openSignIn();
                                    }
                                }}
                            >
                                <Link href={item.url} className='flex items-center gap-4'>
                                    <item.icon />
                                    <span className='text-sm'>{item.title}</span>
                                </Link>

                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
               </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}