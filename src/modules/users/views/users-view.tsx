'use client'

import { useState, useEffect, useRef } from "react"
import { UserAvatar } from "@/components/user-avatar"
import { trpc } from "@/trpc/client"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { compactDate } from "@/lib/utils"
import { Check, EyeIcon, Lock, Rocket, Star, Zap, Sparkles, Badge, Crown, Trophy, RocketIcon } from "lucide-react"
import { XpCard } from "@/modules/home/ui/components/xp-card"
import { VideoThumbnail } from "@/modules/videos/ui/components/video-thumbnail"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { diff } from "util"
import { LevelUpBadge } from "../components/level-up-badge"
import { LevelUpAnimation } from "../components/level-up-animation"
import { BoosterRankings } from "../components/boosters-rankings"

interface Props {
  userId: string
}

const f = (x: number) => {
  return Math.floor((x * x) / 1000);
}

const diff_time = (date?: Date | string | null): number => {
  if (!date) return Infinity;
  const d = date instanceof Date ? date : new Date(date);
  const t = d.getTime();
  if (Number.isNaN(t)) return Infinity; // invalid date string
  return (Date.now() - t) / (1000 * 60 * 60); // hours
};

export const UsersView = ({ userId }: Props) => {
  const [user] = trpc.users.getByUserId.useSuspenseQuery({ userId })
  const [userVideos] = trpc.users.getVideosByUserId.useSuspenseQuery({ userId })
  const [boostPoints] = trpc.xp.getBoostByUserId.useSuspenseQuery({ userId })

  const [currentXp, setCurrentXp] = useState(3250)
  const [showXpPopup, setShowXpPopup] = useState(false)
  const [selectedXpValue, setSelectedXpValue] = useState(100)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [newLevel, setNewLevel] = useState(0)
  const previousLevelRef = useRef<number | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const [activeTab, setActiveTab] = useState("videos")

  console.log(activeTab)

  const channelLevel = Math.floor(Math.floor(Math.sqrt(boostPoints.boostPoints * 1000)) / 1000);

  const xpOnCurrentLevel = f(1000 * (channelLevel))
  const xpForNextLevel = f(1000 * (channelLevel + 1))

  const recentUpgrade = diff_time(user?.newLevelUpgrade) <= 72;

  const utils = trpc.useUtils();
  const updateLevelChange = trpc.xp.updateLevelChange.useMutation({
    onSuccess: () => {
      utils.users.getByUserId.invalidate({userId})
    }
  })

  // Track level changes - only show animation on actual level ups, not initial load
  useEffect(() => {
    if (isInitialLoad) {
      // Set the initial level without showing animation
      previousLevelRef.current = channelLevel
      setIsInitialLoad(false)
      return
    }

    if (previousLevelRef.current !== null && channelLevel > previousLevelRef.current) {
      setNewLevel(channelLevel)
      setShowLevelUp(true)
      updateLevelChange.mutate({ userId })
    }
    previousLevelRef.current = channelLevel
  }, [channelLevel, isInitialLoad])

  //TODO: implement community rankings

  // Calculate XP bar percentage
  const xpPercentage = Math.max(0, Math.min(100, ((boostPoints.boostPoints - xpOnCurrentLevel) / (xpForNextLevel - xpOnCurrentLevel)) * 100))

  // Handle adding XP
  const handleAddXp = () => {
    setCurrentXp(prev => prev + selectedXpValue)
    setShowXpPopup(false)

    // Check for level up (simplified)
    if (currentXp + selectedXpValue >= xpForNextLevel) {
      setNewLevel(channelLevel + 1)
      setShowLevelUp(true)
    }
  }

  const handleLevelUpComplete = () => {
    setShowLevelUp(false)
  }

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
            <div className="flex flex-col items-center md:items-center md:w-1/3 mb-6 md:mb-0">
              <UserAvatar
                size="xl"
                imageUrl={user?.imageUrl || undefined}
                name={user?.name || 'Unknown user'}
                className={`w-40 h-40 border-4 border-border hover:border-primary transition-all duration-300 mb-4 ${showLevelUp ? 'animate-pulse ring-4 ring-yellow-400' : ''
                  }`}
                userId={user.id}
                iconSize='md'
              />

              <div className="text-center md:text-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center justify-center md:justify-center">
                  {user?.name || 'Unknown User'}
                  <span className="ml-2 text-primary">✓</span>
                </h1>

                <div className="flex flex-wrap gap-3 my-4 justify-center md:justify-start">
                  <div className="bg-muted/50 p-3 rounded-lg border border-border text-center min-w-[90px] hover:translate-y-[-5px] transition-transform">
                    <div className="text-primary font-bold text-lg">3</div>
                    <div className="text-muted-foreground text-xs uppercase">Videos</div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg border border-border text-center min-w-[90px] hover:translate-y-[-5px] transition-transform">
                    <div className="text-primary font-bold text-lg">26.9K</div>
                    <div className="text-muted-foreground text-xs uppercase">Followers</div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg border border-border text-center min-w-[90px] hover:translate-y-[-5px] transition-transform">
                    <div className="text-primary font-bold text-lg">10.7M</div>
                    <div className="text-muted-foreground text-xs uppercase">Views</div>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm mt-3">{user.about}</p>
              </div>
            </div>

            {/* XP POP UP */}
            {showXpPopup && <XpCard user={user} setShowAddXpModal={setShowXpPopup} />}

            <div className="md:w-2/3 md:pl-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Channel Boost
                </h2>
                <div className={`text-primary font-bold flex items-center gap-2 ${showLevelUp ? 'animate-bounce' : ''
                  }`}>
                  Level {channelLevel}
                  {showLevelUp && <Sparkles className="w-4 h-4 text-yellow-500 animate-spin" />}
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
                  <span className="font-semibold">Boost progress </span><span>{xpPercentage.toFixed(2)}% </span>
                </div>
                <span>{(xpForNextLevel - boostPoints.boostPoints).toLocaleString()} XP for next level</span>
              </div>

              <Button
                onClick={() => setShowXpPopup(true)}
                className="bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold py-2 px-6 rounded-full hover:opacity-90 transition-all hover:scale-105 active:scale-95"
              >
                <Rocket className="size-4 mr-2" />
                Boost
              </Button>

              <div className="flex justify-between ">

                <div className="mt-6">
                  <h3 className="text-primary font-semibold mb-3">Unlocked Rewards</h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="text-primary mr-2"><Check className="size-4" /></span>
                      <span>Custom Emotes</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-primary mr-2"><Check className="size-4" /></span>
                      <span>Extended Video Upload Quality</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span className="text-primary mr-2"><Lock className="size-4" /></span>
                      <span>Verified</span>
                    </div>
                  </div>
                </div>

                <div>
                  {recentUpgrade && (
                  <LevelUpBadge newLevel={channelLevel}/>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="flex flex-wrap gap-2 my-6 bg-muted/50 p-2 rounded-xl border border-border w-fit">
          {["videos", "community", "about"].map((tab) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6" >
            {userVideos.userVideos.map((video) => (
              <Link key={video.id} className="bg-card border-border overflow-hidden  flex flex-col gap-12 transition-transform cursor-pointer rounded-2xl" href={`/explorer/videos/${video.id}`}>
                <div className="h-56 relative">
                  <VideoThumbnail
                    duration={video.duration || 0}
                    title={video.title}
                    imageUrl={video.thumbnailUrl}
                    previewUrl={video.previewUrl}
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-2 truncate">{video.title} </h3>

                  <div className="flex justify-between text-muted-foreground text-sm mt-2">
                    <span className="flex items-center gap-1"><EyeIcon className="size-4" />{video.videoViews} </span>
                    <span>{compactDate(video.createdAt)}</span>
                  </div>
                </CardContent>
              </Link>
            ))}
          </div>
        )}

        {activeTab === "community" && (
          <BoosterRankings />
        )}
      </div>

      
    </div>
  )
}