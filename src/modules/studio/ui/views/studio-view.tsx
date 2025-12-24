import { VideosSection } from "../sections/videos-section";
import { SyncYouTubeButton } from "../components/sync-youtube-button";

export const StudioView = () => {
    return (
        <div className="flex flex-col gap-y-6 pt-2.5">
            <div className="px-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Channel content</h1>
                    <p className="text-sm text-muted-foreground">Manage your channel content and videos</p>
                </div>
                {/* <SyncYouTubeButton /> */}
            </div>
            <VideosSection />
        </div>
    );
}
