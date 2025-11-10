"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { SearchInput } from "./search-input";
import { AuthButton } from "@/modules/auth/ui/components/auth-button";

import { Tv2Icon, Upload } from "lucide-react";
import { trpc } from "@/trpc/client";
import { useAuth, useClerk } from "@clerk/nextjs";
import { XpIndicator } from "@/modules/xp/ui/components/xp-indicator";

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
        className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {children}
      </button>
    );
  } else {
    return (
      <Link
        href={href}
        className="px-2 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {children}
      </Link>
    );
  }
};

export const ExplorerNavBar = () => {

  
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

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
    enabled: !!userId,           // dont fetch until there is a user
    staleTime: 60_000,           // reduce refetching
    refetchOnWindowFocus: false, // optional (suggested by companion)
  }
);


  return (
    <nav
      className={`fixed top-0 left-0 right-0 h-16 bg-background backdrop-blur-md flex items-center px-4 border-b border-border/50 transition-all z-50 ${
        isScrolled ? "shadow-sm" : ""
      }`}
    >
      <div className="flex items-center justify-between w-full">
        {/* Menu and logo */}
        <div className="flex items-center flex-shrink-0 z-50">
          <SidebarTrigger />
          <Link
            href="/"
            className="flex items-center p-2 rounded-md hover:bg-muted transition-colors"
          >
            <div className="flex items-center">
              <Image
                src="/logo.webp"
                alt="Logo"
                width={30}
                height={30}
                className="mr-2"
              />
              <Image
                src="/BoosterLongLogo.webp"
                alt="Booster"
                width={150}
                height={30}
                className="hidden sm:block"
              />
            </div>
          </Link>
        </div>

        {/* Search bar */}
        <div className="flex-1 flex justify-start max-w-[600px] mx-4 sm:ml-[12rem]">
          <SearchInput />
        </div>

        {/* XP indicator + right controls */}
        <div className="flex-shrink-0 items-center flex gap-3">
          {/* Desktop navigation */}

          <NavItem clerk={clerk} userId={userId} href={`/users/${userId}`}>
            <div className="flex items-center gap-2">
              <Tv2Icon className="size-4" />
              My Channel
            </div>
          </NavItem>

          <NavItem clerk={clerk} userId={userId} href="/studio">
            <div className="flex items-center gap-1">
              <Upload className="size-4" />
              Upload
            </div>
          </NavItem>

          <XpIndicator xp={myXp?.xp || 0} isLoading={isLoading} />
          <AuthButton />
        </div>
      </div>
    </nav>
  );
};
