// app/api/bunny/upload/route.ts
// PUT /api/bunny/upload?videoId=GUID
export const runtime = 'nodejs'; // ensure Node, not Edge

export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");
  if (!videoId) return new Response("Missing videoId", { status: 400 });

  const r = await fetch(
    `https://video.bunnycdn.com/library/${process.env.BUNNY_STREAM_LIBRARY_ID}/${"videos"}/${videoId}`,
    {
      method: "PUT",
      headers: {
        "AccessKey": process.env.BUNNY_STREAM_API_KEY!,
        "accept": "application/json",
      },
      body: req.body, 
      duplex:"half",
    } as any
  );
  if (!r.ok) return new Response(await r.text(), { status: r.status });

//   const newVideo = 

  return new Response("ok");
}
