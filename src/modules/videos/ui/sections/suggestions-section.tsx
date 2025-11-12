'use client'
import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constants";
import { videos } from "@/db/schema";
import { compactNumber } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { motion } from "framer-motion";
import { Eye, Star, Sparkles, RocketIcon, Trophy } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { THUMBNAIL_FALLBACK } from "../../constants";
import { VideoThumbnail } from "../components/video-thumbnail";
import { UserAvatar } from "@/components/user-avatar";

interface SuggestionsSectionProps {
    videoId: string;
}

export const SuggestionsSection = ({ videoId }: SuggestionsSectionProps) => {

    const [data, query] = trpc.videos.getMore.useSuspenseInfiniteQuery(
        { videoId, limit: DEFAULT_LIMIT },
        { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

    const watchNext = useMemo(() => data ? data.pages.flatMap(p => p.items) : [], [data]);

    return (
        <div className="relative w-full">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/30" />

            <div className="relative z-10 w-full">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative flex items-center w-full mb-8 px-4"
                >
                    {/* Centered title */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-gray-900 text-center dark:text-white">Watch Next</h2>
                    </div>


                </motion.div>

                {/* Video grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4">
                    {watchNext.map((video, index) => (
                        <motion.div
                            key={video.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group cursor-pointer"
                        >
                            <div className="relative  rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                                {/* Thumbnail container */}
                                <VideoThumbnail
                                    title={video.title}
                                    duration={video.duration}
                                    imageUrl={video.thumbnailUrl || THUMBNAIL_FALLBACK}
                                    previewUrl={video.previewUrl}
                                    key={video.id}
                                />

                                {/* Content */}
                                <div className="p-4">
                                    {/* Title */}
                                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                        {video.title}
                                    </h3>

                                    {/* User info */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <UserAvatar
                                            size="md"
                                            imageUrl={video.user?.imageUrl || "/public-user.png"}
                                            name={video.user?.name || "Anonymous"}
                                            userId={video.user?.id}
                                            badgeSize={5}
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

                                    {/* Stats */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                <span>{compactNumber(Number(video.videoViews))}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3" />
                                                <span>{Number(video.averageRating).toFixed(1)}</span>
                                            </div>
                                        </div>

                                        {/* Trending indicator */}
                                        {index < 2 && (
                                            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                                <Sparkles className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Hover effect border */}
                                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-amber-300 dark:group-hover:border-amber-600 transition-all duration-300 pointer-events-none" />
                            </div>
                        </motion.div>
                    ))}
                </div>


                <InfiniteScroll
                    isManual={false}
                    hasNextPage={query.hasNextPage}
                    isFetchingNextPage={query.isFetchingNextPage}
                    fetchNextPage={query.fetchNextPage}
                />

                {/* View all button */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex justify-center mt-8"
                >
                    <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 transform hover:-translate-y-0.5">
                        View All Suggestions
                    </button>
                </motion.div>
            </div>
        </div>
    );
};
