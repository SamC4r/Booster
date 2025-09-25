'use client'
import { motion, AnimatePresence } from "framer-motion";
import { CategoriesSection } from "../sections/categories-section";
import { Play, Eye, Clock, Star, TrendingUp, Sparkles, ArrowRight, Zap, Heart, Share2, Calendar } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { User } from "@/modules/users/types";
import { formatDuration } from "@/lib/utils";
import { VideoThumbnail } from "@/modules/videos/ui/components/video-thumbnail";
import { UserAvatar } from "@/components/user-avatar";
import { VideoOwner } from "@/modules/videos/ui/components/video-owner";
import { InfiniteScroll } from "@/components/infinite-scroll";
import Link from "next/link";

interface HomeViewProps {
  categoryId?: string;
}


export const ExplorerView = ({ categoryId }: HomeViewProps) => {
  const [selectedCategory, setSelectedCategory] = useState(categoryId || "all");
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);

  const [data, query] = trpc.explorer.getMany.useSuspenseInfiniteQuery(
    { limit: DEFAULT_LIMIT * 2 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const videos = useMemo(() => data ? data.pages.flatMap(p => p.items) : [], [data]);

  useEffect(() => {
    setIsLoading(false);
  }, [selectedCategory]);

  const featuredVideo = videos.find(v => v.isFeatured);

  return (
    <div className="overflow-hidden mb-10 px-4 pt-2.5 flex flex-col gap-y-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "backOut" }}
          className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-full mb-6 shadow-lg shadow-amber-500/25"
        >
          <Zap className="w-5 h-5" />
          <span className="text-sm font-semibold tracking-wide">TRENDING NOW</span>
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 leading-tight"
        >
          Discover Amazing
          <span className="block bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            Content
          </span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
        >
          Explore curated videos from talented creators around the world
          <span className="block text-amber-600 dark:text-amber-400 font-medium mt-2">
            New content added daily
          </span>
        </motion.p>
      </motion.div>

      {/* Categories Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <CategoriesSection
          categoryId={selectedCategory ?? "all"}
        />
      </motion.div>

      {/* Featured Video Section */}
      {featuredVideo && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="relative group"
        >
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-3xl blur-xl transform scale-105 group-hover:scale-110 transition-transform duration-500" />
          
          <div className="relative bg-gradient-to-r from-amber-50 to-orange-50 dark:from-[#333333] dark:to-[#333333] rounded-3xl p-8 border border-amber-200 dark:border-amber-800 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-10 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full shadow-lg" />
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Today</h2>
                </div>
                <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-full">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-semibold">Editor's Pick</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Just added</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Video Card */}
              <Link href={`/explorer/videos/${featuredVideo.id}`}>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative group/card"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <VideoThumbnail
                    duration={featuredVideo.duration || 0}
                    title={featuredVideo.title}
                    imageUrl={featuredVideo.thumbnailUrl}
                    previewUrl={featuredVideo.previewUrl}
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  {/* Content Overlay */}
                  <div className="absolute top-0 left-0 right-0 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-2xl font-bold text-white line-clamp-2 pr-4 flex-1">
                        {featuredVideo.title}
                      </h3>
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg">
                        Featured
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <UserAvatar
                          size="lg"
                          imageUrl={featuredVideo.user?.imageUrl || "/public-user.png"}
                          name={featuredVideo.user?.name || "Anonymous"}
                          userId={featuredVideo.user?.id}
                        />
                        <div>
                          <p className="text-white font-medium">{featuredVideo.user?.name}</p>
                        </div>
                      </div>
                      

                      
                    </div>
                  </div>
                </div>
              </motion.div>
              </Link>
              {/* Features List */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Why you'll love this:</h3>
                <ul className="space-y-4">
                  {[
                    "Funny ending",
                    "Unexpected outcome", 
                    "Community rating: 4.8+ stars",
                  ].map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="flex items-center gap-4 text-gray-700 dark:text-gray-300 group/feature"
                    >
                      <div className="relative">
                        <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transform group-hover/feature:scale-150 transition-transform" />
                        <div className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-75" />
                      </div>
                      <span className="text-lg">{feature}</span>
                    </motion.li>
                  ))}
                </ul>
                
                <div className="flex gap-4 pt-4">

                  <Link href={`/explorer/videos/${featuredVideo.id}`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-xl font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-amber-500/25 transition-all"
                    >
                      <Play className="w-5 h-5" />
                      Watch Featured Video
                    </motion.button>
                  </Link>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Video Grid Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.7 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-2 h-12 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full shadow-lg" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {selectedCategory === "all" ? "Popular Videos" : `${selectedCategory} Videos`}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Top content 
              </p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ x: 5 }}
            className="flex items-center gap-3 bg-white dark:bg-gray-800 px-6 py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600 transition-all group"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-800 rounded-2xl aspect-video mb-4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {videos.filter(v => !v.isFeatured).map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{  duration: 0.3 }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  onHoverStart={() => setHoveredVideo(video.id)}
                  onHoverEnd={() => setHoveredVideo(null)}
                  className="group cursor-pointer relative"
                >

                  <Link href={`/explorer/videos/${video.id}`}>
                  {/* Hover Glow Effect */}
                  
                  {/* TODO: This could be a premium feature */}
                  {/* <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-105" /> */}
                  
                  <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#333333] dark:to-[#333333] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300">
                    {/* Video Thumbnail */}
                    <div className="relative aspect-video overflow-hidden">
                      <VideoThumbnail
                        duration={video.duration || 0}
                        title={video.title}
                        imageUrl={video.thumbnailUrl}
                        previewUrl={video.previewUrl}
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Video Info Overlay */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                        {video.categoryId && (
                          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-lg">
                            {video.categoryId}
                          </div>
                        )}
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="bg-white/90 text-gray-900 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          <Play className="w-4 h-4" />
                        </motion.button>
                      </div>
                      
                      {/* Duration */}
                      {/* <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm">
                        {formatDuration(video.duration)}
                      </div> */}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-3 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-tight">
                        {video.title || "Untitled"}
                      </h3>

                      {/* Creator Info */}
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
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{formatCompactNumber(Number(video.videoViews) ?? 0)}</span>
                          </div>
                          
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-gray-400 hover:text-amber-500 transition-colors"
                        >
                            <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500 " />
                            <span>{Number(video.averageRating).toFixed(1) || "0.0"}</span>
                          </div>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>

      {/* CTA Section */}
      {/* <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.7 }}
        className="text-center py-12"
      >
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-3xl blur-2xl transform scale-105" />
          
          <div className="relative bg-gradient-to-r from-amber-50 to-orange-50 dark:from-[#333333] dark:to-[#333333] rounded-3xl p-12 border border-amber-200 dark:border-amber-800 shadow-2xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Ready to explore more?
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              <span className="text-amber-600 dark:text-amber-400 font-semibold"> Start your journey today.</span>
            </motion.p>
            
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-12 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-amber-500/25 transition-all duration-300 inline-flex items-center gap-3"
            >
              <Zap className="w-5 h-5" />
              Explore All Categories
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div> */}
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