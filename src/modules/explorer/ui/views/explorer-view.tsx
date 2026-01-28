'use client'
import { motion, AnimatePresence } from "framer-motion";
import { CategoriesSection } from "../sections/categories-section";
import { Play, Eye, ArrowRight, StarIcon, Calendar1, RocketIcon, Settings } from "lucide-react";
import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/trpc/client";
import { getTitleGradient } from "@/constants";
import { compactDate, cn } from "@/lib/utils";
import { VideoThumbnail } from "@/modules/videos/ui/components/video-thumbnail";
import { UserAvatar } from "@/components/user-avatar";
import { InfiniteScroll } from "@/components/infinite-scroll";
import Link from "next/link";
import Image from "next/image";
import { ErrorBoundary } from "react-error-boundary";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

import { UserIcon } from "@/modules/market/components/assetIcons/functions/get-user-icons";
import { WelcomeBonusModal } from "@/modules/xp/ui/components/welcome-bonus-modal";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { FollowedCommunitiesView } from "@/modules/community/ui/views/followed-communities-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowedUsersView } from "@/modules/follows/ui/views/followed-users-view";

interface HomeViewProps {
    categoryId?: string;
}

export const ExplorerView = ({ categoryId }: HomeViewProps) => {
    return (
        <>
            {/* <WelcomePopup /> */}
            <WelcomeBonusModal />
            <Suspense fallback={<ExplorerSkeleton />}>
                <ErrorBoundary fallback={<p>Failed to load categories.</p>}>
                    <ExplorerViewSuspense categoryId={categoryId} />
                </ErrorBoundary>
            </Suspense>
        </>
    )
}

const ExplorerSkeleton = () => {
    return (
        <div className="overflow-hidden mb-10 px-4 flex flex-col gap-y-12 animate-pulse">
            {/* Categories Skeleton
            <div className="relative mt-5">
                <div className="flex gap-4 overflow-hidden">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="w-24 h-10 bg-gray-200 dark:bg-gray-800 rounded-xl flex-shrink-0"></div>
                    ))}
                </div>
            </div> */}

            {/* Featured Video Section Skeleton */}
            <div className="w-full">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-10 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                    <div className="w-48 h-8 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                </div>

                <div className="flex gap-4 overflow-hidden">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-full md:w-1/2 lg:w-1/3 xl:w-1/4 flex-shrink-0">
                            <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden">
                                <div className="absolute bottom-4 left-4 right-4 space-y-2">
                                    <div className="w-3/4 h-6 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                                        <div className="w-24 h-4 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Video Grid Skeleton */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-12 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                        <div>
                            <div className="w-48 h-8 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                        </div>
                    </div>
                    <div className="w-32 h-12 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(12)].map((_, index) => (
                        <div key={index} className="group relative">
                            <div className="relative bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden">
                                <div className="aspect-video bg-gray-300 dark:bg-gray-700"></div>
                                <div className="p-4 space-y-3">
                                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-lg w-3/4"></div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="w-24 h-4 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="w-20 h-4 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                                        <div className="w-16 h-4 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
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

const VideoGridSkeleton = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mt-6">
            {[...Array(12)].map((_, index) => (
                <div key={index} className="group relative animate-pulse">
                    <div className="relative bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden">
                        <div className="aspect-video bg-gray-300 dark:bg-gray-700"></div>
                        <div className="p-4 space-y-3">
                            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-lg w-3/4"></div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="w-24 h-4 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="w-20 h-4 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                                <div className="w-16 h-4 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const ExplorerViewSuspense = ({ categoryId }: HomeViewProps) => {
    // const [selectedCategory] = useState(categoryId || "all");

    const [selectedCategory, setSelectedCategory] = useState(categoryId);
    const { userId: clerkUserId } = useAuth();
    const { data: user } = trpc.users.getByClerkId.useQuery({
        clerkId: clerkUserId,
    });
    const rewardedAdsEnabled = user?.accountType === 'business' ? true : (user?.rewardedAdsEnabled ?? false);

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

    // const [data, query] = (
    //     isAiMode
    //         ? trpc.explorer.aiSearch.useSuspenseInfiniteQuery(
    //             { text: aiQuery || "", limit: 30 },
    //             { getNextPageParam: (lastPage) => lastPage.nextCursor }
    //         )
    //         : trpc.explorer.getMany.useSuspenseInfiniteQuery(
    //             { limit: 30, categoryId },
    //             { getNextPageParam: (lastPage) => lastPage.nextCursor }
    //         )
    // ) as any;

    const [data,query] = trpc.explorer.getMany.useSuspenseInfiniteQuery(
                { limit: 30, categoryId },
                { getNextPageParam: (lastPage) => lastPage.nextCursor }) as any

    const videos = useMemo(() => {
        if (!data) return [];
        const allItems = (data.pages as any[]).flatMap((p: any) => p.items as any[]);
        // Deduplicate videos by ID to prevent duplicates in the grid
        const seen = new Set();
        return allItems.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });
    }, [data]);

    // Fetch featured videos separately to ensure they all appear
    const { data: featuredVideosData } = trpc.explorer.getFeatured.useQuery(undefined, {
        suspense: true,
        staleTime: 60000, // Cache for 1 minute
    });

    const featuredVideos = featuredVideosData || [];

    const filteredVideos = useMemo(() => {
        return videos.filter((v: any) => !featuredVideos.some((fv: any) => fv.id === v.id));
    }, [videos, featuredVideos]);

    const { horizontalVideos, verticalVideos } = useMemo(() => {
        const horizontal: any[] = [];
        const vertical: any[] = [];

        filteredVideos.forEach((video: any) => {
            const isVertical = video.width && video.height && video.height > video.width;
            if (isVertical) {
                vertical.push(video);
            } else {
                horizontal.push(video);
            }
        });

        return { horizontalVideos: horizontal, verticalVideos: vertical };
    }, [filteredVideos]);

    const columns = useGridColumns();

    const displayHorizontalVideos = useMemo(() => {
        if (!query.hasNextPage) return horizontalVideos;
        const remainder = horizontalVideos.length % columns;
        if (remainder === 0) return horizontalVideos;
        return horizontalVideos.slice(0, -remainder);
    }, [horizontalVideos, columns, query.hasNextPage]);




    return (
        <div className="overflow-hidden mb-10 px-4 flex flex-col gap-y-12">
            <Tabs defaultValue="videos" className="w-full">
                <div className="flex justify-center mb-6">
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="videos">Videos</TabsTrigger>
                        <TabsTrigger value="communities">Communities</TabsTrigger>
                        <TabsTrigger value="following">Following</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="videos" className="space-y-12">
                    {/* Enhanced Categories Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="relative mt-5"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent blur-xl transform scale-110" />
                        <div className="relative z-10">
                            <CategoriesSection categoryId={selectedCategory || "all"} setSelectedCategory={setSelectedCategory} />
                        </div>
                    </motion.div>

                    {/* Placeholder for Featured Video when ads are disabled */}
                    {featuredVideos.length > 0 && !rewardedAdsEnabled && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full mb-4"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <motion.div
                                            className="w-2 h-6 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"
                                        />
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Earn Free XP</h2>
                                    </div>
                                </div>
                            </div>

                            <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-3 md:p-4">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
                                <div className="relative z-10 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <Image src="/xpicon_plain_no_rgb_glow.png" alt="XP" width={30} height={30} className="w-6 h-6" />
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                                Activate Featured Videos and Earn XP
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm hidden sm:block mt-0.5">
                                            </p>
                                        </div>
                                    </div>
                                    <Link href="/market?action=get-xp" className="flex-shrink-0 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold hover:scale-105 transition-transform shadow-lg text-xs whitespace-nowrap flex items-center justify-center">
                                        Enable Featured
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Enhanced Featured Video Section */}
                    {featuredVideos.length > 0 && rewardedAdsEnabled && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full group">

                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <motion.div
                                            className="w-3 h-10 bg-gradient-to-b from-primary to-secondary rounded-full "
                                        />
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Earn free XP</h2>
                                    </div>
                                </div>
                            </div>

                            <Carousel
                                opts={{
                                    align: "start",
                                }}
                                className="w-full"
                            >
                                <CarouselContent className="-ml-4">
                                    {/* Enhanced Video Card 1 - Real Featured Video */}
                                    {featuredVideos.map((featuredVideo) => (
                                        <CarouselItem key={featuredVideo.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                            <Link href={`/videos/${featuredVideo.id}`}>
                                                <motion.div
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    transition={{ type: "spring", stiffness: 300 }}
                                                    className="relative group/card cursor-pointer"
                                                >
                                                    <div className="relative  overflow-hidden border-2 border-transparent">
                                                        {(glowVisible || glowFading) && (
                                                            <div className={`absolute -inset-6 -z-10 pointer-events-none transition-opacity duration-300 ${glowFading ? 'opacity-0' : 'opacity-100'}`}>
                                                                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/60 via-yellow-300/40 to-transparent animate-pulse blur-[40px] opacity-95 transform scale-105" />
                                                            </div>
                                                        )}

                                                        <div className="relative aspect-video overflow-hidden">
                                                            <VideoThumbnail
                                                                duration={featuredVideo.duration || 0}
                                                                title={featuredVideo.title}
                                                                imageUrl={featuredVideo.thumbnailUrl}
                                                                previewUrl={featuredVideo.previewUrl}
                                                                isAi={featuredVideo.isAi}
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
                                                                        <div className="flex items-center gap-1">
                                                                            <p className="text-white font-medium text-sm">{featuredVideo.user?.name}</p>
                                                                            <UserIcon userId={featuredVideo.user?.id} size={4} />
                                                                        </div>
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
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="left-2" />
                                <CarouselNext className="right-2" />
                            </Carousel>
                        </motion.div>
                    )}

                    {/* Vertical Videos Section */}
                    {verticalVideos.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.7 }}
                            className="relative mt-0"
                        >
                            <div className="flex justify-end mb-4 px-1">
                                <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground gap-2 h-8">
                                    <Link href="/settings" className="flex items-center">
                                        <Settings className="w-3.5 h-3.5" />
                                        <span className="text-xs font-medium">Customize Feed</span>
                                    </Link>
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                                {verticalVideos.slice(0, 6).map((video: any) => (
                                    <div
                                        key={video.id}
                                        className="group cursor-pointer relative"
                                    >
                                        <Link href={`/videos/${video.id}`}>
                                            <div className="relative bg-transparent rounded-2xl overflow-hidden">
                                                <div className="relative overflow-hidden">
                                                    <VideoThumbnail
                                                        duration={video.duration || 0}
                                                        title={video.title}
                                                        imageUrl={video.thumbnailUrl}
                                                        previewUrl={video.previewUrl}
                                                        aspectRatio="vertical"
                                                        isAi={video.isAi}
                                                    />
                                                </div>

                                                <div className="pt-3">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">
                                                        {video.title || "Untitled"}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <UserAvatar
                                                            size="xs"
                                                            imageUrl={video.user?.imageUrl || "/public-user.png"}
                                                            name={video.user?.name || "Anonymous"}
                                                            userId={video.user?.id}
                                                        />
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                                                            {video.user?.name}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                        <div className="flex items-center gap-1">
                                                            <Eye className="w-3 h-3" />
                                                            <span>{formatCompactNumber(Number(video.videoViews) || 0)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <StarIcon className="w-3 h-3 text-yellow-500" />
                                                            <span>{Number(video.averageRating).toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                ))}
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
                                <div className="flex items-center gap-2">
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {selectedCategory === "all" ? "Trending Videos" : `${selectedCategory ?? "All"} Videos`}
                                    </h2>

                                    <TooltipProvider delayDuration={200} >
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Link
                                                    href="/about#recommendation_algorithm"
                                                    className="text-gray-400 hover:text-primary dark:text-gray-500 dark:hover:text-primary transition-colors"
                                                    aria-label="Learn about recommendation algorithm"
                                                >
                                                    <svg
                                                        className="w-5 h-5"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        />
                                                    </svg>
                                                </Link>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-black text-base">Click me to know how the algorithm works :)</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>

                            <Link href="/next-up" className="relative group">
                                <Button
                                    className="flex items-center gap-3  btn-primary py-2 px-3 rounded-lg font-semibold shadow-lg"
                                >
                                    <span>Next up Page</span>
                                    <ArrowRight className="size-4" />
                                </Button>
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
                                className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
                            >
                                {displayHorizontalVideos.map((video: any) => (
                                    <div
                                        key={video.id}
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
                                                        isAi={video.isAi}
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
                                                            <div className="flex items-center gap-1">
                                                                <p className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1 break-all">
                                                                    {video.user?.name?.replace(/\s*null\s*$/i, "") || "Anonymous"}
                                                                </p>
                                                                <UserIcon userId={video.user?.id} size={4} />
                                                            </div>
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
                                    </div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>

                    {query.isFetchingNextPage && <VideoGridSkeleton />}

                    <InfiniteScroll
                        rootMargin="400px"
                        threshold={0.5}
                        isManual={false}
                        hasNextPage={query.hasNextPage}
                        isFetchingNextPage={query.isFetchingNextPage}
                        fetchNextPage={query.fetchNextPage}
                    />
                </TabsContent>

                <TabsContent value="communities">
                    <FollowedCommunitiesView />
                </TabsContent>

                <TabsContent value="following">
                    <FollowedUsersView />
                </TabsContent>
            </Tabs>
        </div>
    );
};

const formatCompactNumber = (number: number): string => {
    return Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1
    }).format(number);
};

const useGridColumns = () => {
    const [columns, setColumns] = useState(1);

    useEffect(() => {
        const updateColumns = () => {
            const width = window.innerWidth;
            if (width >= 1536) setColumns(4); // 2xl
            else if (width >= 1280) setColumns(3); // xl
            else if (width >= 1024) setColumns(2); // lg
            else setColumns(1); // default & md
        };

        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    return columns;
};
