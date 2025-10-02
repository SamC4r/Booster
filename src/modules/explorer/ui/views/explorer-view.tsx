'use client'
import { motion, AnimatePresence } from "framer-motion";
import { CategoriesSection } from "../sections/categories-section";
import { Play, Eye, Sparkles, ArrowRight, Share2, Calendar, StarIcon, Calendar1, Zap, TrendingUp,  Clock, RocketIcon, Trophy } from "lucide-react";
import { useState, useMemo, Suspense } from "react";
import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { compactDate } from "@/lib/utils";
import { VideoThumbnail } from "@/modules/videos/ui/components/video-thumbnail";
import { UserAvatar } from "@/components/user-avatar";
import { InfiniteScroll } from "@/components/infinite-scroll";
import Link from "next/link";
import { ErrorBoundary } from "react-error-boundary";

interface HomeViewProps {
  categoryId?: string;
}

export const ExplorerView = ({ categoryId }: HomeViewProps) => {
  return (
    <Suspense fallback={<ExplorerSkeleton />}>
      <ErrorBoundary fallback={<p>Failed to load categories.</p>}>
        <ExplorerViewSuspense categoryId={categoryId} />
      </ErrorBoundary>
    </Suspense>
  )
}

const ExplorerSkeleton = () => {
  return (
    <div className="overflow-hidden mb-10 px-4 pt-2.5 flex flex-col gap-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 bg-gray-200 dark:bg-gray-800 px-6 py-3 rounded-full mb-6 mx-auto w-48 h-10"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-lg mb-4 max-w-2xl mx-auto"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-lg max-w-xl mx-auto"></div>
      </div>

      {/* Categories Skeleton */}
      <div className="flex gap-4 justify-center mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-24 h-10 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
        ))}
      </div>

      {/* Featured Video Skeleton */}
      <div className="relative bg-gray-200 dark:bg-gray-800 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-3 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            <div className="w-48 h-8 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
          </div>
          <div className="w-24 h-6 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="aspect-video bg-gray-300 dark:bg-gray-700 rounded-2xl"></div>
          </div>
          <div className="space-y-6">
            <div className="w-64 h-8 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                  <div className="w-48 h-4 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 pt-4">
              <div className="flex-1 h-12 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid Skeleton */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-2 h-12 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            <div>
              <div className="w-48 h-8 bg-gray-200 dark:bg-gray-800 rounded-lg mb-2"></div>
              <div className="w-32 h-4 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
            </div>
          </div>
          <div className="w-24 h-12 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {[...Array(9)].map((_, index) => (
            <div key={index} className="group cursor-pointer relative">
              <div className="relative bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-300 dark:border-gray-700">
                <div className="relative aspect-video overflow-hidden bg-gray-300 dark:bg-gray-700"></div>
                <div className="p-4">
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-lg mb-3"></div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="w-24 h-4 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm ml-1">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-4 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                    <div className="w-12 h-4 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ExplorerViewSuspense = ({ categoryId }: HomeViewProps) => {
  const [selectedCategory] = useState(categoryId || "all");

  const [data, query] = trpc.explorer.getMany.useSuspenseInfiniteQuery(
    { limit: DEFAULT_LIMIT * 2 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const videos = useMemo(() => data ? data.pages.flatMap(p => p.items) : [], [data]);
  const featuredVideo = videos.find(v => v.isFeatured);


  console.log("V",videos)


  return (
    <div className="overflow-hidden mb-10 px-4 pt-2.5 flex flex-col gap-y-12">
      {/* Enhanced Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative text-center mb-8"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              rotate: -360,
              scale: [1.2, 1, 1.2]
            }}
            transition={{
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              scale: { duration: 6, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-6 py-3 rounded-2xl border border-amber-200/50 dark:border-amber-800/50 mb-6"
          >
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              Discover New Content
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-gray-900 via-amber-600 to-orange-600 dark:from-white dark:via-amber-400 dark:to-orange-400 bg-clip-text text-transparent mt-5 pt-5 leading-tight"
          >
            Explorer
          </motion.h1>
        </div>
      </motion.div>

      {/* Enhanced Categories Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent blur-xl transform scale-110" />
        <div className="relative z-10">
          <CategoriesSection categoryId={selectedCategory ?? "all"} />
        </div>
      </motion.div>

      {/* Enhanced Featured Video Section */}
      {featuredVideo && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="relative group"
        >
          {/* Animated Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-pink-500/10 rounded-3xl blur-2xl transform scale-105 group-hover:scale-110 transition-transform duration-500" />

          {/* Floating Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -20, 0],
                  x: [0, 10, 0],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  delay: i * 0.5
                }}
                className="absolute w-2 h-2 bg-amber-400 rounded-full"
                style={{
                  left: `${20 + i * 30}%`,
                  top: `${10 + i * 10}%`
                }}
              />
            ))}
          </div>

          <div className="relative bg-gradient-to-br from-white to-amber-50 dark:from-gray-900 dark:to-amber-950 rounded-3xl p-8 border border-amber-200 dark:border-amber-800 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-3 h-10 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full shadow-lg"
                  />
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Today</h2>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-semibold">Editor&apos;s Pick</span>
                </motion.div>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 px-4 py-2 rounded-full backdrop-blur-sm">
                <Calendar className="w-4 h-4" />
                <span>Just added</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Enhanced Video Card */}
              <Link href={`/explorer/videos/${featuredVideo.id}`}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative group/card cursor-pointer"
                >
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-transparent group-hover/card:border-amber-300 dark:group-hover/card:border-amber-600 transition-all duration-300">
                    <VideoThumbnail
                      duration={featuredVideo.duration || 0}
                      title={featuredVideo.title}
                      imageUrl={featuredVideo.thumbnailUrl}
                      previewUrl={featuredVideo.previewUrl}
                    />

                    {/* Enhanced Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Enhanced Content Overlay */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-2xl font-bold text-white line-clamp-2 pr-4 flex-1 leading-tight">
                            {featuredVideo.title}
                          </h3>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg"
                          >
                            Featured
                          </motion.div>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                          <UserAvatar
                            size="lg"
                            imageUrl={featuredVideo.user?.imageUrl || "/public-user.png"}
                            name={featuredVideo.user?.name || "Anonymous"}
                            userId={featuredVideo.user?.id}
                          />
                          <div>
                            <p className="text-white font-medium text-lg">{featuredVideo.user?.name}</p>
                            <div className="flex items-center gap-4 text-white/80 text-sm mt-1">
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                <span>{formatCompactNumber(Number(featuredVideo.videoViews) || 0)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <StarIcon className="w-4 h-4 text-yellow-300" />
                                <span>{Number(featuredVideo.averageRating).toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Play Button Overlay */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileHover={{ opacity: 1, y: 0 }}
                        className="flex justify-center"
                      >
                        <div className="bg-white/20 backdrop-blur-md rounded-full p-4 border border-white/30">
                          <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </Link>

              {/* Enhanced Features List */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                  Why You&apos;ll Love This
                </h3>
                <ul className="space-y-4">
                  {[
                    { icon: Zap, text: "High engagement content", color: "text-yellow-500" },
                    { icon: TrendingUp, text: "Trending in community", color: "text-green-500" },
                    { icon: StarIcon, text: "Exceptional viewer ratings", color: "text-amber-500" },
                    { icon: Clock, text: "Perfect duration for maximum impact", color: "text-blue-500" }
                  ].map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="flex items-center gap-4 text-gray-700 dark:text-gray-300 group/feature"
                    >
                      <div className="relative">
                        <div className={`w-10 h-10 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl flex items-center justify-center border border-amber-200/50 dark:border-amber-800/50 group-hover/feature:scale-110 transition-transform`}>
                          <feature.icon className={`w-5 h-5 ${feature.color}`} />
                        </div>
                      </div>
                      <span className="text-lg font-medium">{feature.text}</span>
                    </motion.li>
                  ))}
                </ul>

                <div className="flex gap-4 pt-4">
                  <Link href={`/explorer/videos/${featuredVideo.id}`}>
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white p-4 rounded-xl font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-amber-500/25 transition-all duration-300"
                    >
                      <Play className="w-5 h-5" />
                      Watch Featured Video
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </Link>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-300"
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced Video Grid Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.7 }}
        className="relative"
      >
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-12 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full shadow-lg"
            />
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {selectedCategory === "all" ? "Trending Videos" : `${selectedCategory} Videos`}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Curated selection of top-performing content
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ x: 5, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-amber-500/25 transition-all duration-300 group"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

        {/* Enhanced Video Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
          >
            {videos.filter(v => !v.isFeatured).map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group cursor-pointer relative"
              >
                <Link href={`/explorer/videos/${video.id}`}>
                  {/* Enhanced Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-105 -z-10" />

                  <div className="relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 group-hover:border-amber-300 dark:group-hover:border-amber-600 transition-all duration-300">
                    {/* Video Thumbnail */}
                    <div className="relative aspect-video overflow-hidden">
                      <VideoThumbnail
                        duration={video.duration || 0}
                        title={video.title}
                        imageUrl={video.thumbnailUrl}
                        previewUrl={video.previewUrl}
                      />

                      {/* Enhanced Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Enhanced Video Info Overlay */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                        {video.categoryId && (
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-lg backdrop-blur-sm"
                          >
                            {video.categoryId}
                          </motion.div>
                        )}

                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ opacity: 1, scale: 1 }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          <div className="bg-black/80 text-white px-3 py-1 rounded-lg text-xs font-medium backdrop-blur-sm flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            Watch
                          </div>
                        </motion.div>
                      </div>

                      {/* Enhanced Stats Overlay */}
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center gap-3 text-white text-sm">
                          <div className="flex items-center gap-1 backdrop-blur-sm bg-black/30 px-2 py-1 rounded-lg">
                            <Eye className="w-3 h-3" />
                            <span>{formatCompactNumber(Number(video.videoViews) || 0)}</span>
                          </div>
                          <div className="flex items-center gap-1 backdrop-blur-sm bg-black/30 px-2 py-1 rounded-lg">
                            <StarIcon className="w-3 h-3 text-yellow-300" />
                            <span>{Number(video.averageRating).toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-3 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-tight">
                        {video.title || "Untitled"}
                      </h3>

                      {/* Enhanced Creator Info */}
                      <div className="flex items-center gap-3 mb-3">
                        <UserAvatar
                          size="md"
                          imageUrl={video.user?.imageUrl || "/public-user.png"}
                          name={video.user?.name || "Anonymous"}
                          userId={video.user?.id}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {video.user?.name?.replace(/\s*null\s*$/i, "") || "Anonymous"}
                          </p>
                          {video.user?.name === "sammas24 null" ? (
                            <p className="flex items-center gap-2 text-orange-500 text-xs">
                              Founder & Developer <RocketIcon className="size-3" />
                            </p>
                          ) : (
                            <p className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                              Top Content Creator <Trophy className="size-3" />

                            </p>
                          )}
                        </div>
                      </div>

                      {/* Enhanced Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{formatCompactNumber(Number(video.videoViews) || 0)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <StarIcon className="w-4 h-4 text-yellow-500" />
                            <span>{Number(video.averageRating).toFixed(1)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <Calendar1 className="w-4 h-4" />
                          <span>{compactDate(video.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <InfiniteScroll
        isManual={false}
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  );
};

const formatCompactNumber = (number: number): string => {
  return Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(number);
};