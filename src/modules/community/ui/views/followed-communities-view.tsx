'use client';

import { trpc } from "@/trpc/client";
import { VideoGridCard } from "@/modules/videos/ui/components/video-grid-card";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import Link from "next/link";
import {
    ArrowRight,
    Users,
    Video,
    Loader2
} from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";

export const FollowedCommunitiesView = () => {
    return (
        <Suspense fallback={<FollowedCommunitiesSkeleton />}>
            <ErrorBoundary fallback={<ErrorFallback />}>
                <FollowedCommunitiesSuspense />
            </ErrorBoundary>
        </Suspense>
    );
};

const ErrorFallback = () => (
    <Card className="max-w-5xl mx-auto my-8 border-destructive/20 bg-destructive/5">
        <CardContent className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <Video className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Failed to load communities</h3>
            <p className="text-muted-foreground mb-4">We couldn't load your followed communities. Please try again.</p>
            <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
                Retry
            </button>
        </CardContent>
    </Card>
);

const FollowedCommunitiesSkeleton = () => {
    return (
        <div className="max-w-5xl mx-auto p-4 space-y-8">
            {[1, 2].map((i) => (
                <div key={i} className="space-y-4">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-12 h-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-32 rounded-lg" />
                    </div>
                    <div className="px-4">
                        <div className="flex gap-4 overflow-hidden">
                            {[1, 2, 3, 4].map((j) => (
                                <Skeleton key={j} className="h-64 w-64 flex-shrink-0 rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const FollowedCommunitiesSuspense = () => {
    const [communities] = trpc.community.getJoined.useSuspenseQuery();

    if (communities.length === 0) {
        return (
            <div className="max-w-2xl mx-auto py-16 px-4">
                <Card className=" overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32  -translate-y-16 translate-x-16" />
                    <CardContent className="p-12 text-center relative">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-10 h-10 text-primary" />
                        </div>

                        <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
                            Join communities to see their latest videos
                        </p>
                        <Link
                            href="/c"
                            className="group inline-flex items-center gap-2 px-8 py-3 rounded-xl btn-primary font-semibold transition-all duration-300 shadow"
                        >
                            Explore Communities
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-16 pb-12">
            <div className="max-w-5xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold ">Your Communities</h1>
                        <p className="text-muted-foreground mt-2">
                            Latest videos from communities you follow
                        </p>
                    </div>
                    <Badge variant="outline" className="px-3 py-1.5">
                        <Users className="w-3.5 h-3.5 mr-2" />
                        {communities.length} {communities.length === 1 ? 'Community' : 'Communities'}
                    </Badge>
                </div>
            </div>

            <div className="space-y-12">
                {communities.map((community) => (
                    <div
                        key={community.communityId}
                        className="space-y-6 group/community"
                    >
                        <div className="max-w-5xl mx-auto px-4">
                            <div className="flex items-start justify-between p-4 rounded-2xl  transition-all duration-300 border">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        {community.icon_url ? (
                                            <Image
                                                src={community.icon_url}
                                                alt={community.name}
                                                width={56}
                                                height={56}
                                                className="w-14 h-14 rounded-full object-cover border-2 border-border shadow-lg"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                                <Users className="w-7 h-7 text-primary" />
                                            </div>
                                        )}

                                    </div>
                                    <div>
                                        <div className="flex items-start justify-start gap-1 flex-col">
                                            <h2 className="text-2xl font-bold group-hover/community:text-secondary transition-colors">
                                                {community.name}
                                            </h2>
                                            <p className="text-sm text-muted-foreground">
                                                {community.description_short}
                                            </p>
                                        </div>

                                    </div>
                                </div>
                                <Link
                                    href={`/c/${community.communityId}`}
                                    className="group/link flex items-center gap-2 px-5 py-2.5 rounded-lg  text-secondary font-medium hover:bg-primary-gradient hover:text-primary-foreground transition-all duration-300"
                                >
                                    View All
                                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        {community.recentVideos.length > 0 ? (
                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-24  z-10 pointer-events-none" />
                                <div className="absolute right-0 top-0 bottom-0 w-24  z-10 pointer-events-none" />

                                <Carousel
                                    opts={{
                                        align: "start",
                                        loop: true,
                                    }}
                                    className="w-full"
                                >
                                    <CarouselContent className="-ml-6 py-2">
                                        {community.recentVideos.map((item) => (
                                            <CarouselItem
                                                key={item.video.id}
                                                className={cn(
                                                    "pl-6 transition-all duration-300",
                                                    "md:basis-1/2 lg:basis-1/3 xl:basis-1/4",
                                                    "hover:scale-[1.02]"
                                                )}
                                            >
                                                <div className="h-full">
                                                    <VideoGridCard data={item} />
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    <CarouselPrevious className="left-6 size-10 shadow-lg hover:scale-110 transition-transform" />
                                    <CarouselNext className="right-6 size-10 shadow-lg hover:scale-110 transition-transform" />
                                </Carousel>
                            </div>
                        ) : (
                            <div className="max-w-5xl mx-auto px-4">
                                <Card className="border-dashed bg-gradient-to-br from-muted/20 to-muted/5">
                                    <CardContent className="p-12 text-center">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                                            <Video className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
                                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                            This community hasn't posted any videos yet. Check back soon!
                                        </p>
                                        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent transition-colors">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Refresh
                                        </button>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};