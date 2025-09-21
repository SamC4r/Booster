'use client'
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { SubButton } from "@/modules/subscriptions/ui/components/sub-button";
import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { VideoGetOneOutput } from "../../types";
import { UserInfo } from "@/modules/users/ui/components/user-info";
import { UsersIcon, Edit3Icon, ZapIcon, HeartIcon, ChevronRightIcon, RocketIcon } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/trpc/client";
import { useFollow} from "@/modules/follows/hooks/follow-hook";

interface Props {
  user: VideoGetOneOutput["user"];
  videoId: string;
}

export const VideoOwner = ({ user, videoId}: Props) => {
  const { userId } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [xpProgress, setXpProgress] = useState(65); // Example progress percentage

  const clerk = useClerk();

  const channelLevel = 2;
  const xpToNextLevel = 250; // Example XP needed for next level
  const currentXp = 162; // Example current XP

  const {onClick,  isPending} = useFollow({
    userId: user.id,
    isFollowing: user.viewerIsFollowing,
    fromVideoId: videoId
  })

  const handleSupport = () => {
    setIsSupported(!isSupported);
    // Add your support logic here
  };

  return (
    <div className="flex flex-col p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-[#212121] dark:to-[#1a1a1a] rounded-xl sm:rounded-2xl border border-gray-200 dark:border-[#404040] shadow-sm dark:shadow-none">
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
              />
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-0.5 shadow-md">
                <div className="bg-white dark:bg-[#333333] rounded-full p-1">
                  <ZapIcon className="size-3 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </Link>
          
          {/* Edit/Subscribe Button for mobile */}
          <div className="ml-auto sm:hidden">
            {userId === user.clerkId ? (
              <Button
                className="rounded-full gap-2 shadow-sm hover:shadow-md transition-all dark:bg-[#333333] dark:text-white dark:hover:bg-[#404040]"
                asChild
                variant="secondary"
                size="sm"
              >
                <Link href={`/studio/videos/${videoId}`}>
                  <Edit3Icon className="size-4" />
                </Link>
              </Button>
            ) : (
              <SubButton
                onClick={onClick}
                disabled={false}
                isSubscribed={user.viewerIsFollowing}
                className="rounded-full p-2 shadow-sm hover:shadow-md transition-all dark:bg-[#333333] dark:text-white dark:hover:bg-[#404040]"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col flex-grow min-w-0 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
            <div className="flex items-center gap-2">
              <UserInfo
                size="lg"
                name={user.name?.replace(/\s*null\s*$/i, "")}
                className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg"
              />
              <div className="hidden sm:flex items-center bg-gradient-to-r from-green-400 to-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                <ZapIcon className="size-3 mr-1" />
                Level {channelLevel} - Pupil
              </div>
            </div>
            
            {/* Level badge for mobile */}
            <div className="sm:hidden flex items-center bg-gradient-to-r from-green-400 to-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full w-fit">
              <ZapIcon className="size-3 mr-1" />
              Level {channelLevel} - Pupil
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#333333] dark:text-gray-300 px-2 sm:px-3 py-1 rounded-full">
              <UsersIcon className="size-3 sm:size-4 text-purple-500 dark:text-purple-400" />
              <span className="font-medium text-xs sm:text-sm">{user.followsCount}</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-gray-400 dark:bg-gray-600 hidden sm:block"></div>
            <span className="text-xs sm:text-sm dark:text-gray-300">{user.videoCount} videos</span>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 text-clip">
            Official channel for creative tutorials and entertainment aaaaaaaaaaaaaaaaaaaaaaaaaaaaa. Subscribe to never miss an update!  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa a a aa a a
          </p>
        </div>

        {/* Edit/Subscribe Button for desktop */}
        <div className="hidden sm:flex items-center">
          {userId === user.clerkId ? (
            <Button
              className="rounded-full gap-2 shadow-sm hover:shadow-md transition-all dark:bg-[#333333] dark:text-white dark:hover:bg-[#404040]"
              asChild
              variant="secondary"
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
              className="rounded-full p-6 shadow-sm hover:shadow-md transition-all dark:bg-[#333333] dark:text-white dark:hover:bg-[#404040]"
            />
          )}
        </div>
      </div>

      {/* XP Progress Bar (Discord-like) */}
      <div className="mt-4 sm:mt-5 p-3 sm:p-4 bg-white dark:bg-[#333333] rounded-lg sm:rounded-xl border border-gray-200 dark:border-[#404040] shadow-xs">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <RocketIcon className="size-3 sm:size-4 text-amber-500" />
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">Channel Boost</span>
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{currentXp}/{xpToNextLevel} XP</span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-[#404040] rounded-full h-2 sm:h-2.5 mb-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-cyan-500 h-2 sm:h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${xpProgress}%` }}
          ></div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-3">
          <div className="flex items-center bg-gradient-to-r from-cyan-400 to-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded-full w-fit">
            <ZapIcon className="size-3 mr-1" />
            Next level: {channelLevel + 1} - Specialist
          </div>
          
          <Button 
            onClick={handleSupport}
            variant={isSupported ? "default" : "outline"}
            size="sm"
            className="rounded-full gap-1.5 text-xs transition-all w-full sm:w-auto dark:border-gray-600 dark:text-white dark:hover:bg-[#404040]"
          >
            <HeartIcon className={`size-3 sm:size-4 ${isSupported ? "fill-white" : ""}`} />
            {isSupported ? "Supported" : "Support"}
          </Button>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 text-xs text-gray-500 dark:text-gray-400 gap-2 sm:gap-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <span className="text-xs">✨ 24.5K supporters</span>
          <span className="hidden sm:inline dark:text-gray-600">•</span>
          <span className="text-xs">⭐ 98% satisfaction</span>
        </div>
        <button className="flex items-center text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors text-xs mt-1 sm:mt-0">
          See all perks <ChevronRightIcon className="size-3 sm:size-4" />
        </button>
      </div>
    </div>
  );
};