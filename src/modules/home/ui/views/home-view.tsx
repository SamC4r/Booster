"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/trpc/client";
import { VideoSection } from "../sections/video-section";
import { motion, AnimatePresence } from "framer-motion";
import { DEFAULT_LIMIT } from "@/constants";
import { VideoGetOneOutput } from "@/modules/videos/types";
import { useRouter } from "next/router";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { ExplorerViewSuspense } from "@/modules/explorer/ui/views/explorer-view";
import { ErrorBoundary } from "react-error-boundary";

export const HomeView = () => {
  return (
    <Suspense fallback={<p>Loading</p>}>
      <ErrorBoundary fallback={<p>Failed to load categories.</p>}>
        <HomeViewSuspense  />
      </ErrorBoundary>
    </Suspense>
  )
}
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

  //prefetch video data for when required
  useEffect(() => {
    const ids = [videos[videoIndex]?.id, videos[videoIndex + 1]?.id].filter(Boolean) as string[];
    ids.forEach((id) => {
      utils.videos.getOne.prefetch({ id })
      utils.xp.getBoostByVideoId.prefetch({videoId:id})
  });
  }, [videoIndex, videos, utils]);


  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setDirection(1);
        if (videoIndex + 1 >= videos.length && !query.isFetchingNextPage) {
          query.fetchNextPage();
        }
        setVideoIndex((i) => Math.min(i + 1, videos.length));
      }
      if (e.key === "ArrowLeft") {
        setDirection(-1);
        setVideoIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden bg-[#f8f9fa] dark:bg-[#212121]">
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden gap-3">
       
        {/* Center content — no scrolling here */}
        <main className="flex-1 p-4 md:p-6 overflow-hidden">
          <div className="flex justify-center mx-auto max-w-full h-[95%]">
            {/* Left navigation button */}
            <div className="hidden md:flex h-full">
              <motion.button
                aria-label="Previous video"
                onClick={() => {
                  setDirection(-1);
                  setVideoIndex((i) => Math.max(0, i - 1));
                }}
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
            </div>

            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={videoIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "tween", duration: 0.12, ease: "easeOut" }}
                className="w-full h-full"
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

            {/* Right navigation button */}
            <div className="hidden md:flex h-full">
              <motion.button
                aria-label="Next video"
                onClick={() => {
                  setDirection(1);
                  if (videoIndex + 1 >= videos.length && !query.isFetchingNextPage) {
                    query.fetchNextPage();
                  }
                  setVideoIndex((i) => Math.min(i + 1, videos.length));
                }}
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
            </div>
          </div>
        </main>
      </div>

      {/* Mobile navigation buttons */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-6 md:hidden z-10 px-4 pointer-events-none">
        <motion.button
          onClick={() => {
            setDirection(-1);

            setVideoIndex((i) => Math.max(0, i - 1));
          }}
          className="
            pointer-events-auto h-14 w-14 rounded-full flex items-center justify-center transition-colors
            bg-[rgba(255,248,230,0.7)]
            border border-[rgba(255,202,85,0.3)]
            text-[#FFA100]
            shadow-[0_10px_30px_rgba(255,161,0,0.15)]
            hover:bg-[rgba(255,202,85,0.2)]
            hover:shadow-[0_12px_35px_rgba(255,161,0,0.2)]
            outline-none focus-visible:ring-4 focus-visible:ring-[rgba(255,202,85,0.35)]
          "
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="h-6 w-6" />
        </motion.button>
        <motion.button
          onClick={() => {
            setDirection(1);
            if (videoIndex + 1 >= videos.length && !query.isFetchingNextPage) {
              query.fetchNextPage();
            }
            setVideoIndex((i) => Math.min(i + 1, videos.length));
          }}
          className="
            pointer-events-auto h-14 w-14 rounded-full flex items-center justify-center transition-colors
            bg-[rgba(255,248,230,0.7)]
            border border-[rgba(255,202,85,0.3)]
            text-[#FFA100]
            shadow-[0_10px_30px_rgba(255,161,0,0.15)]
            hover:bg-[rgba(255,202,85,0.2)]
            hover:shadow-[0_12px_35px_rgba(255,161,0,0.2)]
            outline-none focus-visible:ring-4 focus-visible:ring-[rgba(255,202,85,0.35)]
          "
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight className="h-6 w-6" />
        </motion.button>
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
