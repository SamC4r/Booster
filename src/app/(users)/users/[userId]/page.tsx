import { VideoView } from "@/modules/studio/ui/views/video-views";
import { UsersView } from "@/modules/users/views/users-view";
import { HydrateClient, trpc } from "@/trpc/server";

export const dynamic = 'force-dynamic'; //IMPORTANT: WE DON'T AWAIT. BUT RATHER WE PREFETCH

interface PageProps {
    params: Promise<{ userId: string }>;
}


const Page = async ({ params }: PageProps) => {
    const { userId } = await params; //To get the video ID in the route. The folder should be called [videoId] the same as the variable name

    // TODO: create a separate prefetch to get videos from user to parallelize things
    void trpc.users.getByUserId.prefetch({ userId});
    void trpc.users.getVideosByUserId.prefetch({ userId});
    void trpc.xp.getXpByUserId.prefetch({userId})
    void trpc.follows.getFollowersByUserId.prefetch({userId})
    void trpc.videoViews.getAllViewsByUserId.prefetch({userId})


    return (
        <HydrateClient>
            {/* <VideoView videoId={videoId} /> */}
            <UsersView userId={userId} />

        </HydrateClient>
    );
}

export default Page;
