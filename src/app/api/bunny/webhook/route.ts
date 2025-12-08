// // app/api/bunny/webhooks/route.ts
export const runtime = "nodejs";

import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import Sightengine from "sightengine";

const statusMap = new Map<string, string>([
  ["0", "queued"],
  ["1", "processing"],
  ["2", "encoding"],
  ["3", "finished"],
  ["4", "resolution_finished"],
  ["5", "failed"],
]);

/**
 * Builds a CDN URL for a given path. We store both keys and plain URLs.
 */
function cdnUrl(path: string) {
  const host = process.env.BUNNY_PULLZONE_HOST!;
  return `https://${host}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Fetch video details from Bunny (to get thumbnail file name, length, etc.) */
async function getBunnyVideo(libraryId: string, videoId: string) {
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
    status?: string;
    thumbnailFileName?: string;
  }>;
}

export async function POST(req: Request) {
  // Bunny sends JSON when a video status changes.
  const payload = await req.json().catch(() => ({} as any));

  // Be defensive with field names across accounts/templates
  const libraryId = String(
    payload.VideoLibraryId ??
      payload.LibraryId ??
      process.env.BUNNY_STREAM_LIBRARY_ID ??
      ""
  );
  const videoId = String(
    payload.VideoGuid ?? payload.Guid ?? payload.VideoId ?? ""
  );
  const rawStatus = String(
    payload.Status ?? payload.status ?? ""
  ).toLowerCase();

  if (!videoId || !libraryId) {
    return new Response("Missing video/library id", { status: 400 });
  }

  // Only act when the video is processed/ready

  try {
    console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    // Ask Bunny which thumbnail file they generated
    const meta = await getBunnyVideo(libraryId, videoId); // fields documented in Get Video API
    const thumbnailFile = meta.thumbnailFileName || "thumbnail.jpg"; // fallback
    const durationSec =
      Number.isFinite(meta.length) && (meta.length as number) > 0
        ? Math.round(meta.length!)
        : null;

    console.log(durationSec, meta.length);

    // Build keys (stable) + plain URLs (convenience)
    const previewKey = `/${videoId}/preview.webp`; // always present after processing
    const thumbKey = `/${videoId}/${thumbnailFile}`;

    console.log("THUMBNAIL URL", thumbKey);

    const previewUrl = cdnUrl(previewKey);
    const thumbnailUrl = cdnUrl(thumbKey);

    const status = statusMap.get(rawStatus);
    console.log("THUMBNAIL URL", thumbnailUrl);
    await db
      .update(videos)
      .set({
        bunnyStatus: status,
        bunnyDuration: durationSec ?? null,
        duration: durationSec ?? undefined,
        thumbnailKey: thumbKey,
        thumbnailUrl, // store for convenience (unsigned)
        previewKey,
        previewUrl, // store for convenience (unsigned)
        updatedAt: new Date(),
        status: "completed",
      })
      .where(eq(videos.bunnyVideoId, videoId));

    //MODERATION CHECK

    // if you haven't already, install the SDK with "npm install sightengine --save"
    const videoUrl = `https://vz-cd04a7d4-494.b-cdn.net/${videoId}/play_360p.mp4`
    const client = Sightengine(process.env.SIGHTENGINE_API_USER as string, process.env.SIGHTENGINE_API_SECRET as string);
    client
      .check(["nudity-2.1", "violence","self-harm"])
      .video_sync(videoUrl)
      .then(function (result: string) {
        // The API response (result)
        console.log(result);
      })
      .catch(function (err: string) {
        // Handle error
        console.error(err);
      });

    return new Response("ok");
  } catch (err: any) {
    console.error("Bunny webhook error:", err);
    return new Response(`Error: ${err?.message ?? "unknown"}`, { status: 500 });
  }
}
