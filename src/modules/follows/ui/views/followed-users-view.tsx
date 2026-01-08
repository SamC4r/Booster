'use client';

import { trpc } from "@/trpc/client";
import { VideoGridCard } from "@/modules/videos/ui/components/video-grid-card";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { UserAvatar } from "@/components/user-avatar";

export const FollowedUsersView = () => {
    return (
        <Suspense fallback={<FollowedUsersSkeleton />}>
            <ErrorBoundary fallback={<p>Failed to load followed users.</p>}>
                <FollowedUsersSuspense />
            </ErrorBoundary>
        </Suspense>
    );
};

const FollowedUsersSkeleton = () => {
    return <div className="max-w-5xl mx-auto p-4">Loading...</div>;
};

const FollowedUsersSuspense = () => {
    const [users] = trpc.follows.getFollowedUsers.useSuspenseQuery();

    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <h2 className="text-2xl font-bold mb-2">You aren&apos;t following anyone yet</h2>
                <p className="text-muted-foreground mb-6">Follow creators to see their latest videos here.</p>
                <Link href="/" className="text-primary hover:underline">
                    Explore Videos
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-10">
            {users.map((user) => (
                <div key={user.id} className="space-y-4">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-3">
                            <UserAvatar
                                userId={user.id}
                                imageUrl={user.imageUrl}
                                name={user.name}
                                size="lg"
                            />
                            <div>
                                <h2 className="text-2xl font-bold">{user.name}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {user.recentVideos.length} recent videos
                                </p>
                            </div>
                        </div>
                        <Link
                            href={`/users/${user.id}`}
                            className="flex items-center gap-2 text-sm font-medium text-secondary hover:underline"
                        >
                            View Channel <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {user.recentVideos.length > 0 ? (
                        <div className="px-4">
                            <Carousel
                                opts={{
                                    align: "start",
                                }}
                                className="w-full"
                            >
                                <CarouselContent className="-ml-4">
                                    {user.recentVideos.map((item) => (
                                        <CarouselItem key={item.video.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                            <VideoGridCard data={item} />
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="left-2" />
                                <CarouselNext className="right-2" />
                            </Carousel>
                        </div>
                    ) : (
                        <div className="px-4 py-8 text-center text-muted-foreground bg-muted/30 rounded-lg mx-4">
                            No recent videos from this creator.
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
