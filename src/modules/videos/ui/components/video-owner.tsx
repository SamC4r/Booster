'use client'
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { SubButton } from "@/modules/subscriptions/ui/components/sub-button";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { UserInfo } from "@/modules/users/ui/components/user-info";
import { UsersIcon, Edit3Icon, ZapIcon, RocketIcon, TrendingUpIcon } from "lucide-react";
import { useState } from "react";
import { useFollow } from "@/modules/follows/hooks/follow-hook";
import { cn } from "@/lib/utils";
import { XpCard } from "@/modules/home/ui/components/xp-card";
import { AnimatePresence } from "framer-motion";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { getUserIcons } from "@/modules/market/components/assetIcons/functions/get-user-icons";
import { useRouter } from "next/navigation";

type User = {
    followsCount: number;
    viewerIsFollowing: boolean;
    id: string;
    clerkId: string;
    name: string;
    imageUrl: string;
    createdAt: Date;
    updatedAt: Date;
    about: string | null;
    xp: number | null;
    boostPoints: number | null;
    newLevelUpgrade: Date | null;
}



interface Props {
    user: User,
    videoId: string;
    boostPoints: number;
    className?: string;
}

const f = (x: number) => {
    return Math.floor((x * x) / 1000);
};


export const VideoOwner = ({ user, videoId, boostPoints, className }: Props) => {
    const { userId } = useAuth();
    const router = useRouter();
    const [showAddXpModal, setShowAddXpModal] = useState(false);

    //WHERE IS THE PREFETCH? -- TODO: getBoostByVideoId -> userId -> boost points
    // const [boostPoints] = trpc.xp.getBoostByUserId.useSuspenseQuery({userId:user.id})

    // Check if the current user is the video owner
    const isVideoOwner = userId === user.clerkId;

    const channelLevel = Math.floor(
        Math.floor(Math.sqrt(boostPoints * 1000)) / 1000
    );

    const xpOnCurrentLevel = f(1000 * channelLevel);
    const xpForNextLevel = f(1000 * (channelLevel + 1));


    const progressPercentage = Math.max(0, Math.min(100, ((boostPoints - xpOnCurrentLevel) / (xpForNextLevel - xpOnCurrentLevel)) * 100)
    );

    const handleRankingClick = () => {
        // Navigate to the user's channel with community tab (which shows rankings)
        router.push(`/users/${user.id}#community`);
    };

    const { onClick, isPending } = useFollow({
        //ignore xd?
        userId: user.id,
        isFollowing: user.viewerIsFollowing,
        fromVideoId: videoId
    })


    return (
        <div className={cn("flex items-center gap-2 w-full", className)}>
            <div className="flex flex-col pt-2 pr-2 pl-2 bg-card rounded-xl sm:rounded-2xl border border-border shadow-sm w-auto">                {/* Add XP Modal */}
                <AnimatePresence>
                    {showAddXpModal && (
                        <XpCard user={user} setShowAddXpModal={setShowAddXpModal} videoId={videoId} />
                    )}
                </AnimatePresence>
                {/* Top Section - User Info */}
                <div className="flex flex-col sm:flex-row items-end justify-between mb-2">
                    <div className="flex flex-col sm:flex-row items-start gap-2 min-w-0">
                        <div className="flex items-start w-full sm:w-auto">
                            <UserAvatar
                                size="lg"
                                imageUrl={user.imageUrl}
                                name={user.name}
                                className="ring-2 ring-background shadow-lg"
                                userId={user.id}
                                badgeSize={7}
                            />
                        </div>

                        <div className="flex flex-col flex-grow min-w-0 w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                    <UserInfo
                                        size="lg"
                                        name={(() => {
                                            const cleanName = user.name?.replace(/\s*null\s*$/i, "") || "";
                                            return cleanName.length > 16 ? `${cleanName.substring(0, 16)}...` : cleanName;
                                        })()}
                                        className="font-semibold text-foreground text-base sm:text-lg"
                                        userId={user.id}
                                    />
                                    {getUserIcons(user.id, 5)}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 flex-wrap">
                                <div className="flex items-center gap-1.5 bg-muted text-muted-foreground py-1 rounded-full">
                                    <UsersIcon className="size-3 sm:size-4 text-purple-500 dark:text-purple-400" />
                                    <span className="font-medium text-xs sm:text-sm">{user.followsCount} </span>
                                </div>
                            </div>


                        </div>
                    </div>
                    {/* Edit/Subscribe Button for desktop */}
                    <div className="hidden lg:flex sm:flex-col">
                        {userId === user.clerkId ? (
                            <Button
                                className="rounded-full gap-2 shadow-sm hover:shadow-md transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
                            <>
                                {isPending ? (
                                    <Button
                                        className="rounded-full flex justify-center text-center p-4 shadow-sm hover:shadow-md transition-all bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                                    >
                                        <Spinner variant="circle" />
                                    </Button>
                                ) :
                                    <SubButton
                                        onClick={onClick}
                                        disabled={isPending}
                                        isSubscribed={user.viewerIsFollowing}
                                        className="rounded-full p-4 shadow-sm hover:shadow-md transition-all bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                                    />}
                            </>
                        )}
                    </div>

                </div>



            </div>
            <div className="bg-gradient-to-r from-amber-400/10 to-orange-500/10 dark:from-amber-400/5 dark:to-orange-500/5 rounded-2xl pt-2 pr-2 pl-2  border border-amber-200 dark:border-amber-800/50 shadow-sm hidden sm:block sm:flex-1">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-1 rounded-lg">
                            <ZapIcon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Level {channelLevel}</span>
                    </div>

                    {isVideoOwner ? (
                        <button
                            onClick={handleRankingClick}
                            className="flex items-center gap-1 text-xs bg-gradient-to-r from-[#ffca55] to-[#ffa100] hover:from-[#f5c042] hover:to-[#e89600] text-white py-1 px-2 rounded-lg transition-colors"
                        >
                            <TrendingUpIcon className="w-3 h-3" />
                            <span>Ranking</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowAddXpModal(true)}
                            className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-600 text-white py-1 px-2 rounded-lg transition-colors"
                        >
                            <RocketIcon className="w-3 h-3" />
                            <span>Boost</span>
                        </button>
                    )}
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
                        {progressPercentage.toFixed(1)}%
                    </p>
                </div>
            </div>
        </div >
    );
};
