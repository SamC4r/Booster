'use client'

import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { Suspense, useState, useRef, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { VideoBanner } from "../components/video-banner";
import { VideoTopRow } from "../components/video-top-row";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Eye, Clock, Loader2 } from "lucide-react";
import { BunnyEmbed } from "./BunnyEmbed";
// import Player from "./Player";

interface VideoSectionProps {
    videoId: string;
}

export const VideoSection = ({ videoId }: VideoSectionProps) => {
    return (
        <Suspense fallback={<VideoSectionSkeleton />}>
            <ErrorBoundary fallback={<VideoErrorFallback />}>
                <VideoSectionSuspense videoId={videoId} />
            </ErrorBoundary>
        </Suspense>
    )
}

const VideoSectionSkeleton = () => {
    return (
        <div className="relative aspect-video rounded-3xl overflow-hidden bg-muted">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent animate-shimmer" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                    <p className="text-muted-foreground font-medium">Loading your video...</p>
                </div>
            </div>
        </div>
    )
}

const VideoErrorFallback = () => {
    return (
        <div className="relative aspect-video rounded-3xl overflow-hidden bg-destructive/10 backdrop-blur-md border border-destructive/30">
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">Video Unavailable</h3>
                <p className="text-muted-foreground">We&aposre having trouble loading this video. Please try again later.</p>
                <button className="px-6 py-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-full text-white font-medium hover:shadow-lg transition-all">
                    Retry
                </button>
            </div>
        </div>
    )
}

const VideoSectionSuspense = ({ videoId }: VideoSectionProps) => {
    const [video] = trpc.videos.getOne.useSuspenseQuery({ id: videoId });

   
    
    // console.log("BOOST AAAA",boostPoints.boostPoints)

    const [isPlaying, setIsPlaying] = useState(true)

    const videoPlayerRef = useRef<{ play: () => void; pause: () => void }>(null);

    const { isSignedIn, } = useAuth();
    const utils = trpc.useUtils();
    const createView = trpc.videoViews.create.useMutation({
        onSuccess: () => {
            utils.videos.getOne.invalidate({ id: videoId }) //invalidate cache and get new updated views value
        },
    });

    // const [shouldPlay, setShouldPlay] = useState(false);

    // useEffect(() => {
    //     setShouldPlay(true);
    // }, []);



    // const followingList = []

    useEffect(() => {
        setIsPlaying(true)
        if (!isSignedIn) return;
        createView.mutate({ videoId })
    }, [videoId, isSignedIn]); // Removed createView to prevent infinite loop

    const handlePlayButtonClick = () => {
        videoPlayerRef.current?.play()
    }

    return (
        <div className="xl:sticky xl:top-4 xl:self-start xl:h-fit xl:z-20 ">
            {/* Video section background glow */}
            {/* TODO: Premium feature: video background glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/10  to-amber-500/10 rounded-xl  blur-xl opacity-0 " />

            <div className={cn(
                "relative aspect-video rounded-xl overflow-hidden  backdrop-blur-md",
                video.status !== "completed" && "rounded-b-none",
            )}
            >
                {/* Glassmorphism overlay */}
                {/* <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" /> */}

                {/* Status indicator */}
                {video.status !== "completed" && (

                    <div className="absolute top-4 right-4 z-20">
                        <div className="px-3 py-1.5 bg-black/70 backdrop-blur-md rounded-full flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                            <span className="text-xs text-amber-200 font-medium">Processing</span>
                        </div>
                    </div>
                )}

                {/* Video info overlay */}
                <AnimatePresence>
                    {!isPlaying && (
                        //hidden always wins. To show it -> sm:block block opposite of hidden
                        <div className="hidden sm:block sm:absolute sm:top-4 sm:left-4 z-20 sm:pointer-events-auto">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-black/40 backdrop-blur-md rounded-full p-3"
                                exit={{ opacity: 0, scale: 0.8 }}
                            >
                                <h2 className="text-white font-semibold text-lg line-clamp-1">{video.title}</h2>
                                <div className="flex items-center gap-4 mt-2 text-gray-300 text-sm">
                                    <div className="flex items-center gap-1">
                                        <Eye className="w-4 h-4" />
                                        <span>{video.videoViews} views</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>)}
                </AnimatePresence>

                {/* Video layer */}
                <div className="relative z-10 w-full h-full overflow-hidden rounded-3xl">
                    {/* <VideoPlayer
                        ref={videoPlayerRef}
                        autoPlay={isPlaying}
                        onPause={handlePause}
                        onPlay={handlePlay}
                        playbackId={video.muxPlaybackId}
                        thumbnailUrl={video.thumbnailUrl}
                    /> */}
                     <BunnyEmbed libraryId={video.bunnyLibraryId} videoId={video.bunnyVideoId} /> 
                    {/*<Player src={video.playbackUrl} autoPlay={shouldPlay} isAI={video.isAi} />*/}
                </div>

                {/* Play button overlay */}
                <AnimatePresence>
                    {!isPlaying && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 z-20 flex items-center justify-center -m-20 pointer-events-none group"
                        >
                            <div
                                className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300 pointer-events-auto cursor-pointer hover:bg-black/60 "
                                onClick={handlePlayButtonClick}
                            >
                                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                    <Play className="h-8 w-8 text-white fill-white ml-1" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <VideoBanner status={video.status || "processing"} />
            <VideoTopRow video={video} />
           
        </div>
    )
}
