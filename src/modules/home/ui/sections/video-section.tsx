'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { compactNumber } from '@/lib/utils';

import { VideoPlayer } from '@/modules/videos/ui/components/video-player';
import { CommentsSection } from '@/modules/videos/ui/sections/comments-section';
import { Eye, Play, Clock, } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
;
import { useAuth } from '@clerk/nextjs';

import { trpc } from '@/trpc/client';
import { VideoReactions } from '@/modules/videos/ui/components/video-reactions';
import { toast } from 'sonner';

import { VideoMenu } from '@/modules/videos/ui/components/video-menu';
import { VideoOwner } from '@/modules/videos/ui/components/video-owner';
import { ErrorBoundary } from 'react-error-boundary';
import { UserAvatar } from '@/components/user-avatar';


interface Props { videoId: string; }


export const VideoSection = ({ videoId }: Props) => {
    return (
        <Suspense fallback={<VideoSectionSkeleton />}>
            <ErrorBoundary fallback={<p>Failed to load video :(</p>}>
                <VideoSectionSuspense videoId={videoId} />
            </ErrorBoundary>
        </Suspense>
    )
}

const VideoSectionSkeleton = () => {
    return (
        <div className="h-full w-full flex flex-col gap-4 overflow-hidden animate-pulse">
            {/* VIDEO AREA SKELETON */}
            <div className="relative group flex-1 rounded-2xl overflow-hidden bg-gray-300 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-sm">
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

export const VideoSectionSuspense = ({ videoId }: Props) => {

    const [video] = trpc.videos.getOne.useSuspenseQuery({ id: videoId })
    const [boostPoints] = trpc.xp.getBoostByVideoId.useSuspenseQuery({ videoId })


    const [commentsOpen, setCommentsOpen] = useState(false);
    const { isSignedIn, } = useAuth();
    const [showTitle, setShowTitle] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const videoPlayerRef = useRef<{ play: () => void; pause: () => void }>(null);

    const utils = trpc.useUtils();


    useEffect(() => {
        const t = setTimeout(() => setShowTitle(false), 4000);
        return () => clearTimeout(t);
    }, []);

    const createView = trpc.videoViews.create.useMutation({
        onSuccess: () => {
            utils.videos.getOne.invalidate({ id: videoId });
        },
    });

    const handlePlay = () => {
        setIsPlaying(true);
        if (!isSignedIn) return;
        createView.mutate({ videoId: video.id });
    };
    const handlePause = () => setIsPlaying(false);

    // When open, comments panel is 40vh (desktop) / 50vh (mobile). When closed, 70px.
    const collapsedPx = 60;

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

    return (
        <div className="h-full w-full flex flex-col gap-2 overflow-hidden">


            {/* VIDEO AREA */}
            <div className="relative group flex-1 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">

                {/* Floating title on pause / first seconds */}
                <AnimatePresence>
                    {(!isPlaying || showTitle) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute top-4 left-4 z-20 hidden sm:block pointer-events-none rounded-lg"
                        >
                            <div className="bg-white/90 dark:bg-[#333333]/90 backdrop-blur-md rounded-xl p-4 max-w-md border border-gray-200 dark:border-gray-700 shadow-md">
                                <h2 className="text-gray-900 dark:text-white font-bold text-lg line-clamp-1">{video.title}</h2>
                                <div className="flex items-center gap-4 mt-2 text-gray-600 dark:text-gray-300 text-sm">

                                    <div className="flex items-center gap-1"><Eye className="w-4 h-4" /><span>{compactNumber(video.videoViews)} views</span></div>
                                    <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{new Date(video.createdAt).toLocaleDateString()}</span></div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Player fills container */}
                <div className="absolute inset-0 ">
                    <VideoPlayer
                        ref={videoPlayerRef}
                        autoPlay={isPlaying}
                        onPlay={handlePlay}
                        onPause={handlePause}
                        playbackId={video.muxPlaybackId}
                        thumbnailUrl={video.thumbnailUrl}
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

                {/* Top row small devices */}
                {(!isPlaying || showTitle) && (
                    <>
                        <div className="absolute top-2 left-2 z-50">
                            <div className='flex items-center gap-2 text-center justify-start'>
                                <UserAvatar imageUrl={video.user.imageUrl} name={video.user.name} userId={video.user.id} />
                                <Eye className="h-4 w-4" /><span className="font-medium">{compactNumber(video.videoViews)}</span>
                            </div>

                        </div>
                        <div className='absolute top-2 right-4 z-50'>
                            <VideoReactions avgRating={video.averageRating} videoRatings={video.videoRatings} onRate={onRate} viewerRating={video.user.viewerRating} small />
                        </div>
                    </>
                )}


                <div className="flex items-start gap-2">

                    <div className="inline-flex items-center gap-2 bg-white dark:bg-[#333333] border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-full text-gray-700 dark:text-gray-300">
                        <Eye className="h-4 w-4" /><span className="font-medium">{compactNumber(video.videoViews)}</span>
                    </div>
                    <VideoReactions avgRating={video.averageRating} videoRatings={video.videoRatings} onRate={onRate} viewerRating={video.user.viewerRating} />
                    <div className='ml-1'>

                        <VideoMenu variant='secondary' videoId={video.id} />
                    </div>
                </div>

            </div>

            {/* TOP ROW Large*/}
            <div className='hidden sm:flex items-start justify-between'>
                <div className="flex flex-col sm:items-start sm:justify-between gap-3 ml-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-gray-700 dark:text-gray-300 text-sm max-w-7xl">
                        <p className='text-2xl font-semibold text-gray-900 dark:text-white line-clamp-1'>{video.title} </p>
                    </div>


                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Channel Info Card */}
                        <VideoOwner user={video.user} videoId={video.id} boostPoints={Number(boostPoints.boostPoints)} />


                        {/* Antiguo video owner descrption */}
                        {/* <div className="flex items-center bg-white dark:bg-[#333333] rounded-2xl px-4 py-3 border border-gray-200 dark:border-gray-700 shadow-sm flex-1">
                            <div className="flex items-center gap-3">
                                <UserAvatar size="lg" imageUrl={video.user.imageUrl} name={video.user.name} className="ring-2 ring-white shadow-sm" />
                                <div className="flex-1">
                                    <div className='flex items-center gap-2'>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{video.user?.name ?? 'Channel Name'}</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{compactNumber(video.user.followsCount)} followers</p>
                                </div>
                                <div className='ml-2'>
                                    {userId === video.user.clerkId ? (
                                        <Button asChild variant="outline" size="sm" className="rounded-full gap-2 p-4 shadow-sm hover:shadow-md border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
                                            <a href={`/studio/videos/${video.id}`}>
                                                <Edit3Icon className="size-4" /><p>Edit</p>
                                            </a>
                                        </Button>
                                    ) : (
                                        <SubButton
                                            onClick={onClick}
                                            disabled={false}
                                            isSubscribed={video.user.viewerIsFollowing}
                                            className="rounded-full p-4 shadow-sm hover:shadow-md transition-all bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                                        />
                                    )}
                                </div>
                            </div>
                        </div> */}

                        {/* XP Progress Card */}

                    </div>
                </div>


                <div className="flex items-start gap-2">

                    <div className="inline-flex items-center gap-2 bg-white dark:bg-[#333333] border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-full text-gray-700 dark:text-gray-300">
                        <Eye className="h-4 w-4" /><span className="font-medium">{compactNumber(video.videoViews)}</span>
                    </div>
                    <VideoReactions avgRating={video.averageRating} videoRatings={video.videoRatings} onRate={onRate} viewerRating={video.user.viewerRating} />
                    <div className='ml-1'>

                        <VideoMenu variant='secondary' videoId={video.id} />
                    </div>
                </div>
            </div>




            {/* COMMENTS PANEL */}
            <motion.div
                className="comments-panel rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#333333] backdrop-blur-md overflow-hidden shadow-sm"
                initial={false}
                animate={{ height: commentsOpen ? '45vh' : collapsedPx }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
                {commentsOpen ? (
                    <style>{`
                        @media (max-width: 768px){
                            .comments-panel{ height: 50vh !important; }
                        }
                    `}</style>
                ) : null}

                <CommentsSection
                    home
                    videoId={video.id}
                    openComments={commentsOpen}
                    onOpenChange={setCommentsOpen}
                />
            </motion.div>
        </div>
    );
};