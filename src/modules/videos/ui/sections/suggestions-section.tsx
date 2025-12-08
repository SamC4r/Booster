'use client'
import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constants";
import { compactNumber } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { motion } from "framer-motion";
import { Eye, Star, RocketIcon, Trophy } from "lucide-react";
import { useMemo } from "react";
import { THUMBNAIL_FALLBACK } from "../../constants";
import { VideoThumbnail } from "../components/video-thumbnail";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";

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
            <div className="absolute inset-0 " />

            <div className="relative z-10 w-full">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative flex items-center w-full px-4"
                >
                    {/* Centered title */}



                </motion.div>

                {/* Video list (single column) */}
                <div className="grid grid-cols-1 gap-3">
                    {watchNext.map((video, index) => (
                        <motion.div
                            key={video.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.06 }}
                            className="group cursor-pointer"
                        >
                            <Link href={`/videos/${video.id}`}>
                                <div className="flex items-start rounded-2xl transition-all duration-300 hover:shadow-2xl overflow-hidden relative">
                                    {/* Left: fixed thumbnail */}
                                    <div className="relative w-64 h-36">
                                        <VideoThumbnail
                                            previewUrl={video.previewUrl ?? video.thumbnailUrl ?? THUMBNAIL_FALLBACK}
                                            duration={video.duration}
                                            title={video.title}
                                        />
                                    </div>

                                    {/* Right: content */}
                                    <div className="p-3 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                                {video.title}
                                            </h3>

                                            <div className="flex items-center gap-2 mb-3">
                                                <UserAvatar
                                                    size="sm"
                                                    imageUrl={video.user?.imageUrl || "/public-user.png"}
                                                    name={video.user?.name || "Anonymous"}
                                                    userId={video.user?.id}
                                                    badgeSize={4}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                                        {video.user?.name?.replace(/\s*null\s*$/i, "") || "Anonymous"}
                                                    </p>
                                                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                                                        {video.user?.name === "sammas24 null" ? (
                                                            <span className="flex items-center gap-1 text-orange-500">Founder & Developer <RocketIcon className="size-3" /></span>
                                                        ) : (
                                                            <span className="flex items-center gap-1">Top Content Creator <Trophy className="size-3" /></span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

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
                                        </div>
                                    </div>

                                    {/* Hover effect border */}
                                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-amber-300 dark:group-hover:border-amber-600 transition-all duration-300 pointer-events-none" />
                                </div>
                            </Link>
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
