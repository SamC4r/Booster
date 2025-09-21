import { useMemo } from "react";
import { VideoGetOneOutput } from "../../types";
import { VideoDescription } from "./video-description";
import { VideoMenu } from "./video-menu";
import { VideoOwner } from "./video-owner";
import { VideoReactions } from "./video-reactions";

import { format, formatDistanceToNow } from "date-fns"
import { VideoViews } from "./video-views";
import { trpc } from "@/trpc/server";

interface Props {
    video: VideoGetOneOutput;
    onRate: (value: number) => boolean;
}

export const VideoTopRow = ({ video, onRate,}: Props) => {

    const compactViews = useMemo(() => {
        return Intl.NumberFormat("en", {
            notation: "compact"
        }).format(video.videoViews)
    }, [video.videoViews])
    const expandedViews = useMemo(() => {
        return Intl.NumberFormat("en", {
            notation: "standard"
        }).format(video.videoViews)
    }, [video.videoViews])

    //dont run functions directly when passing props to videodescription
    const compactDate = useMemo(() => {
        return formatDistanceToNow(video.createdAt, { addSuffix: true })
    }, [video.createdAt])
    const expandedDate = useMemo(() => {
        return format(video.createdAt, "d MMM yyyy")
    }, [video.createdAt])


    return (
        <div className="flex flex-col gap-3 mt-4">
            <div className="flex  flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 z-30">
                <h1 className="text-xl sm:text-2xl font-semibold break-words flex-1 min-w-0">{video.title}</h1>
                <VideoViews compactViews={compactViews} expandedViews={expandedViews} />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between z-30 min-w-0 gap-y-2">
                <div className="min-w-0 flex-1 max-w-lg overflow-hidden order-2 sm:order-1">
                    <VideoOwner user={video.user} videoId={video.id} />
                </div>
                
                <div className="flex flex-row items-center justify-between sm:justify-end sm:min-w-[180px] gap-2 order-1 sm:order-2">
                    <VideoReactions 
                        onRate={onRate} 
                        viewerRating={video.user.viewerRating}
                        avgRating={video.averageRating} 
                        videoRatings={video.videoRatings} 
                    />
                    <VideoMenu videoId={video.id} variant="secondary" />
                </div>
            </div>

            <div className="mt-2 sm:mt-4 order-3">
                <VideoDescription
                    compactViews={compactViews}
                    expandedViews={expandedViews}
                    compactDate={compactDate}
                    expandedDate={expandedDate}
                    description={video.description}
                />
            </div>
        </div>
    )
}