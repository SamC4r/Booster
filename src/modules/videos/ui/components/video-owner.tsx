'use client'
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { SubButton } from "@/modules/subscriptions/ui/components/sub-button";
import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { VideoGetOneOutput } from "../../types";
import { UserInfo } from "@/modules/users/ui/components/user-info";
import { UsersIcon, Edit3Icon, ZapIcon, HeartIcon, ChevronRightIcon, RocketIcon, Flame } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/trpc/client";
import { useFollow } from "@/modules/follows/hooks/follow-hook";
import { toast } from "sonner";
import { XpCard } from "@/modules/home/ui/components/xp-card";
import { AnimatePresence } from "framer-motion";

type User = {
  followsCount: number;
  viewerIsFollowing: boolean;
  videoCount: number;
  viewerRating: number;
  id: string;
  clerkId: string;
  name: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}


interface Props {
  user: User,
  videoId: string;
}

export const VideoOwner = ({ user, videoId }: Props) => {
  const { userId } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [xpProgress, setXpProgress] = useState(65); // Example progress percentage
  const [selectedXp, setSelectedXp] = useState(10);
  const [showAddXpModal, setShowAddXpModal] = useState(false);

  
  const [boostPoints] = trpc.xp.getBoostByUserId.useSuspenseQuery({userId:user.id})


  const progressPercentage = 92;

  const xpNeededForNextLevel = 1000;
  const level = 1;

  const clerk = useClerk();

  const channelLevel = 2;
  const xpToNextLevel = 250; // Example XP needed for next level
  const currentXp = 162; // Example current XP

  const { onClick, isPending } = useFollow({
    //ignore xd?
    userId: user.id,
    isFollowing: user.viewerIsFollowing,
    fromVideoId: videoId
  })

  const xpOptions = [10, 20, 50, 75, 100, 500, 1000];


  const handleAddXp = () => {
    // Here you would implement the actual XP adding logic
    console.log(`Adding ${selectedXp} XP`);
    setShowAddXpModal(false);
    toast.success(`Added ${selectedXp} XP to ${user.name}`);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSelectedXp(value);

    // Snap to the closest predefined value
    const closest = xpOptions.reduce((prev, curr) => {
      return Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev;
    });

    setSelectedXp(closest);
  };

  // Create evenly spaced positions for all markers
  const getMarkerPosition = (value: number, index: number) => {
    return (index / (xpOptions.length - 1)) * 100;
  };




  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col p-4 sm:p-4 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-[#333333] dark:to-[#333333] rounded-xl sm:rounded-2xl border border-gray-200 dark:border-[#404040] shadow-sm dark:shadow-none">
        {/* Add XP Modal */}
        <AnimatePresence>
          {showAddXpModal && (
            <XpCard user={user} setShowAddXpModal={setShowAddXpModal} />
          )}
        </AnimatePresence>
        {/* Top Section - User Info */}
        <div className="flex flex-col sm:flex-row items-start gap-4 min-w-0">
          <div className="flex items-start w-full sm:w-auto">
            <Link href={`/users/${user.id}`} className="flex-shrink-0">
              <div className="relative">
                <UserAvatar
                  size="lg"
                  imageUrl={user.imageUrl}
                  name={user.name}
                  className="ring-2 ring-white dark:ring-[#333333] shadow-lg"
                  userId={user.id}
                />

              </div>
            </Link>


          </div>

          <div className="flex flex-col flex-grow min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <div className="flex items-center gap-2">
                <UserInfo
                  size="lg"
                  name={user.name?.replace(/\s*null\s*$/i, "")}
                  className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#333333] dark:text-gray-300  py-1 rounded-full">
                <UsersIcon className="size-3 sm:size-4 text-purple-500 dark:text-purple-400" />
                <span className="font-medium text-xs sm:text-sm">{user.followsCount} </span>
              </div>
            </div>


          </div>

          {/* Edit/Subscribe Button for desktop */}
          <div className="hidden sm:flex items-center">
            {userId === user.clerkId ? (
              <Button
                className="rounded-full gap-2 shadow-sm hover:shadow-md transition-all dark:bg-[#333333] dark:text-white dark:hover:bg-[#404040]"
                asChild
                variant='secondary'
                size="sm"
              >
                <Link href={`/studio/videos/${videoId}`}>
                  <Edit3Icon className="size-4" />
                  Edit Video
                </Link>
              </Button>
            ) : (
              <SubButton
                onClick={onClick}
                disabled={isPending}
                isSubscribed={user.viewerIsFollowing}
                className="rounded-full p-4 shadow-sm hover:shadow-md transition-all bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
              />
            )}
          </div>

        </div>



      </div>
      <div className="bg-gradient-to-r from-amber-400/10 to-orange-500/10 dark:from-amber-400/5 dark:to-orange-500/5 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/50 shadow-sm flex-1 min-w-[300px]">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-1 rounded-lg">
              <ZapIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Level {level}</span>
          </div>

          <button
            onClick={() => setShowAddXpModal(true)}
            className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-600 text-white py-1 px-2 rounded-lg transition-colors"
          >
            <RocketIcon className="w-3 h-3" />
            <span>Boost</span>
          </button>
        </div>

        <div className="mb-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-orange-500 h-2.5 rounded-full relative overflow-hidden"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center text-center gap-5">
          <p className='text-xs font-semibold pb-1'>Boost progress: </p>
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            {progressPercentage.toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
};