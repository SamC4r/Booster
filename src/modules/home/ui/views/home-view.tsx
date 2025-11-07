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
            <ErrorBoundary fallback={<p>Failed to load video :(</p>}>
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
            (page) => Object.values(page.items).filter((item) => item)
        );
    }, [data]);

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
                                    {videoIndex < videos.length ? (
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
