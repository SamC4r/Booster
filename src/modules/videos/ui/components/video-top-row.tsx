import { useMemo } from "react";
import { VideoGetOneOutput } from "../../types";
import { VideoMenu } from "./video-menu";

import { VideoViews } from "./video-views";

interface Props {
    video: VideoGetOneOutput;
}

export const VideoTopRow = ({ video }: Props) => {

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

    return (
        <div className="flex flex-col gap-3 mt-4">
            <div className="flex flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 z-30">
                <h1 className="text-xl sm:text-2xl font-semibold break-words flex-1 min-w-0">{video.title}</h1>
                <VideoViews compactViews={compactViews} expandedViews={expandedViews} />
            </div>

            <div className="flex lg:items-start justify-end z-30 min-w-0 gap-10">
                {/* <div className="min-w-0 overflow-hidden order-2 ">
                    <VideoOwner user={video.user} videoId={video.id}  />
                </div> */}
                {/* <div className="mt-2 sm:mt-4 w-full ">
                    <VideoDescription
                        compactViews={compactViews}
                        expandedViews={expandedViews}
                        compactDate={compactDate}
                        expandedDate={expandedDate}
                        description={video.description}
                    />
                </div> */}
                <div className="flex flex-row md:items-start justify-between sm:justify-end sm:min-w-[180px] gap-2 ">
                    {/* <VideoReactions
                        onRate={onRate}
                        viewerRating={video.user.viewerRating}
                        avgRating={video.averageRating}
                        videoRatings={video.videoRatings}
                    /> */}
                    <VideoMenu videoId={video.id} variant="secondary" />
                </div>


            </div>
        </div>
    )
}