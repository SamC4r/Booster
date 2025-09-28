// app/videos/[videoId]/page.tsx
import { COMMENT_SECTION_SIZE } from "@/constants";
import { VideoView } from "@/modules/videos/ui/views/video-view";
import { HydrateClient, trpc } from "@/trpc/server"; // <-- server-side proxy + hydrator

type PageProps = {
  params: Promise<{ videoId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { videoId } = await params;

  void trpc.videos.getOne.prefetch({ id: videoId });
  void trpc.comments.getTopLevel.prefetchInfinite({videoId, limit: COMMENT_SECTION_SIZE})
  void trpc.xp.getBoostByVideoId.prefetch({videoId})


  return (
    <HydrateClient>
      <VideoView videoId={videoId} />
    </HydrateClient>
  );
}
