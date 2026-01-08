'use client'

import { DEFAULT_LIMIT } from "@/constants"
import { trpc } from "@/trpc/client"
import { Suspense, useMemo, } from "react"
import { compactDate, compactNumber, } from "@/lib/utils"
import { VideoThumbnail } from "@/modules/videos/ui/components/video-thumbnail"
import { UserAvatar } from "@/components/user-avatar"
import { Rating, RatingButton } from "@/components/ui/shadcn-io/rating"
import { InfiniteScroll } from "@/components/infinite-scroll"
import { ErrorBoundary } from "react-error-boundary"
import Link from "next/link"
import { SubButton } from "@/modules/subscriptions/ui/components/sub-button"
import { useFollow } from "@/modules/follows/hooks/follow-hook"
import { Button } from "@/components/ui/button"
import { useAuth } from "@clerk/nextjs"
import { RocketIcon, TrendingUpIcon, ZapIcon } from "lucide-react"
import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import { XpCard } from "@/modules/home/ui/components/xp-card"
import { useRouter } from "next/navigation"

interface SearchViewProps {
    query: string | undefined
}

const f = (x: number) => {
    return Math.floor((x * x) / 1000);
};


export const SearchView = ({ query }: SearchViewProps) => {
    return (
        <Suspense fallback={<SearchViewSkeleton />}>
            <ErrorBoundary fallback={
                <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-xl text-red-500 mb-2">Error loading search results</p>
                        <p className="text-muted-foreground">Please try again</p>
                    </div>
                </div>
            }>
                <SearchViewSuspense query={query} />
            </ErrorBoundary>
        </Suspense>
    )
}

const SearchViewSkeleton = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Results Header Skeleton */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-border">
                    <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
                    <div className="flex items-center gap-3">
                        <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                        <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
                    </div>
                </div>

                {/* Video List Skeleton */}
                <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={index}
                            className="flex flex-col lg:flex-row bg-card rounded-xl overflow-hidden border border-border animate-pulse"
                        >
                            {/* Thumbnail Skeleton */}
                            <div className="relative lg:w-96 xl:w-[400px] h-48 lg:h-56 flex-shrink-0 bg-muted">
                            </div>

                            {/* Video Content Skeleton */}
                            <div className="flex-1 p-6 flex flex-col justify-between">
                                <div className="space-y-3">
                                    <div className="h-6 bg-muted rounded w-3/4 animate-pulse"></div>
                                    <div className="flex items-center gap-4">
                                        <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                                        <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-muted animate-pulse"></div>
                                        <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                                        <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
                                    </div>
                                </div>

                                {/* Rating Skeleton */}
                                <div className="flex items-center gap-3 mt-4">
                                    <div className="flex gap-1">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className="w-4 h-4 bg-muted rounded animate-pulse"></div>
                                        ))}
                                    </div>
                                    <div className="h-4 bg-muted rounded w-8 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination Skeleton */}
                <div className="flex justify-center gap-2 mt-12">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="w-11 h-11 bg-muted rounded-lg animate-pulse"></div>
                    ))}
                </div>
            </div>
        </div>
    )
}

interface ChannelCardProps {
    channel: {
        id: string
        clerkId: string
        name: string
        imageUrl: string
        followsCount: number
        videoCount: number
        viewerIsFollowing?: boolean
        boostPoints: number | null
        createdAt: Date
        updatedAt: Date
    }
}

const ChannelCard = ({ channel }: ChannelCardProps) => {
    const { userId: viewerClerkId } = useAuth()
    const router = useRouter()
    const [showAddXpModal, setShowAddXpModal] = useState(false)
    const isOwnChannel = viewerClerkId === channel.clerkId

    const { onClick, isPending, isFollowing } = useFollow({
        userId: channel.id,
        isFollowing: channel.viewerIsFollowing ?? false,
    })

    const isOriginallyFollowing = channel.viewerIsFollowing ?? false;
    let displayFollowsCount = channel.followsCount;

    if (isFollowing && !isOriginallyFollowing) {
        displayFollowsCount++;
    } else if (!isFollowing && isOriginallyFollowing) {
        displayFollowsCount--;
    }

    const boostPoints = channel.boostPoints ?? 0;
    const channelLevel = Math.floor(
        Math.floor(Math.sqrt(boostPoints * 1000)) / 1000
    );

    const xpOnCurrentLevel = f(1000 * channelLevel);
    const xpForNextLevel = f(1000 * (channelLevel + 1));

    const progressPercentage = Math.max(0, Math.min(100, ((boostPoints - xpOnCurrentLevel) / (xpForNextLevel - xpOnCurrentLevel)) * 100));

    const handleRankingClick = () => {
        router.push(`/users/${channel.id}#community`);
    };

    return (
        <div className="bg-card text-card-foreground rounded-xl p-6 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-2xl">
            <AnimatePresence>
                {showAddXpModal && (
                    <XpCard user={channel} setShowAddXpModal={setShowAddXpModal} />
                )}
            </AnimatePresence>
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <Link href={`/users/${channel.id}`}>
                        <UserAvatar
                            imageUrl={channel.imageUrl}
                            name={channel.name}
                            userId={channel.id}
                            disableLink={true}
                            size="lg"
                        />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <Link href={`/users/${channel.id}`}>
                            <h3 className="text-lg font-semibold truncate hover:text-primary transition-colors">
                                {channel.name}
                            </h3>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <span>{compactNumber(displayFollowsCount)} followers</span>
                            <span>•</span>
                            <span>{channel.videoCount} videos</span>
                        </div>
                        <div className="w-fit">
                            {isOwnChannel ? (
                                <Link href={`/users/${channel.id}`} className="block">
                                    <Button
                                        size="sm"
                                        className="rounded-full h-8 px-4 text-xs"
                                        variant="outline"
                                    >
                                        View My Channel
                                    </Button>
                                </Link>
                            ) : (
                                <SubButton
                                    onClick={onClick}
                                    disabled={isPending}
                                    isSubscribed={isFollowing}
                                    size="sm"
                                    className="h-8 px-4 text-xs shadow-sm hover:shadow-md transition-all bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* XP / Boost Section */}
                <div className="w-full sm:w-80 bg-gradient-to-r from-amber-400/10 to-orange-500/10 dark:from-amber-400/5 dark:to-orange-500/5 rounded-2xl p-3 border border-amber-200 dark:border-amber-800/50 shadow-sm mt-4 sm:mt-0">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-1 rounded-lg">
                                <ZapIcon className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-foreground">Level {channelLevel}</span>
                        </div>

                        {isOwnChannel ? (
                            <button
                                onClick={handleRankingClick}
                                className="flex items-center gap-1 text-[10px] bg-gradient-to-r from-[#ffca55] to-[#ffa100] hover:from-[#f5c042] hover:to-[#e89600] text-white py-1 px-2 rounded-lg transition-colors"
                            >
                                <TrendingUpIcon className="w-3 h-3" />
                                <span>Ranking</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowAddXpModal(true)}
                                className="flex items-center gap-1 text-[10px] bg-amber-500 hover:bg-amber-600 text-white py-1 px-2 rounded-lg transition-colors"
                            >
                                <RocketIcon className="w-3 h-3" />
                                <span>Boost</span>
                            </button>
                        )}
                    </div>

                    <div className="mb-2">
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full relative overflow-hidden"
                                style={{ width: `${progressPercentage}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end items-center text-center gap-2">
                        <p className='text-[10px] font-semibold pb-0.5 text-muted-foreground'>Boost progress: </p>
                        <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            {progressPercentage.toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export const SearchViewSuspense = ({ query }: SearchViewProps) => {

    const [data, resultQuery] = trpc.search.getManyByQuery.useSuspenseInfiniteQuery(
        { query, limit: DEFAULT_LIMIT },
        { getNextPageParam: (lastPage) => lastPage.nextCursor }
    )

    const channelsQuery = trpc.search.getChannelsByQuery.useQuery({
        query,
        limit: 5 // Show top 5 matching channels
    })

    // Use actual data when available, otherwise use mock data
    const videos = useMemo(() => {
        if (!data) return [];

        return data.pages.flatMap(
            (page) => Object.values(page.items).filter((item) => item)
        );
    }, [data]);

    const channels = channelsQuery.data?.items ?? [];

    // Show error message if channels query fails
    if (channelsQuery.error) {
        console.error('🎨 Channel Query Error Details:', channelsQuery.error);
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Results Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-border">
                    <div className="text-muted-foreground text-sm">
                        {videos.length} video results {channels.length > 0 && `• ${channels.length} channel${channels.length !== 1 ? 's' : ''}`}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">Sort by:</span>
                        <select className="px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                            <option>Relevance</option>
                            <option>Upload date</option>
                            <option>View count</option>
                            <option>Rating</option>
                        </select>
                    </div>
                </div>

                {/* Channels Section */}
                {channelsQuery.isLoading ? (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <span className="text-primary">Channels</span>
                        </h2>
                        <div className="text-muted-foreground">Loading channels...</div>
                    </div>
                ) : channelsQuery.error ? (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <span className="text-primary">Channels</span>
                        </h2>
                        <div className="text-red-500">Error loading channels: {channelsQuery.error.message}</div>
                    </div>
                ) : channels.length > 0 ? (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <span className="text-primary">Channels</span>
                        </h2>
                        <div className="space-y-6">
                            {channels.map((channel) => (
                                <ChannelCard key={channel.id} channel={channel} />
                            ))}
                        </div>
                    </div>
                ) : null}

                {/* Videos Section */}
                {videos.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <span className="text-primary">Videos</span>
                        </h2>
                        {/* Video List */}
                        <div className="space-y-6">
                            {videos.map((video) => (
                                <Link
                                    key={video.id}
                                    href={`/videos/${video.id}`}
                                    className="flex flex-col lg:flex-row bg-card text-card-foreground rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-2xl"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative lg:w-96 xl:w-[400px] h-48 lg:h-56 flex-shrink-0">
                                        <VideoThumbnail title={video.title} duration={video.duration} imageUrl={video.thumbnailUrl} isAi={video.isAi}
                                        />

                                        {/* {video.isLive && (
                                    <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
                                        Live
                                    </div>
                                )} */}
                                    </div>

                                    {/* Video Content */}
                                    <div className="flex-1 p-6 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-xl font-semibold mb-2 line-clamp-2">
                                                {video.title}
                                            </h3>
                                            <div className="flex items-center gap-4 text-muted-foreground text-sm mb-3">
                                                <span>{compactNumber(Number(video.videoViews) ?? 0)}</span>
                                                <span>{compactDate(video.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <UserAvatar imageUrl={video.user.imageUrl} name={video.user.name} userId={video.user.id} disableLink={true} />
                                                <span className="font-medium">{video.user.name}</span>
                                                {/* TODO: verified */}
                                                {/* {video.channel.verified && (
                                            <i className="fas fa-check-circle text-primary text-sm" />
                                        )} */}
                                            </div>
                                            <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                                                {video.description}
                                            </p>
                                        </div>

                                        {/* Rating */}
                                        <div className="flex items-center gap-3">
                                            <Rating value={Math.floor(Number(video.averageRating))} readOnly>
                                                {Array.from({ length: 5 }).map((_, index) => (
                                                    <RatingButton className="text-primary" key={index} />
                                                ))}
                                            </Rating>
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground">({Number(video.averageRating).toFixed(1)})</p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        <InfiniteScroll isManual={false} hasNextPage={resultQuery.hasNextPage} isFetchingNextPage={resultQuery.isFetchingNextPage} fetchNextPage={resultQuery.fetchNextPage} />
                    </div>
                )}

                {/* No Results Message */}
                {videos.length === 0 && channels.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-gray-400 text-lg mb-2">No results found</div>
                        <p className="text-gray-500 text-sm">Try adjusting your search terms</p>
                    </div>
                )}
            </div>
        </div>
    )
}