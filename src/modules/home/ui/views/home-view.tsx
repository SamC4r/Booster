"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { trpc } from "@/trpc/client";
import { VideoSection } from "../sections/video-section";
import { motion, AnimatePresence } from "framer-motion";
import { DEFAULT_LIMIT } from "@/constants";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { ErrorBoundary } from "react-error-boundary";
import { useSwipeable } from 'react-swipeable';
import { NoVideosEmptyState } from "../components/no-more-videos";

export const HomeView = () => {
    return (
        <Suspense fallback={<HomeViewSkeleton />}>
            <ErrorBoundary 
                fallback={
                    <div className="h-dvh w-full flex flex-col items-center justify-center bg-background p-6">
                        <div className="max-w-md text-center space-y-4">
                            <h2 className="text-2xl font-bold text-red-500">Failed to load videos</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                There was an error loading the video feed. This might be because:
                            </p>
                            <ul className="text-left text-sm text-gray-600 dark:text-gray-400 space-y-2 list-disc pl-6">
                                <li>No videos are available yet</li>
                                <li>All videos are still processing</li>
                                <li>There&apos;s a database connection issue</li>
                            </ul>
                            <button 
                                onClick={() => window.location.reload()} 
                                className="mt-4 px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                }
            >
                <HomeViewSuspense />
            </ErrorBoundary>
        </Suspense>
    )
}

const HomeViewSkeleton = () => {
    return (
        <div className="h-full w-full flex flex-col gap-4 overflow-hidden animate-pulse">
        </div>
    );
};

export const HomeViewSuspense = () => {
    const [data, query] = trpc.home.getMany.useSuspenseInfiniteQuery(
        { limit: DEFAULT_LIMIT },
        { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );

    const videos = useMemo(() => {
        if (!data) return [];
        return data.pages.flatMap(
            (page) => page.items.filter((item) => item)
        );
    }, [data]);

    console.log("HomeViewSuspense - Data:", data);
    console.log("HomeViewSuspense - Videos:", videos);
    console.log("HomeViewSuspense - Videos length:", videos.length);

    const [videoIndex, setVideoIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    const utils = trpc.useUtils();

    // Prefetch video data
    useEffect(() => {
        const ids = [videos[videoIndex]?.id, videos[videoIndex + 1]?.id].filter(Boolean) as string[];
        ids.forEach((id) => {
            utils.videos.getOne.prefetch({ id })
            utils.xp.getBoostByVideoId.prefetch({ videoId: id })
        });
    }, [videoIndex, videos, utils]);

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    const goToNextVideo = useCallback(() => {
        console.log("NEXT")
        setDirection(1);
        if (videoIndex + 1 >= videos.length && !query.isFetchingNextPage) {
            query.fetchNextPage();
        }
        setVideoIndex((i) => Math.min(i + 1, videos.length));
    }, [videoIndex, videos.length, query])

    const goToPrevVideo = useCallback(() => {
        setDirection(-1);
        setVideoIndex((i) => Math.max(0, i - 1));
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") {
                goToNextVideo();
            }
            if (e.key === "ArrowLeft") {
                goToPrevVideo();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [goToNextVideo, goToPrevVideo]);

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
        }),
        center: { x: 0, opacity: 1 },
        exit: (direction: number) => ({
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
        }),
    };

    const handlers = useSwipeable({
        onSwipedLeft: goToNextVideo,
        onSwipedRight: goToPrevVideo,
        trackMouse: true,
        swipeDuration: 500,
        preventScrollOnSwipe: true,
    });

    console.log("VIDEO INDEX", videoIndex, "VIDEOS:", videos)

    // Show empty state if no videos are available
    if (videos.length === 0) {
        return (
            <div className="h-dvh w-full flex flex-col overflow-hidden bg-background">
                <div className="flex-1 flex items-center justify-center">
                    <NoVideosEmptyState />
                </div>
            </div>
        );
    }

    return (
        <div {...handlers} className="h-dvh w-full flex flex-col overflow-hidden bg-background">
            {/* Main content */}
            <div className="flex-1 flex overflow-hidden gap-1">
                <main className="flex-1 mb-6 overflow-hidden">
                    <div className="flex justify-center mx-auto max-w-full h-[95%] relative">

                        {/* Swipeable area - Only ONE video rendered at a time */}
                        <div className="w-full h-full relative" >
                            <AnimatePresence custom={direction} initial={false} mode="wait">
                                <motion.div
                                    key={videoIndex}
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
                                    className="w-full h-full absolute inset-0"
                                >
                                    {videoIndex < videos.length && videos[videoIndex]?.id ? (
                                        <VideoSection videoId={videos[videoIndex].id} next={goToNextVideo} prev={goToPrevVideo} key={videos[videoIndex].id} />
                                    ) : (
                                        <NoVideosEmptyState />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </main>
            </div>

            {/* Mobile navigation buttons */}
            <div className="hidden">
                <InfiniteScroll
                    isManual
                    hasNextPage={query.hasNextPage}
                    isFetchingNextPage={query.isFetchingNextPage}
                    fetchNextPage={query.fetchNextPage}
                />
            </div>
        </div>
    );
};
