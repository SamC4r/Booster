// app/api/bunny/create/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { title } = await req.json();
  const lib = process.env.BUNNY_STREAM_LIBRARY_ID!;
  const r = await fetch(`https://video.bunnycdn.com/library/${lib}/videos`, {
    method: "POST",
    headers: {
      "AccessKey": process.env.BUNNY_STREAM_API_KEY!,
      "accept": "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ title }),
  });
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: r.status });
  const json = await r.json(); //video id is on guid
  return NextResponse.json(json);
}
