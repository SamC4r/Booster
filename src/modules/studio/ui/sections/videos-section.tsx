'use client';

import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { InfiniteScroll } from "@/components/infinite-scroll";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { VideoThumbnail } from "@/modules/videos/ui/components/video-thumbnail";
import { formatDuration, snakeCaseToTitle } from "@/lib/utils";
import { format } from "date-fns";
import { Globe2Icon, LockIcon, Eye, MessageCircle, Heart, MoreHorizontal,  Calendar, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export const VideosSection = () => {
  return (
    <div className="bg-background rounded-xl p-6 shadow-sm border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Your Videos</h2>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-border bg-card text-card-foreground hover:bg-accent transition-colors">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>
      
      <Suspense fallback={<VideoSectionSkeleton />}>
        <ErrorBoundary fallback={<div className="text-destructive p-4 rounded-lg bg-destructive/10">Error loading videos</div>}>
          <VideosSectionSuspense />
        </ErrorBoundary>
      </Suspense>
    </div>
  )
}

const VideoSectionSkeleton = () => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-6 w-[510px] py-4">Video</TableHead>
            <TableHead className="py-4">Visibility</TableHead>
            <TableHead className="py-4">Status</TableHead>
            <TableHead className="py-4">Date</TableHead>
            <TableHead className="text-right py-4">Views</TableHead>
            <TableHead className="text-right py-4">Comments</TableHead>
            <TableHead className="text-right pr-6 py-4">Likes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({length:5}).map((_,index) => (
            <TableRow key={index} className="border-t">
              <TableCell className="pl-6 py-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-20 w-36 rounded-lg"/>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <Skeleton className="h-4 w-20"></Skeleton>
              </TableCell>
              <TableCell className="py-4">
                <Skeleton className="h-4 w-16"></Skeleton>
              </TableCell>
              <TableCell className="py-4">
                <Skeleton className="h-4 w-24"></Skeleton>
              </TableCell>
              <TableCell className="text-right py-4">
                <Skeleton className="h-4 w-12 ml-auto"></Skeleton>
              </TableCell>
              <TableCell className="text-right py-4">
                <Skeleton className="h-4 w-12 ml-auto"></Skeleton>
              </TableCell>
              <TableCell className="text-right py-4 pr-6">
                <Skeleton className="h-4 w-12 ml-auto"></Skeleton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export const VideosSectionSuspense = () => {
  const [videos, query] = trpc.studio.getMany.useSuspenseInfiniteQuery({
    limit: DEFAULT_LIMIT,
  }, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  return (
    <div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6 w-[510px] py-4">Video</TableHead>
              <TableHead className="py-4">Visibility</TableHead>
              <TableHead className="py-4">Status</TableHead>
              <TableHead className="py-4">
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>Date</span>
                </div>
              </TableHead>
              <TableHead className="text-right py-4">
                <div className="flex items-center justify-end gap-1">
                  <Eye size={16} />
                  <span>Views</span>
                </div>
              </TableHead>
              <TableHead className="text-right py-4">
                <div className="flex items-center justify-end gap-1">
                  <MessageCircle size={16} />
                  <span>Comments</span>
                </div>
              </TableHead>
              <TableHead className="text-right pr-6 py-4">
                <div className="flex items-center justify-end gap-1">
                  <Heart size={16} />
                  <span>Likes</span>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.pages.flatMap((page) => page.items).map((video) => (
              <Link href={`/studio/videos/${video.id}`} key={video.id} legacyBehavior>
                <TableRow 
                  className={`cursor-pointer transition-all duration-200 border-t ${hoveredRow === video.id ? 'bg-muted/50' : ''}`}
                  onMouseEnter={() => setHoveredRow(video.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative aspect-video w-36 shrink-0 rounded-lg overflow-hidden shadow-sm border">
                        <VideoThumbnail 
                          duration={video.duration || 0} 
                          title={video.title} 
                          imageUrl={video.thumbnailUrl}
                          previewUrl={video.previewUrl} 
                        />
                        {/* <div className="absolute bottom-1 right-1 bg-background/90 px-1.5 py-0.5 rounded text-xs font-medium">
                          {formatDuration(video.duration)}
                        </div> */}
                      </div>
                      <div className='flex flex-col gap-y-1 max-w-sm'>
                        <span className='text-sm font-medium line-clamp-1 truncate'>{video.title}</span>
                        <span className='text-xs text-muted-foreground line-clamp-1 truncate'>{video.description || "No description"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium w-fit ${video.visibility === 'private' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                      {video.visibility === 'private' ?
                        <LockIcon className="size-3.5 mr-1.5" />
                        :
                        <Globe2Icon className="size-3.5 mr-1.5" />
                      }
                      {snakeCaseToTitle(video.visibility)}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full mr-2 ${
                        (video.bunnyStatus === "resolution_finished" || video.bunnyStatus === 'finished') ? 'bg-green-500' : 
                        video.bunnyStatus === 'processing' ? 'bg-amber-500' : 
                        'bg-destructive'
                      }`} />
                      <span className="text-sm">{snakeCaseToTitle(video.bunnyStatus || "Error")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm py-4">
                    {format(new Date(video.createdAt), "d MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right text-sm py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Eye size={14} className="text-muted-foreground" />
                      <span>1.2K</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm py-4">
                    <div className="flex items-center justify-end gap-1">
                      <MessageCircle size={14} className="text-muted-foreground" />
                      <span>42</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm pr-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Heart size={14} className="text-muted-foreground" />
                      <span>23.1K</span>
                      {hoveredRow === video.id && (
                        <button className="ml-2 p-1 rounded-md hover:bg-muted transition-colors">
                          <MoreHorizontal size={16} />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              </Link>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <InfiniteScroll
        isManual
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  );
}
