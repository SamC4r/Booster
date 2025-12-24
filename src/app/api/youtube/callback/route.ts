import { oauth2Client } from "@/lib/youtube";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { google } from "googleapis";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) return new Response("Missing code", { status: 400 });

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  const channels = await youtube.channels.list({ mine: true, part: ['id'] });
  const channelId = channels.data.items?.[0]?.id;

  await db.update(users).set({
    youtubeAccessToken: tokens.access_token,
    youtubeRefreshToken: tokens.refresh_token,
    youtubeTokenExpiry: new Date(tokens.expiry_date!),
    youtubeChannelId: channelId
  }).where(eq(users.clerkId, userId));

  redirect("/studio");
}
