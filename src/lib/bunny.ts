
export const statusMap = new Map<string, string>([
  ["0", "queued"],
  ["1", "processing"],
  ["2", "encoding"],
  ["3", "finished"],
  ["4", "resolution_finished"],
  ["5", "failed"],
]);

export async function getBunnyVideo(libraryId: string, videoId: string) {
  const r = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
    {
      headers: {
        Accept: "application/json",
        AccessKey: process.env.BUNNY_STREAM_API_KEY!,
      },
      cache: "no-store",
    }
  );
  if (!r.ok) throw new Error(`GetVideo failed: ${r.status} ${await r.text()}`);
  return r.json() as Promise<{
    guid: string;
    title?: string;
    length?: number;
    status?: number; // Bunny returns number
    thumbnailFileName?: string;
  }>;
}

export async function deleteBunnyVideo(libraryId: string, videoId: string) {
  const r = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        AccessKey: process.env.BUNNY_STREAM_API_KEY!,
      },
    }
  );
  if (!r.ok) throw new Error(`DeleteVideo failed: ${r.status} ${await r.text()}`);
  return r.json();
}
