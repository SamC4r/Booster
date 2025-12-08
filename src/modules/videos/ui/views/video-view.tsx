import { VideoSection } from "../sections/video-section";
import { VideoCreator } from "../components/video-creator";
import { SectionSelector } from "../components/section-selector";

interface VideoViewProps {
    videoId: string;
}

export const VideoView = ({ videoId }: VideoViewProps) => {


    return (
        <div className="h-[calc(100vh-4rem)] overflow-hidden w-full">
            {/* Main Video Content - Constrained Layout */}
            <div className="flex flex-col mx-auto pt-3.5 px-4 h-full w-full">
                <div className="flex flex-col xl:flex-row gap-6 md:ml-3 h-full">
                    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                        <div className="shrink-0">
                            <VideoSection videoId={videoId} />
                        </div>
                        {/* On mobile show selector in the area previously occupied by comments */}
                        <div className="xl:hidden flex-1 mt-4 overflow-hidden min-h-0 relative">
                            <SectionSelector videoId={videoId} />
                        </div>
                    </div>
                   <div className="hidden xl:flex w-[26%] xl:z-20 flex-col h-full overflow-hidden pb-4">
                        <div className="shrink-0 mb-6 ">
                            <VideoCreator videoId={videoId} />
                        </div>
     
                        <div className="flex-1 min-h-0 relative flex flex-col">
                            <SectionSelector videoId={videoId} />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Suggestions Section - Full Width, breaks out of layout */}
            {/* <div className="md:ml-16">
                <SuggestionsSection videoId={videoId} />
            </div> */}
        </div>
    )
}
