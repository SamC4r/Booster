"use client";

import { trpc } from "@/trpc/client";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { CommunityCard } from "../components/community-card";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { PlusCircle, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoriesSection } from "@/modules/explorer/ui/sections/categories-section";
import { CreateCommunityModal } from "../components/create-community-modal";
import { DEFAULT_COMMUNITIES_LIMIT } from "@/constants";

interface CommunitiesSectionProps {
  categoryId?: string;
}

export const CommunitiesSection = ({ categoryId }: CommunitiesSectionProps) => {
  return (


    <Suspense fallback={<CommunitiesSectionSkeleton />}>
      <ErrorBoundary
        fallback={
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 text-center">
            <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Failed to load communities
            </h3>
            <p className="text-muted-foreground mb-4">
              Please try again later
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        }
      >
        <CommunitiesSectionSuspense categoryId={categoryId} />
      </ErrorBoundary>
    </Suspense>
  );
};

const CommunitiesSectionSkeleton = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Skeleton className="h-12 w-40 rounded-xl" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CommunitiesSectionSuspense = ({
  categoryId,
}: CommunitiesSectionProps) => {
  const [selectedCategory, setSelectedCategory] = useState(categoryId);
  const [data, query] = trpc.community.getMany.useSuspenseInfiniteQuery(
    {
      categoryId,
      limit: DEFAULT_COMMUNITIES_LIMIT,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const communities = data.pages.flatMap((page) => page.items);


  const [open, setOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Discover Communities
          </h1>
          <p className="text-muted-foreground">
            Find your people. Explore communities that match your interests.
          </p>
        </div>

        <CreateCommunityModal open={open} setOpen={setOpen} />
      </div>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-10 rounded-xl  flex items-center overflow-hidden px-1">
            <CategoriesSection
              categoryId={categoryId}
              setSelectedCategory={setSelectedCategory}
            />
          </div>
          <Button variant='outline' className="h-10 gap-2 rounded-xl shadow-sm" onClick={() => setOpen((e) => !e)}>
            <PlusCircle className="h-4 w-4" />
            Create Community
          </Button>
        </div>

        {/* Communities Grid */}
        {communities.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border-2 border-dashed border-muted">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No communities found</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to create one!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {communities.map((community) => (
                <CommunityCard
                  key={community.communityId}
                  community={community}
                />
              ))}
            </div>

            <InfiniteScroll
              hasNextPage={query.hasNextPage}
              isFetchingNextPage={query.isFetchingNextPage}
              fetchNextPage={query.fetchNextPage}
            />
          </>
        )}
      </div>
    </div>
  );
};
