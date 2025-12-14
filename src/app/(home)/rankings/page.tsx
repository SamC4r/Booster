import { HydrateClient, trpc } from "@/trpc/server";
import { RankingsView } from "@/modules/rankings/ui/views/rankings-view";

export const dynamic = 'force-dynamic';

const Page = async () => {
    void trpc.xp.getTopRanked.prefetch({ limit: 100 });

    return (
        <HydrateClient>
            <RankingsView />
        </HydrateClient>
    );
}

export default Page;
