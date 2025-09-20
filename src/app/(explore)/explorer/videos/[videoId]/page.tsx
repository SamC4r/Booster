// app/videos/[videoId]/page.tsx
import { COMMENT_SECTION_SIZE } from "@/constants";
import { VideoView } from "@/modules/videos/ui/views/video-view";
import { HydrateClient, trpc } from "@/trpc/server"; // <-- server-side proxy + hydrator

type PageProps = {
  params: { videoId: string };
};

export default async function Page({ params }: PageProps) {
  const { videoId } = params;

  void trpc.videos.getOne.prefetch({ id: videoId });
  void trpc.comments.getTopLevel.prefetchInfinite({videoId, limit: COMMENT_SECTION_SIZE})

  return (
    <HydrateClient>
      <VideoView videoId={videoId} />
    </HydrateClient>
  );
}
