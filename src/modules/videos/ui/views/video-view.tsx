import { CommentsSection } from "../sections/comments-section";
import { SuggestionsSection } from "../sections/suggestions-section";
import { VideoSection } from "../sections/video-section";

interface VideoViewProps {
    videoId: string;
}

export const VideoView = ({ videoId }: VideoViewProps) => {
    return (
        // max w here limits max zoom out
        <div className="flex flex-col max-w-[1700px] mx-auto pt-3.5 px-4 mb-10">
            <div className="flex flex-col xl:flex-row xl:items-start gap-6">
                <div className="flex-1 min-w-0 min-h-screen">
                    <VideoSection videoId={videoId} />
                    <SuggestionsSection videoId={videoId} />
                    <div className="xl:hidden block mt-4 sm:overflow-auto">
                        <CommentsSection videoId={videoId}  openComments/>
                    </div>
                </div>
                <div className="hidden xl:block w-full xl:w-[460px] 2xl:w-[460px] shrink
+                 xl:sticky xl:top-4 xl:self-start xl:h-fit xl:z-20">
                    <CommentsSection videoId={videoId} openComments/>
                </div>
            </div>
        </div>
    )
}
