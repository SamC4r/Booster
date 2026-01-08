import { CommunityView } from "@/modules/community/ui/views/community-view";
import { HydrateClient } from "@/trpc/server";

export const dynamic = 'force-dynamic'; //IMPORTANT: WE DON'T AWAIT. BUT RATHER WE PREFETCH

interface PageProps {
    params: Promise<{ communityId: string }>;
}


const Page = async ({ params }: PageProps) => {
    const { communityId } = await params; //To get the comm ID in the route. The folder should be called [videoId] the same as the variable name




    return (
        <HydrateClient>
            {/* <VideoView videoId={videoId} /> */}
            <CommunityView communityId={communityId} />
        </HydrateClient>
    );
}

export default Page;
