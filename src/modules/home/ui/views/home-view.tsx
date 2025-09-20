'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { VideoSection } from '../sections/video-section';
import { motion, AnimatePresence } from 'framer-motion';

export const HomeView = () => {
  const [video] = trpc.home.getOne.useSuspenseQuery({
    id: 'e4a0a1cd-4737-4c5d-9986-4d46f75067dd',
  });

  const [videoIndex, setVideoIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // HARD lock body scroll while this page is mounted
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setDirection(1);
        setVideoIndex((i) => i + 1);
      }
      if (e.key === 'ArrowLeft') {
        setDirection(-1);
        setVideoIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!video) return null;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden gap-3">


        {/* Center content — no scrolling here */}
        <main className="flex-1 p-4 md:p-6 overflow-hidden">
          <div className="flex justify-center mx-auto max-w-full h-[95%]">
            {/* Left navigation button (matches home.html style) */}
            <div className="hidden md:flex h-full">
              <motion.button
                aria-label="Previous video"
                onClick={() => {
                  setDirection(-1);
                  setVideoIndex((i) => Math.max(0, i - 1));
                }}
                className=" w-20 rounded-2xl bg-primary/20 m-4  shadow-lg backdrop-blur-md flex items-center justify-center
               transition-all"
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
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full h-full"
              >
                <VideoSection video={video} />
              </motion.div>
            </AnimatePresence>
             <div className="hidden md:flex h-full">
              <motion.button
                aria-label="Previous video"
                onClick={() => {
                  setDirection(-1);
                  setVideoIndex((i) => Math.max(0, i - 1));
                }}
                className=" w-20 rounded-2xl bg-primary/20 m-4  shadow-lg backdrop-blur-md flex items-center justify-center
               transition-all"
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
          className="pointer-events-auto h-14 w-14 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-amber-200 dark:border-gray-600 flex items-center justify-center text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="h-6 w-6" />
        </motion.button>
        <motion.button
          onClick={() => {
            setDirection(1);
            setVideoIndex((i) => i + 1);
          }}
          className="pointer-events-auto h-14 w-14 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-amber-200 dark:border-gray-600 flex items-center justify-center text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight className="h-6 w-6" />
        </motion.button>
      </div>
    </div>
  );
};
