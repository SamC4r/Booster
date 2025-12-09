'use client'
import { motion, AnimatePresence } from "framer-motion";
import { CategoriesSection } from "../sections/categories-section";
import { Play, Eye, ArrowRight, StarIcon, Calendar1, RocketIcon, Trophy } from "lucide-react";
import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT, getTitleGradient } from "@/constants";
import { compactDate, cn } from "@/lib/utils";
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
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
    // const [selectedCategory] = useState(categoryId || "all");

    const [selectedCategory, setSelectedCategory] = useState(categoryId);

        const searchParams = useSearchParams();
        const aiQuery = searchParams?.get("q") ?? undefined;
        const isAiMode = Boolean(searchParams?.get("ai") && aiQuery);

        // Show a brief glow when AI search starts: visible briefly then fade out
        const [glowVisible, setGlowVisible] = useState(false);
        const [glowFading, setGlowFading] = useState(false);

        useEffect(() => {
            let fadeTimer: ReturnType<typeof setTimeout> | undefined;
            let hideTimer: ReturnType<typeof setTimeout> | undefined;

            if (isAiMode && aiQuery) {
                // start visible, then begin fading so total visible time <= 1000ms
                setGlowFading(false);
                setGlowVisible(true);
                // start fade after 700ms
                fadeTimer = setTimeout(() => setGlowFading(true), 600);
                // remove glow after 1000ms
                hideTimer = setTimeout(() => setGlowVisible(false), 1200);
            } else {
                // ensure cleared when leaving ai mode
                setGlowFading(false);
                setGlowVisible(false);
            }

            return () => {
                if (fadeTimer) clearTimeout(fadeTimer);
                if (hideTimer) clearTimeout(hideTimer);
            };
        }, [isAiMode, aiQuery]);

        const [data, query] = (
            isAiMode
                ? trpc.explorer.aiSearch.useSuspenseInfiniteQuery(
                        { text: aiQuery || "", limit: DEFAULT_LIMIT * 2 },
                        { getNextPageParam: (lastPage) => lastPage.nextCursor }
                    )
                : trpc.explorer.getMany.useSuspenseInfiniteQuery(
                        { limit: DEFAULT_LIMIT * 2, categoryId },
                        { getNextPageParam: (lastPage) => lastPage.nextCursor }
                    )
        ) as any;

    const videos = useMemo(() => (data ? (data.pages as any[]).flatMap((p: any) => p.items as any[]) : []), [data]);
    const featuredVideo = (videos as any[]).find((v: any) => v.isFeatured);




    return (
        <div className="overflow-hidden mb-10 px-4 flex flex-col gap-y-12">
            {/* Enhanced Header Section */}
            {/* <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative text-center mb-8"
            >


                <div className="relative z-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="text-5xl md:text-7xl font-bold text-textprimary mt-2 pt-2 leading-tight"
                    >
                        Explorer
                    </motion.h1>
                </div>
            </motion.div> */}



            {/* Enhanced Categories Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="relative mt-5"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent blur-xl transform scale-110" />
                <div className="relative z-10">
                    <CategoriesSection categoryId={selectedCategory || "all"} setSelectedCategory={setSelectedCategory}/>
                </div>
            </motion.div>

            {/* Enhanced Featured Video Section */}
            {featuredVideo && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{  duration: 0.2 }}
                    className="relative w-full group"
                >
                    {/* Animated Background Glow - Outside container */}
                    <div className="absolute inset-0 rounded-3xl blur-lg opacity-0  bg-secondary transition-opacity duration-500 pointer-events-none -z-10" />

                    <div className="relative shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <motion.div
                                        className="w-3 h-10 bg-gradient-to-b from-primary to-secondary rounded-full shadow-lg"
                                    />
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Earn free XP</h2>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {/* Enhanced Video Card 1 - Real Featured Video */}
                            <Link href={`/videos/${featuredVideo.id}`}>
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                    className="relative group/card cursor-pointer"
                                >
                                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-transparent">
                                        {(glowVisible || glowFading) && (
                                            <div className={`absolute -inset-6 -z-10 pointer-events-none transition-opacity duration-300 ${glowFading ? 'opacity-0' : 'opacity-100'}`}>
                                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400/60 via-yellow-300/40 to-transparent animate-pulse blur-[40px] opacity-95 transform scale-105" />
                                            </div>
                                        )}

                                        <div className="relative aspect-video overflow-hidden">
                                            <VideoThumbnail
                                                duration={featuredVideo.duration || 0}
                                                title={featuredVideo.title}
                                                imageUrl={featuredVideo.thumbnailUrl}
                                                previewUrl={featuredVideo.previewUrl}
                                            />
                                        </div>

                                        {/* Enhanced Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                                        {/* Enhanced Content Overlay */}
                                        <div className="absolute inset-0 p-4 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="text-xl font-bold text-white line-clamp-2 pr-2 flex-1 leading-tight">
                                                        {featuredVideo.title}
                                                    </h3>
                                                    <motion.div
                                                        whileHover={{ scale: 1.1 }}
                                                        className="bg-gradient-to-r from-primary to-secondary text-textprimary px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg whitespace-nowrap"
                                                    >
                                                        Featured
                                                    </motion.div>
                                                </div>

                                                <div className="flex items-center gap-2 mb-2">
                                                    <UserAvatar
                                                        size="md"
                                                        imageUrl={featuredVideo.user?.imageUrl || "/public-user.png"}
                                                        name={featuredVideo.user?.name || "Anonymous"}
                                                        userId={featuredVideo.user?.id}
                                                        badgeSize={5}
                                                        disableLink
                                                    />
                                                    <div>
                                                        <p className="text-white font-medium text-sm">{featuredVideo.user?.name}</p>
                                                        <div className="flex items-center gap-2 text-white/80 text-xs mt-0.5">
                                                            <div className="flex items-center gap-1">
                                                                <Eye className="w-3 h-3" />
                                                                <span>{formatCompactNumber(Number(featuredVideo.videoViews) || 0)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <StarIcon className="w-3 h-3 text-yellow-300" />
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
                                                <div className="bg-white/20 backdrop-blur-md rounded-full p-3 border border-white/30">
                                                    <Play className="w-8 h-8 text-textprimary fill-white" />
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>

                            
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Enhanced Video Grid Section */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="relative"
            >
                {/* Section Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-2 h-12 bg-gradient-to-b from-primary to-secondary rounded-full shadow-lg"
                        />
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white ">
                                {selectedCategory === "all" ? "Trending Videos" : `${selectedCategory ?? "All"} Videos`}
                            </h2>
                            {/* <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Curated selection of top-performing content
                            </p> */}
                        </div>
                    </div>

                    <Link href="/next-up" className="relative group">
                        {/* Hover glow effect */}
                        <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 bg-[#ffca55] transition-opacity duration-500 pointer-events-none -z-10" />

                        <motion.button
                            whileHover={{ x: 5, scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-3 bg-[#212121] text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 group"
                        >
                            <span>Next up Page</span>
                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                    </Link>
                </div>

                {/* Enhanced Video Grid */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedCategory}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6"
                    >
                        {videos.filter(v => !v.isFeatured).map((video, index) => (
                            <motion.div
                                key={video.id}
                                initial={{ opacity: 0, y: 30,  }}
                                animate={{ opacity: 1, y: 0,  }}
                                transition={{ duration: 0.3, delay: Math.floor(((index)/4)) * 0.5 }}
                                className="group cursor-pointer relative"
                            >
                                <Link href={`/videos/${video.id}`}>

                                    <div className="relative bg-transparent  rounded-2xl overflow-hidden">
                                        {(glowVisible || glowFading) && (
                                            <div className={`absolute -inset-6 -z-10 pointer-events-none transition-opacity duration-300 ${glowFading ? 'opacity-0' : 'opacity-100'}`}>
                                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400/60 via-yellow-300/40 to-transparent animate-pulse blur-[40px] opacity-95 transform scale-105" />
                                            </div>
                                        )}

                                        {/* Video Thumbnail */}
                                        <div className="relative aspect-video overflow-hidden ">
                                            <VideoThumbnail
                                                duration={video.duration || 0}
                                                title={video.title}
                                                imageUrl={video.thumbnailUrl}
                                                previewUrl={video.previewUrl}
                                            />

                                            {/* Enhanced Overlay */}
                                            {/* <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" /> */}

                                            {/* Enhanced Video Info Overlay */}
                                            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                                               

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
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-3 line-clamp-2 ">
                                                {video.title || "Untitled"}
                                            </h3>

                                            {/* Enhanced Creator Info */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <UserAvatar
                                                    size="md"
                                                    imageUrl={video.user?.imageUrl || "/public-user.png"}
                                                    name={video.user?.name || "Anonymous"}
                                                    userId={video.user?.id}
                                                    badgeSize={5}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1 break-all">
                                                        {video.user?.name?.replace(/\s*null\s*$/i, "") || "Anonymous"}
                                                    </p>
                                                    {video.user?.name === "sammas24 null" ? (
                                                        <p className="flex items-center gap-2 text-orange-500 text-xs">
                                                            Founder & Developer <RocketIcon className="size-3" />
                                                        </p>
                                                    ) : video.user?.equippedTitle ? (
                                                        <p className={cn("flex items-center gap-2 font-bold bg-clip-text text-transparent bg-gradient-to-r text-xs", getTitleGradient(video.user.equippedTitle))}>
                                                            {video.user.equippedTitle}
                                                        </p>
                                                    ) : null}
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
