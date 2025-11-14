'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { cn, compactNumber } from '@/lib/utils';

import { CommentsSection } from '@/modules/videos/ui/sections/comments-section';
import { ChevronLeft, ChevronRight, Eye, Play, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
;
import { useAuth } from '@clerk/nextjs';

import { trpc } from '@/trpc/client';
import { VideoReactions } from '@/modules/videos/ui/components/video-reactions';
import { toast } from 'sonner';

import { VideoMenu } from '@/modules/videos/ui/components/video-menu';
import { VideoOwner } from '@/modules/videos/ui/components/video-owner';
import { UserAvatar } from '@/components/user-avatar';
import { BunnyEmbed } from '@/modules/videos/ui/sections/BunnyEmbed';


interface Props {
    videoId: string;
    next(): void;
    prev(): void;

}


export const VideoSection = ({ videoId, next, prev }: Props) => {
    return (
        <Suspense fallback={<VideoSectionSkeleton />}>
            <VideoSectionSuspense videoId={videoId} next={next} prev={prev} />
        </Suspense>
    )
}

const VideoSectionSkeleton = () => {
    return (
        <div className="h-full w-full flex flex-col gap-4 overflow-hidden animate-pulse">
            {/* VIDEO AREA SKELETON */}
            <div className="relative group flex-1 rounded-2xl overflow-hidden bg-gray-300 dark:bg-gray-700 shadow-sm">
                {/* Play button skeleton */}
                <div className="absolute inset-0 z-20 flex items-center justify-center -m-20">
                    <div className="w-20 h-20 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gray-500 dark:bg-gray-500"></div>
                    </div>
                </div>
            </div>

            {/* TOP ROW SKELETON */}
            <div className='flex items-start justify-between'>
                <div className="flex flex-col sm:items-start sm:justify-between gap-3 ml-2 flex-1">
                    {/* Title skeleton */}
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded-lg w-3/4 max-w-md"></div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Channel Info Card Skeleton */}
                        <div className="flex items-center bg-white dark:bg-[#333333] rounded-2xl px-4 py-3 border border-gray-200 dark:border-gray-700 shadow-sm flex-1">
                            <div className="flex items-center gap-3 w-full">
                                <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                                </div>
                                <div className="w-20 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                            </div>
                        </div>

                        {/* XP Progress Card Skeleton */}
                        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl p-4 border border-amber-500/20 flex items-center gap-3 min-w-48">
                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <div className="w-6 h-6 rounded bg-amber-500/30"></div>
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-amber-500/20 rounded w-20"></div>
                                <div className="h-2 bg-amber-500/20 rounded w-full"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats skeleton */}
                <div className="flex flex-wrap items-start gap-2">
                    <div className="w-20 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="w-24 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full ml-1"></div>
                </div>
            </div>

            {/* COMMENTS PANEL SKELETON */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#333333] overflow-hidden shadow-sm h-[60px]">
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                        </div>
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const VideoSectionSuspense = ({ videoId, next, prev }: Props) => {
    const [video] = trpc.videos.getOne.useSuspenseQuery({ id: videoId })
    const [boostPoints] = trpc.xp.getBoostByVideoId.useSuspenseQuery({ videoId })

    // const [shouldPlay, setShouldPlay] = useState(false);


    // useEffect(() => {
    //     setShouldPlay(true);
    // }, [videoId]);

    const [commentsOpen, setCommentsOpen] = useState(false);
    const { isSignedIn, userId: clerkUserId } = useAuth();
    const [showTitle, setShowTitle] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [hasRewarded, setHasRewarded] = useState(false); // Prevent multiple XP rewards
    const isRewardingRef = useRef(false); // Synchronous flag to prevent race conditions
    const videoPlayerRef = useRef<{ play: () => void; pause: () => void }>(null);

    const utils = trpc.useUtils();

    // Add user data query for XP rewards
    const { data: user } = trpc.users.getByClerkId.useQuery({
        clerkId: clerkUserId,
    });
    const userId = user?.id;

    // Add XP reward mutation for featured videos
    const { mutate: rewardXp } = trpc.xp.rewardXp.useMutation({
        onSuccess: (data) => {
            utils.xp.getXpByUserId.invalidate({ userId });
            // Show success message for XP reward
            toast.success(`🎉 You earned ${data.xpAdded} XP for watching this featured video to the end!`);
        },
        onError: (error) => {
            console.error("Failed to reward XP:", error);
            toast.error("Failed to award XP. Please try again later.");
            setHasRewarded(false); // Reset on error so user can try again
            isRewardingRef.current = false; // Reset ref flag on error
        }
    });

    // Reset reward flag when video changes
    useEffect(() => {
        setHasRewarded(false);
        isRewardingRef.current = false;
    }, [video.id]);

    useEffect(() => {
        const t = setTimeout(() => setShowTitle(false), 4000);
        return () => clearTimeout(t);
    }, []);

    const createView = trpc.videoViews.create.useMutation({
        onSuccess: () => {
            utils.videos.getOne.invalidate({ id: videoId });
        },
    });

    useEffect(() => {
        setIsPlaying(true)
        if (!isSignedIn) return;

        // Create view for all videos
        createView.mutate({ videoId: video.id });
    }, [video.id, isSignedIn])

    const createRating = trpc.videoRatings.create.useMutation({
        onSuccess: () => {
            utils.videos.getOne.invalidate({ id: videoId })
        },
        onError: (error) => {
            if (error.message === "limit") toast.error("Wait a bit before rating again!")
        }
    })

    const onRate = (value: number) => {
        if (!isSignedIn) return false;
        if (!value) return false;

        createRating.mutate({
            videoId: video.id,
            newRating: value
        })
        return true;
    }

    // Handle video end for featured videos - give XP when video is watched to completion
    const handleVideoEnd = useCallback(() => {
        console.log("Video ended for video:", video.id, "isFeatured:", video.isFeatured, "isSignedIn:", isSignedIn, "userId:", userId, "hasRewarded:", hasRewarded, "isRewarding:", isRewardingRef.current);

        // Prevent multiple executions with synchronous flag
        if (hasRewarded || isRewardingRef.current) {
            console.log("XP already rewarded or currently rewarding for this video, skipping");
            return;
        }

        if (video.isFeatured && isSignedIn && userId) {
            console.log("Awarding XP for featured video completion");
            isRewardingRef.current = true; // Set synchronous flag immediately
            setHasRewarded(true); // Set state flag
            rewardXp({
                amount: 20,
                videoId: video.id
            });
        } else {
            console.log("XP not awarded - conditions not met");
        }
    }, [video.isFeatured, video.id, isSignedIn, userId, hasRewarded, rewardXp]);

    return (
        <div className="h-full w-full flex flex-col overflow-hidden">
            {/* FIXED VIDEO PLAYER */}
            <motion.div
                className={cn("flex-none relative rounded-2xl overflow-hidden shadow-sm min-h-[50%]")}
                initial={false}
                animate={{ height: commentsOpen ? '62%' : '82%' }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                onMouseEnter={() => setShowTitle(true)}
                onMouseLeave={() => setShowTitle(false)}
            >

                {/* Your existing video player content */}
                <AnimatePresence>
                    {(!isPlaying || showTitle) && (
                        <>
                            {/* Mobile Overlay */}
                            <div className='sm:hidden block'>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    className='absolute bottom-20 left-4 z-30 sm:max-w-[50%] max-w-[90%] truncate'
                                >
                                    <span className='text-md'>{video.title} </span>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    className="absolute top-6 left-6 z-30"
                                >
                                    <div className='flex items-center gap-2 text-center justify-start'>
                                        <UserAvatar imageUrl={video.user.imageUrl} name={video.user.name} userId={video.user.id} />
                                        <Eye className="h-4 w-4" /><span className="font-medium">{compactNumber(video.videoViews)}</span>
                                        {video.isFeatured && (
                                            <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 px-2 py-1 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm animate-pulse">
                                                <Coins className="h-3 w-3" />
                                                <span>+20 XP</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 1, ease: 'easeInOut', delay: 0.2 }}
                                    className='absolute top-6 right-8 z-30'
                                >
                                    <VideoReactions avgRating={video.averageRating} videoRatings={video.videoRatings} onRate={onRate} viewerRating={video.user.viewerRating} small />
                                </motion.div>
                            </div>

                            <>
                                <motion.div
                                    className="hidden sm:absolute sm:block sm:left-8 sm:top-1/2 sm:-translate-y-1/2 z-40"
                                    onClick={prev}
                                >

                                    <div className="bg-transparent rounded-full p-4 hover:cursor-pointer hover:scale-105 dark:hover:bg-white/30 hover:bg-white/20 transition-all duration-200 ease-in-out">
                                        <ChevronLeft className="h-8 w-8 text-white dark:text-white" />
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="hidden sm:block sm:absolute right-8 top-1/2 -translate-y-1/2 z-40"
                                    onClick={next}
                                >
                                    <div className="bg-transparent rounded-full p-4 hover:cursor-pointer hover:scale-105 dark:hover:bg-white/30 hover:bg-white/20 transition-all duration-200 ease-in-out">
                                        <ChevronRight className="h-8 w-8 text-white dark:text-white" />
                                    </div>
                                </motion.div>
                            </>

                        </>
                    )}
                </AnimatePresence>

                {/* Player fills container */}
                <div className="absolute inset-0"
                >


                    {/* <Player src={video.playbackUrl} autoPlay={shouldPlay} isAI={video.isAi} /> */}
                    <BunnyEmbed
                        libraryId={video.bunnyLibraryId}
                        videoId={video.bunnyVideoId}
                        autoplay
                        onVideoEnd={video.isFeatured ? handleVideoEnd : undefined}
                    />

                    {/* Play button overlay */}
                    <AnimatePresence>
                        {!isPlaying && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="hidden sm:absolute inset-0 z-20 sm:flex items-center justify-center -m-20 pointer-events-none group"
                            >
                                <div
                                    className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform duration-300 pointer-events-auto cursor-pointer hover:bg-black/60 "
                                    onClick={() => videoPlayerRef.current?.play()}
                                >
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                        <Play className="h-8 w-8 text-white fill-white ml-1" />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* SCROLLABLE CONTENT AREA */}
            <div className="w-full flex-1 overflow-y-auto scrollbar-default">
                {/* TOP ROW Large*/}
                <div className='w-full hidden sm:flex items-start justify-between mb-1'>
                    <div className="w-full flex flex-col sm:items-start sm:justify-between mb-2 flex-shrink min-w-0">
                        {/* Desktop Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                            className="min-w-0 max-w-[80%]"
                        >
                            <p className='text-xl font-semibold text-gray-900 dark:text-white truncate m-1 mt-2'>
                                {video.title}
                            </p>
                        </motion.div>
                        <VideoOwner user={video.user} videoId={video.id} boostPoints={Number(boostPoints.boostPoints)} />
                    </div>

                    <div className="flex items-start gap-5 mt-3 mr-5 flex-shrink-0">
                        <div className="inline-flex items-center gap-2 bg-white dark:bg-[#333333] border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-full text-gray-700 dark:text-gray-300 flex-shrink-0">
                            <Eye className="h-4 w-4" /><span className="font-medium">{compactNumber(video.videoViews)}</span>
                        </div>
                        {video.isFeatured && (
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm animate-pulse flex-shrink-0">
                                <Coins className="h-4 w-4" />
                                <span>Sponsored, Watch for 20 XP</span>
                            </div>
                        )}
                        <VideoReactions avgRating={video.averageRating} videoRatings={video.videoRatings} onRate={onRate} viewerRating={video.user.viewerRating} small />
                        <div className='ml-1 flex-shrink-0'>
                            <VideoMenu variant='secondary' videoId={video.id} />
                        </div>
                    </div>
                </div>

                {/* COMMENTS PANEL */}
                <motion.div
                    className={cn("flex-1 min-h-0 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#212121] backdrop-blur-md shadow-sm mt-[14px]")}
                    initial={false}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    onMouseEnter={() => setCommentsOpen(true)}
                    onMouseLeave={() => setCommentsOpen(false)}
                >
                    <CommentsSection
                        home
                        videoId={video.id}
                        openComments={commentsOpen}
                        onOpenChange={setCommentsOpen}
                    />
                </motion.div>
            </div>
        </div >
    );
};
