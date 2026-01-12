// app/api/bunny/create/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { uploadRateLimit } from "@/lib/ratelimit";
import { db } from "@/db";
import { users, videos } from "@/db/schema";
import { inArray } from "drizzle-orm";

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId;

  const [user] = await db
    .select()
    .from(users)
    .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : [])); //trick

  if (user) {
    userId = user.id;
  }

  if(!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await uploadRateLimit.limit(userId);
  if (!success) {
    return NextResponse.json(
      { error: "Daily upload limit reached (5 uploads per day)" },
      { status: 429 }
    );
  }

  const { title } = await req.json();
  const lib = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID!;
  const r = await fetch(`https://video.bunnycdn.com/library/${lib}/videos`, {
    method: "POST",
    headers: {
      AccessKey: process.env.BUNNY_STREAM_API_KEY!,
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ title }),
  });
  if (!r.ok)
    return NextResponse.json({ error: await r.text() }, { status: r.status });
  const json = await r.json(); //video id is on guid



  return NextResponse.json(json);
}
