"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { trpc } from "@/trpc/client";
import { VideoSection } from "../sections/video-section";
import { motion, AnimatePresence } from "framer-motion";
import { DEFAULT_LIMIT } from "@/constants";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { ErrorBoundary } from "react-error-boundary";
import { useSwipeable } from 'react-swipeable';

export const HomeView = () => {
  return (
    <Suspense fallback={<VideoSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Failed to load video :(</p>}>
        <HomeViewSuspense />
      </ErrorBoundary>
    </Suspense>
  )
}

const VideoSectionSkeleton = () => {
  // ... keep your existing skeleton code
  return (
    <div className="h-full w-full flex flex-col gap-4 overflow-hidden animate-pulse">
      {/* Your existing skeleton code */}
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

  // Swipe state
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const minSwipeDistance = 50;

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

  // Simple swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNextVideo();
    }

    if (isRightSwipe) {
      goToPrevVideo();
    }
  }

  const goToNextVideo = () => {
    console.log("NEXT")
    setDirection(1);
    if (videoIndex + 1 >= videos.length && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
    setVideoIndex((i) => Math.min(i + 1, videos.length));
  }

  const goToPrevVideo = () => {
    setDirection(-1);
    setVideoIndex((i) => Math.max(0, i - 1));
  }

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
  }, [videoIndex, videos.length, query]);

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
  return (
    <div {...handlers} className="h-dvh w-full flex flex-col overflow-hidden bg-[#f8f9fa] dark:bg-[#212121]" >
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden gap-1">
        <main className="flex-1 mb-6 overflow-hidden">
          <div className="flex justify-center mx-auto max-w-full h-[95%]">

            {/* Left navigation button */}
            {/* <div className="hidden md:flex h-full">
              <motion.button
                aria-label="Previous video"
                onClick={goToPrevVideo}
                className="
                  w-20 rounded-2xl mr-4 flex items-center justify-center transition-all
                  border border-[rgba(255,202,85,0.3)]
                  text-[#FFA100]
                  shadow-[0_10px_30px_rgba(255,161,0,0.15)]
                  hover:bg-[#ffffdf45]
                  dark:hover:bg-[rgb(53,53,53)]
                  hover:shadow-[0_12px_35px_rgba(255,161,0,0.2)]
                  backdrop-blur-md
                  outline-none focus-visible:ring-4 focus-visible:ring-[rgba(255,202,85,0.35)]
                "
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ChevronLeft className="h-10 w-10" />
              </motion.button>
            </div> */}

            {/* Swipeable area - Only ONE video rendered at a time */}
            <div
              className="w-full h-full relative touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: 'pan-y' }}
            >
              <AnimatePresence custom={direction} mode="wait" initial={false}>
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
                    <VideoSection videoId={videos[videoIndex].id} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="text-gray-600 dark:text-gray-300">
                        No more videos
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

             
            </div>

            {/* Right navigation button */}
            {/* <div className="hidden md:flex h-full">
              <motion.button
                aria-label="Next video"
                onClick={goToNextVideo}
                className="
                  w-20 rounded-2xl ml-4 flex items-center justify-center transition-all
                  border border-[rgba(255,202,85,0.3)]
                  text-[#FFA100]
                  shadow-[0_10px_30px_rgba(255,161,0,0.15)]
                  hover:bg-[#ffffdf45]
                  dark:hover:bg-[rgb(53,53,53)]
                  hover:shadow-[0_12px_35px_rgba(255,161,0,0.2)]
                  backdrop-blur-md
                  outline-none focus-visible:ring-4 focus-visible:ring-[rgba(255,202,85,0.35)]
                "
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ChevronRight className="h-10 w-10" />
              </motion.button>
            </div> */}
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