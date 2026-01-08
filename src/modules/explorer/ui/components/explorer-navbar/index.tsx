"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { SearchInput } from "./search-input";
import { AuthButton } from "@/modules/auth/ui/components/auth-button";

import { Tv2Icon, Upload } from "lucide-react";
import { User as RetroUser, FileTransfer as RetroUpload } from "@react95/icons";
import { useTheme } from "next-themes";
import { trpc } from "@/trpc/client";
import { useAuth, useClerk } from "@clerk/nextjs";
import { XpIndicator } from "@/modules/xp/ui/components/xp-indicator";
import { NotificationBell } from "@/modules/notifications/components/notification-bell";

// XP indicator with loading state and tooltip


// Navigation item component to avoid repetition
const NavItem = ({
  href,
  children,
  userId,
  clerk,
}: {
  href: string;
  children: React.ReactNode;
  userId: string | undefined;
  clerk: any;
}) => {
  if (!userId) {
    return (
      <button
        onClick={() => clerk.openSignIn()}
        className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors nav-item-button"
      >
        {children}
      </button>
    );
  } else {
    return (
      <Link
        href={href}
        className="px-2 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors nav-item-button"
      >
        {children}
      </Link>
    );
  }
};

export const ExplorerNavBar = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Simulate loading XP data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Add scroll effect to navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { userId: clerkUserId } = useAuth();
  const clerk = useClerk();
  const { data: user } = trpc.users.getByClerkId.useQuery({
    clerkId: clerkUserId,
  });
  const userId = user?.id;
  const { data: myXp } = trpc.xp.getXpByUserId.useQuery(
    { userId: userId! },
    {
      enabled: !!userId,
      staleTime: 6000,           // reduce refetching
      refetchOnWindowFocus: false, // optional 
    }
  );


  return (
    <nav
      className={`fixed top-0 left-0 right-0 h-16 bg-background backdrop-blur-md flex items-center px-4 transition-all z-50 ${isScrolled ? "shadow-sm" : ""
        }`}
    >
      <div className="flex items-center justify-between w-full">
        {/* Menu and logo */}
        <div className={`flex items-center flex-shrink-0 z-50 ${isMobileSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
          <SidebarTrigger />
          <Link
            href="/"
            className="flex items-center p-2 rounded-md hover:bg-muted transition-colors nav-logo-link"
          >
            <div className="flex items-center">
              {/*<Image
                src="/logo.webp"
                alt="Logo"
                width={30}
                height={30}
                className="mr-2"
              /> */}
              <Image
                src="/BoosterLongLogo.webp"
                alt="Booster"
                width={150}
                height={30}
                className="hidden sm:block no-border"
              />
            </div>
          </Link>
        </div>

        {/* Search bar */}
        <div className={`flex-1 flex justify-start max-w-[600px] mx-4 sm:ml-[12rem] ${isMobileSearchOpen ? 'w-full ml-0 max-w-full mx-0' : ''}`}>
          <SearchInput isMobileSearchOpen={isMobileSearchOpen} setIsMobileSearchOpen={setIsMobileSearchOpen} />
        </div>

        {/* XP indicator + right controls */}
        <div className={`flex-shrink-0 items-center flex gap-3 ${isMobileSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
          {/* Desktop navigation */}

          <NavItem clerk={clerk} userId={userId} href={`/users/${userId}`}>
            <div className="flex items-center gap-2">
              {mounted && theme === 'retro' ? <RetroUser variant="32x32_4" /> : <Tv2Icon className="size-4" />}
              <span className="hidden sm:block">My Channel</span>
            </div>
          </NavItem>

          <NavItem clerk={clerk} userId={userId} href="/studio?create=true">
            <div className="flex items-center gap-2">
              {mounted && theme === 'retro' ? <RetroUpload width={32} height={32} /> : <Upload className="size-4" />}
              <span className="hidden sm:block">Create</span>
            </div>
          </NavItem>

          <NotificationBell />
          {user?.accountType !== 'business' && (
            <XpIndicator xp={myXp?.xp || 0} isLoading={isLoading} />
          )}
          <AuthButton />
        </div>
      </div>
    </nav>
  );
};
