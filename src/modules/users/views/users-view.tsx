"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { UserAvatar } from "@/components/user-avatar";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { compactDate, compactNumber } from "@/lib/utils";
import {
  Check,
  EyeIcon,
  Lock,
  Rocket,
  Sparkles,
  StarIcon,
  Settings,
  MessageSquare,
} from "lucide-react";
import { XpCard } from "@/modules/home/ui/components/xp-card";
import { VideoThumbnail } from "@/modules/videos/ui/components/video-thumbnail";
import Link from "next/link";
import { LevelUpBadge } from "../components/level-up-badge";
import { LevelUpAnimation } from "../components/level-up-animation";
import { BoosterRankings } from "../components/boosters-rankings";
import { RewardsView } from "@/modules/rewards/views/rewards-views";
import { useFollow } from "@/modules/follows/hooks/follow-hook";
import { SubButton } from "@/modules/subscriptions/ui/components/sub-button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { getUserIcons } from "@/modules/market/components/assetIcons/functions/get-user-icons";
import { useAuth } from "@clerk/nextjs";
import { PersonalizeModal } from "../components/personalize-modal";
import { useNotificationDropdown } from "@/contexts/notification-context";

interface Props {
  userId: string;
}

const f = (x: number) => {
  return Math.floor((x * x) / 1000);
};

const diff_time = (date?: Date | string | null): number => {
  if (!date) return Infinity;
  const d = date instanceof Date ? date : new Date(date);
  const t = d.getTime();
  if (Number.isNaN(t)) return Infinity; // invalid date string
  return (Date.now() - t) / (1000 * 60 * 60); // hours
};

export const UsersView = ({ userId }: Props) => {
  const { userId: clerkUserId } = useAuth();
  const { openMessages } = useNotificationDropdown();
  const [user] = trpc.users.getByUserId.useSuspenseQuery({ userId });
  const [followers] = trpc.follows.getFollowersByUserId.useSuspenseQuery({ userId, });
  const [userVideos] = trpc.users.getVideosByUserId.useSuspenseQuery({ userId, });
  const [boostPoints] = trpc.xp.getBoostByUserId.useSuspenseQuery({ userId });
  const [creatorViews] = trpc.videoViews.getAllViewsByUserId.useSuspenseQuery({ userId, });

  // Fetch equipped asset to trigger re-renders when it changes
  const { data: equippedAsset } = trpc.users.getEquippedAsset.useQuery(
    { userId },
    {
      refetchOnMount: true,
      staleTime: 0,
    }
  );

  // Check if viewing own profile
  const { data: currentUser } = trpc.users.getByClerkId.useQuery({
    clerkId: clerkUserId,
  }, {
    enabled: !!clerkUserId,
  });
  const isOwnProfile = currentUser?.id === userId;

  // Check if users can message each other (mutual follows)
  const { data: mutualFollows } = trpc.messages.getMutualFollows.useQuery(undefined, {
    enabled: !!clerkUserId && !isOwnProfile,
  });
  const canMessage = mutualFollows?.some(user => user.id === userId) || false;

  const utils = trpc.useUtils();

  const prefetchRankings = useCallback(() => {
    utils.xp.getBoostersByCreatorId.prefetch({ creatorId: userId });
  }, [utils, userId]);

  const [showXpPopup, setShowXpPopup] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const previousLevelRef = useRef<number | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showPersonalizeModal, setShowPersonalizeModal] = useState(false);

  const [activeTab, setActiveTab] = useState("videos");

  // Handle navigation to specific tab via URL hash
  useEffect(() => {
    const hash = window.location.hash.substring(1); // Remove the # symbol
    if (hash === "community" || hash === "about" || hash === "rewards") {
      setActiveTab(hash);
    }
  }, []);

  const channelLevel = Math.floor(
    Math.floor(Math.sqrt(boostPoints.boostPoints * 1000)) / 1000
  );

  const xpOnCurrentLevel = f(1000 * channelLevel);
  const xpForNextLevel = f(1000 * (channelLevel + 1));

  const recentUpgrade = diff_time(user?.newLevelUpgrade) <= 72;

  const { mutate: updateLevel } = trpc.xp.updateLevelChange.useMutation({
    onSuccess: () => {
      utils.users.getByUserId.invalidate({ userId });
    },
  });

  // Track level changes - only show animation on actual level ups, not initial load
  useEffect(() => {
    if (isInitialLoad) {
      // Set the initial level without showing animation
      previousLevelRef.current = channelLevel;
      setIsInitialLoad(false);
      return;
    }

    prefetchRankings();

    if (
      previousLevelRef.current !== null &&
      channelLevel > previousLevelRef.current
    ) {
      setNewLevel(channelLevel);
      setShowLevelUp(true);
      updateLevel({ userId });
    }
    previousLevelRef.current = channelLevel;
  }, [channelLevel, isInitialLoad, userId, prefetchRankings, updateLevel]);

  //TODO: implement community rankings

  // Calculate XP bar percentage
  const xpPercentage = Math.max(
    0,
    Math.min(
      100,
      ((boostPoints.boostPoints - xpOnCurrentLevel) /
        (xpForNextLevel - xpOnCurrentLevel)) *
      100
    )
  );



  const handleLevelUpComplete = () => {
    setShowLevelUp(false);
  };

  const { onClick, isPending } = useFollow({
    //ignore xd?
    userId: user.id,
    isFollowing: followers[0]?.viewerIsFollowing,
  });



  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Level Up Animation */}
      {showLevelUp && (
        <LevelUpAnimation
          newLevel={newLevel}
          onComplete={handleLevelUpComplete}
        />
      )}

      <div className="container mx-auto p-4">
        {/* Channel Header */}
        <div className="bg-card rounded-xl border border-border mt-6 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffca55] via-[#FFA100] to-[#ffca55]"></div>

          <div className="flex flex-col md:flex-row p-6">
            <div className="flex flex-col items-center md:items-center md:w-1/3 mb-6 md:mb-0 min-w-0">
              <UserAvatar
                size="xl"
                imageUrl={user?.imageUrl || undefined}
                name={user?.name || "Unknown user"}
                className={`w-40 h-40 border-4 border-border hover:border-primary transition-all duration-300 mb-4 ${showLevelUp ? "animate-pulse ring-4 ring-yellow-400" : ""
                  }`}
                userId={user.id}
                badgeSize={14}
              />

              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center text-center max-w-full">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent  line-clamp-2 max-w-[200px] md:max-w-[400px]">
                    {/* Code With Antonio and Angelie for a good software development j */}
                    {user?.name || "Unknown User"}
                  </h1>
                </div>
                {/* <PlanetIcon className="text-yellow-600 ml-2 shadow-red-100/50 bg-transparent size-8 flex-shrink-0" /> */}
                <div className="mt-1" key={equippedAsset?.assetId || 'no-asset'}>

                  {getUserIcons(user.id, 10)}
                </div>



                <div className="flex flex-wrap gap-3 my-4 justify-center md:justify-start">
                  <div className="bg-muted/50 p-3 rounded-lg border border-border text-center min-w-[90px]  transition-transform">
                    <div className="text-primary font-bold text-lg">
                      {userVideos.userVideos.length}
                    </div>
                    <div className="text-muted-foreground text-xs uppercase">
                      Video{userVideos.userVideos.length === 1 ? "" : "s"}{" "}
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg border border-border text-center min-w-[90px] transition-transform">
                    <div className="text-primary font-bold text-lg">
                      {compactNumber(Number(followers[0]?.followsCount) || 0)}
                    </div>
                    <div className="text-muted-foreground text-xs uppercase">
                      Follower{followers[0]?.followsCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg border border-border text-center min-w-[90px]  transition-transform">
                    <div className="text-primary font-bold text-lg">
                      {compactNumber(creatorViews[0]?.creatorViews || 0)}
                    </div>
                    <div className="text-muted-foreground text-xs uppercase">
                      View{creatorViews[0]?.creatorViews === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm mt-3">
                  {user.about}
                </p>
              </div>
            </div>

            {/* XP POP UP */}
            {showXpPopup && (
              <XpCard user={user} setShowAddXpModal={setShowXpPopup} />
            )}

            <div className="md:w-2/3 md:pl-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Channel Boost
                </h2>
                <div
                  className={`text-primary font-bold flex items-center gap-2 ${showLevelUp ? "animate-bounce" : ""
                    }`}
                >
                  Level {channelLevel}
                  {showLevelUp && (
                    <Sparkles className="w-4 h-4 text-yellow-500 animate-spin" />
                  )}
                </div>
              </div>

              <div className="w-full h-6 bg-muted/20 rounded-full overflow-hidden border border-border mb-2 relative">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full relative overflow-hidden transition-all duration-1000 ease-out"
                  style={{ width: `${xpPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/40 mix-blend-overlay"></div>

                  {/* Animated shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] animate-shine"></div>
                </div>

                {/* Level up indicator notch */}
                {/* <div 
                  className="absolute top-0 h-full w-1 bg-yellow-400 shadow-lg"
                  style={{ left: `${xpPercentage}%` }}
                /> */}
              </div>

              <div className="flex justify-between text-muted-foreground text-sm mb-4">
                <div className="flex items-start gap-1 text-center">
                  <span className="font-semibold">Boost progress </span>
                  <span>{xpPercentage.toFixed(2)}% </span>
                </div>
                <span>
                  {(xpForNextLevel - boostPoints.boostPoints).toLocaleString()}{" "}
                  XP for next level
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">

                {isOwnProfile ? (
                  // Show "Personalize Channel" button for own profile
                  <Button
                    onClick={() => setShowPersonalizeModal(true)}
                    // className="rounded-full p-4 shadow-sm hover:shadow-md transition-all bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                    className="rounded-full shadow-sm hover:from-amber-400 hover:to-orange-400"
                  >
                    <Settings className="size-4 mr-2" />
                    Personalize Channel
                  </Button>
                ) : (
                  // Show Follow button for other users
                  <>
                    {isPending ? (
                      <Button
                        className="rounded-full flex justify-center text-center p-4 shadow-sm hover:shadow-md transition-all bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                      >
                        <Spinner variant="circle" />
                      </Button>
                    ) : (
                      <SubButton
                        onClick={onClick}
                        disabled={isPending}
                        isSubscribed={followers[0]?.viewerIsFollowing}
                        className="rounded-full p-4 shadow-sm hover:shadow-md transition-all bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                      />
                    )}
                  </>
                )}

                {!isOwnProfile && canMessage && (
                  <Button
                    onClick={() => openMessages(userId)}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-2 px-6 rounded-full hover:opacity-90 transition-all hover:scale-105 active:scale-95"
                  >
                    <MessageSquare className="size-4 mr-2" />
                    Message
                  </Button>
                )}

                {!isOwnProfile && (
                  <Button
                    onClick={() => setShowXpPopup(true)}
                    className="bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold py-2 px-6 rounded-full hover:opacity-90 transition-all hover:scale-105 active:scale-95"
                  >
                    <Rocket className="size-4 mr-2" />
                    Boost
                  </Button>
                )}

              </div>

              <div className="flex justify-between ">
                <div className="mt-6">
                  <h3 className="text-primary font-semibold mb-3">
                    Unlocked Rewards
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="text-primary mr-2">
                        <Check className="size-4" />
                      </span>
                      <span>Custom Emotes</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-primary mr-2">
                        <Check className="size-4" />
                      </span>
                      <span>Extended Video Upload Quality</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span className="text-primary mr-2">
                        <Lock className="size-4" />
                      </span>
                      <span>Verified</span>
                    </div>
                  </div>
                </div>

                <div>
                  {recentUpgrade && <LevelUpBadge newLevel={channelLevel} />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="flex flex-wrap gap-2 my-6 bg-muted/50 p-2 rounded-xl border border-border w-fit">
          {["videos", "community", "rewards", "about"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === tab
                ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/50"
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Video Grid */}
        {activeTab === "videos" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {userVideos.userVideos.map((video) => (
              <Link
                key={video.id}
                className="group bg-card border border-border rounded-2xl transition-transform hover:scale-[1.02] cursor-pointer shadow-sm"
                href={`/videos/${video.id}`}
              >
                <div className="relative overflow-hidden rounded-t-2xl">
                  <VideoThumbnail
                    duration={video.duration || 0}
                    title={video.title}
                    imageUrl={video.thumbnailUrl}
                    previewUrl={video.previewUrl}
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold line-clamp-2 mb-2 text-foreground">
                    {video.title || "Untitled Video"}
                  </h3>
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <EyeIcon className="size-4" />
                        {compactNumber(Number(video.videoViews) || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <StarIcon className="size-4 text-yellow-500 dark:text-yellow-300" />
                        {(Number(video.averageRating) || 0).toFixed(1)}
                      </span>
                    </div>
                    <span>{compactDate(video.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === "community" && <BoosterRankings userId={userId} />}

        {activeTab === "rewards" && <RewardsView userId={userId} />}

        {activeTab === "about" && (
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4">About</h3>
            <p className="text-muted-foreground">
              {user.about || "No description available."}
            </p>
          </div>
        )}
      </div>

      {/* Personalize Modal */}
      <PersonalizeModal
        isOpen={showPersonalizeModal}
        onClose={() => setShowPersonalizeModal(false)}
      />
    </div>
  );
};
