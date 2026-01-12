// /app/api/bunny/sign/route.ts
import { db } from "@/db";
import { users, videos } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { videoId } = (await req.json()) as { videoId: string };
  if (!videoId) return new Response("Missing videoId", { status: 400 });

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return new Response("Unauthorized", { status: 401 });

  let userId;

  const [user] = await db
    .select()
    .from(users)
    .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : [])); //trick

  if (user) {
    userId = user.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  //verify ownership of the video by the logged in user
  // const video = await db.query.videos.findFirst({
  //   where: and(eq(videos.bunnyVideoId, videoId), eq(videos.userId, userId)),
  // });

  // if (!video) return new Response("Forbidden", { status: 403 });

  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID!;
  const apiKey = process.env.BUNNY_STREAM_API_KEY!;

  const expires = Math.floor(Date.now() / 1000) + 10 * 60; // 10 minutes por poner algo xD
  const payload = `${libraryId}${apiKey}${expires}${videoId}`;
  const signature = crypto.createHash("sha256").update(payload).digest("hex");

  return Response.json({
    libraryId,
    videoId,
    expires,
    signature,
  });
}
