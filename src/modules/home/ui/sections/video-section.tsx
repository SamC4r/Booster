'use client';

import { useEffect, useRef, useState } from 'react';
import { compactDate, compactNumber } from '@/lib/utils';
import { VideoGetOneOutput } from '@/modules/videos/types';
import { VideoPlayer } from '@/modules/videos/ui/components/video-player';
import { CommentsSection } from '@/modules/videos/ui/sections/comments-section';
import { Eye, Calendar, ThumbsUp, Share, Download, Save, Play, Clock, Edit3Icon, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFollow } from '@/modules/follows/hooks/follow-hook';
import { SubButton } from '@/modules/subscriptions/ui/components/sub-button';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { trpc } from '@/trpc/client';

type Video = VideoGetOneOutput;

interface Props { video: Video; }

export const VideoSection = ({ video }: Props) => {
    const [commentsOpen, setCommentsOpen] = useState(false);
    const { isSignedIn, userId } = useAuth();
    const [showTitle, setShowTitle] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const videoPlayerRef = useRef<{ play: () => void; pause: () => void }>(null);

    const utils = trpc.useUtils();
    const { onClick } = useFollow({
        userId: video.user.id,
        isFollowing: video.user.viewerIsFollowing,
        fromVideoId: video.id
    });

    useEffect(() => {
        const t = setTimeout(() => setShowTitle(false), 4000);
        return () => clearTimeout(t);
    }, []);

    const createView = trpc.videoViews.create.useMutation({
        onSuccess: () => { utils.videos.getOne.invalidate({ id: video.id }); },
    });

    const handlePlay = () => {
        setIsPlaying(true);
        if (!isSignedIn) return;
        createView.mutate({ videoId: video.id });
    };
    const handlePause = () => setIsPlaying(false);

    // When open, comments panel is 40vh (desktop) / 50vh (mobile). When closed, 70px.
    const collapsedPx = 60;

    return (
        <div className="h-full w-full flex flex-col gap-4 overflow-hidden">
            {/* VIDEO AREA — it shrinks automatically because comments panel changes height */}

            <div className="relative group flex-1 rounded-2xl overflow-hidden bg-black shadow-2xl">
             
                {/* Floating title on pause / first seconds */}
                <AnimatePresence>
                    {(!isPlaying || showTitle) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute top-8 left-4 z-20 hidden sm:block pointer-events-none rounded-lg"
                        >
                            <div className="bg-black/60 backdrop-blur-md rounded-xl p-4 max-w-md">
                                <h2 className="text-white font-bold text-lg line-clamp-1">{video.title}</h2>
                                <div className="flex items-center gap-4 mt-2 text-gray-300 text-sm">
                                    <div className="flex items-center gap-1"><Eye className="w-4 h-4" /><span>{compactNumber(video.videoViews)} views</span></div>
                                    <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{new Date(video.createdAt).toLocaleDateString()}</span></div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Player fills container */}
                <div className="absolute inset-0">
                    <VideoPlayer
                        ref={videoPlayerRef}
                        autoPlay={isPlaying}
                        onPlay={handlePlay}
                        onPause={handlePause}
                        playbackId={video.muxPlaybackId}
                        thumbnailUrl={video.thumbnailUrl}

                    />

                    {/* Big play overlay when paused */}
                    <AnimatePresence>
                        {!isPlaying && (
                            <motion.button
                                type="button"
                                onClick={() => videoPlayerRef.current?.play()}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                className="absolute inset-0 z-20 flex items-center justify-center"
                            >
                                <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                        <Play className="h-8 w-8 text-white fill-white ml-1" />
                                    </div>
                                </div>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* META + BUTTONS */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ml-4">
                <div className="flex flex-wrap items-center gap-2 dark:text-amber-400 text-sm">
                    <div className="inline-flex items-center gap-2 bg-primary  px-3 py-1.5 rounded-full">
                        <Eye className="h-4 w-4" /><span className="font-medium">{compactNumber(video.videoViews)}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-primary  px-3 py-1.5 rounded-full">
                        <Calendar className="h-4 w-4" /><span className="font-medium">{compactDate(video.createdAt)}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-primary  px-3 py-1.5 rounded-full">
                        <ThumbsUp className="h-4 w-4" /><span className="font-medium">{compactNumber(video.averageRating)} avg rating</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button className="px-4 h-10 rounded-full backdrop-blur bg-primary transition inline-flex items-center gap-2 ">
                        <Share className="w-4 h-4" /><span className="text-sm font-medium">Share</span>
                    </button>
                    <button className="px-4 h-10 rounded-full  bg-primary backdrop-blur transition inline-flex items-center gap-2 ">
                        <Download className="w-4 h-4" /><span className="text-sm font-medium">Download</span>
                    </button>
                    <button className="px-4 h-10 rounded-full  shadow-md transition inline-flex items-center gap-2 bg-primary mr-4 hover:opacity-90">
                        <Save className="w-4 h-4" /><span className="text-sm font-medium">Save</span>
                    </button>
                </div>
            </div>

            {/* CHANNEL / FOLLOW */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl px-4">
                <div className="flex items-center gap-4">
                    <UserAvatar size="lg" imageUrl={video.user.imageUrl} name={video.user.name} className="ring-2 ring-white dark:ring-gray-800 shadow-lg" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{video.user?.name ?? 'Channel Name'}</h3>
                        <p className="text-sm text-amber-600 dark:text-amber-400">{compactNumber(video.user.followsCount)} followers</p>
                    </div>
                    <div>
                        {userId === video.user.clerkId ? (
                            <Button asChild variant="secondary" size="sm" className="rounded-full gap-2 p-6 shadow-sm hover:shadow-md">
                                <a href={`/studio/videos/${video.id}`}>
                                    <Edit3Icon className="size-4" /><p>Edit</p>
                                </a>
                            </Button>
                        ) : (
                            <SubButton onClick={onClick} disabled={false} isSubscribed={video.user.viewerIsFollowing} className="rounded-full p-4 shadow-sm hover:shadow-md transition-all" />
                        )}
                    </div>
                </div>
            </div>

            {/* COMMENTS PANEL — HEIGHT ANIMATION LIVES HERE */}
            <motion.div
                className="comments-panel rounded-2xl border  backdrop-blur-md overflow-hidden "
                initial={false}
                animate={{ height: commentsOpen ? '45vh' : collapsedPx }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
                {/* Mobile override (apply only when open) */}
                {commentsOpen ? (
                    <style>{`
            @media (max-width: 768px){
              .comments-panel{ height: 50vh !important; }
            }
          `}</style>
                ) : null}

                <CommentsSection
                    videoId={video.id}
                    openComments={commentsOpen}
                    onOpenChange={setCommentsOpen}
                />
            </motion.div>
        </div>
    );
};
