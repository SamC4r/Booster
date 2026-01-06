import { z } from "zod";
import { db } from "@/db";
import { comments, videoRatings, videos, videoViews, users } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq, and, or, lt, desc, sql, getTableColumns, avg, count, sum } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getBunnyVideo, statusMap, createBunnyVideo, uploadBunnyVideoStream } from "@/lib/bunny";
import { google } from "googleapis";
import { oauth2Client } from "@/lib/youtube";
import { Readable } from "stream";
import YTDlpWrap from 'yt-dlp-wrap';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { uploadRateLimit } from "@/lib/ratelimit";

export const studioRouter = createTRPCRouter({

    getOne: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ input, ctx }) => {
            const userId = ctx.user.id;


            const [video] = await db
                .select({
                    ...getTableColumns(videos),
                    views: sql<number>`(SELECT count(*) FROM ${videoViews} WHERE ${videoViews.videoId} = ${videos.id})`.mapWith(Number),
                })
                .from(videos)
                .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));
            
            if (!video) {
                throw new TRPCError({ code: "NOT_FOUND" })
            }

            // Sync with Bunny if processing
            if (video.bunnyVideoId && video.bunnyLibraryId && 
               (video.bunnyStatus === 'processing' || video.bunnyStatus === 'uploaded' || video.bunnyStatus === 'queued' || video.bunnyStatus === 'encoding')) {
                try {
                    const bunnyData = await getBunnyVideo(video.bunnyLibraryId, video.bunnyVideoId);
                    const rawStatus = String(bunnyData.status);
                    const newStatus = statusMap.get(rawStatus) || 'processing';
                    
                    if (newStatus !== video.bunnyStatus) {
                         const dbStatus = rawStatus === '3' ? 'completed' : 'processing';
                         const duration = bunnyData.length ? Math.round(bunnyData.length) : video.duration;
                         
                         let thumbnailUrl = video.thumbnailUrl;
                         let thumbnailKey = video.thumbnailKey;
                         
                         if (rawStatus === '3' && bunnyData.thumbnailFileName) {
                             const host = process.env.BUNNY_PULLZONE_HOST!;
                             thumbnailKey = `/${video.bunnyVideoId}/${bunnyData.thumbnailFileName}`;
                             thumbnailUrl = `https://${host}${thumbnailKey}`;
                         }

                         await db.update(videos).set({
                             bunnyStatus: newStatus,
                             status: dbStatus,
                             duration: duration,
                             thumbnailUrl: thumbnailUrl,
                             thumbnailKey: thumbnailKey
                         }).where(and(eq(videos.userId, userId),eq(videos.id, video.id)));

                         return {
                             ...video,
                             bunnyStatus: newStatus,
                             status: dbStatus,
                             duration: duration,
                             thumbnailUrl: thumbnailUrl,
                             thumbnailKey: thumbnailKey
                         };
                    }
                } catch (error) {
                    console.error("Failed to sync with Bunny:", error);
                }
            }

            return video;
        }),

    getMany: protectedProcedure
        .input(
            z.object({
                cursor: z.object({
                    id: z.string().uuid(),
                    updatedAt: z.date(),
                }).nullish(),
                limit: z.number().min(1).max(100),
            })
        )
        .query(async ({ ctx, input }) => {
            const { cursor, limit } = input;
            const { id: userId } = ctx.user; //rename id to userId

            const data = await db.select({
                ...getTableColumns(videos),
                videoViews: sql<number>`(SELECT count(*) FROM ${videoViews} WHERE ${videoViews.videoId} = ${videos.id})`.mapWith(Number),
                videoRatings: videos.averageRating,
                videoComments: videos.commentCount,
            }).from(videos)
                .where(
                    and(
                        eq(videos.userId, userId),
                        cursor ?
                            or(
                                lt(videos.updatedAt, cursor.updatedAt)
                                , and(
                                    eq(videos.updatedAt, cursor.updatedAt),
                                    lt(videos.id, cursor.id)
                                ))
                            : undefined)).
                orderBy(desc(videos.updatedAt), desc(videos.id))
                .limit(limit + 1); //ad 1 to limit to check if there's more data

            const hasMore = data.length > limit;
            //remove last item if hasMore
            const items = hasMore ? data.slice(0, -1) : data;

            const lastItem = items[items.length - 1];
            const nextCursor = hasMore ?
                {
                    id: lastItem.id,
                    updatedAt: lastItem.updatedAt,
                } : null;

            return {
                items,
                nextCursor,
            }
        }),

    syncYouTube: protectedProcedure
        .mutation(async ({ ctx }) => {
            const { id: userId } = ctx.user;
            // Re-fetch user to get tokens
            const [user] = await db.select().from(users).where(eq(users.id, userId));

            if (!user || !user.youtubeAccessToken || !user.youtubeRefreshToken) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "YouTube not connected" });
            }

            oauth2Client.setCredentials({
                access_token: user.youtubeAccessToken,
                refresh_token: user.youtubeRefreshToken,
                expiry_date: user.youtubeTokenExpiry?.getTime(),
            });

            // Refresh token if needed
            if (user.youtubeTokenExpiry && user.youtubeTokenExpiry < new Date()) {
                const { credentials } = await oauth2Client.refreshAccessToken();
                await db.update(users).set({
                    youtubeAccessToken: credentials.access_token,
                    youtubeRefreshToken: credentials.refresh_token,
                    youtubeTokenExpiry: new Date(credentials.expiry_date!),
                }).where(eq(users.id, userId));
                oauth2Client.setCredentials(credentials);
            }

            const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
            
            // Get Uploads Playlist ID
            const channels = await youtube.channels.list({ mine: true, part: ['contentDetails'] });
            const uploadsPlaylistId = channels.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

            if (!uploadsPlaylistId) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Uploads playlist not found" });
            }

            // Get Videos (Limit to 5 to avoid timeouts)
            const playlistItems = await youtube.playlistItems.list({
                playlistId: uploadsPlaylistId,
                part: ['snippet', 'contentDetails'],
                maxResults: 5, 
            });

            // Fetch video details to get duration
            const videoIds = playlistItems.data.items?.map(item => item.contentDetails?.videoId).filter((id): id is string => !!id) || [];
            const videoDetailsMap = new Map<string, any>();
            
            if (videoIds.length > 0) {
                const videosResponse = await youtube.videos.list({
                    id: videoIds,
                    part: ['contentDetails'],
                });
                if (videosResponse.data.items) {
                    videosResponse.data.items.forEach(v => {
                        if (v.id) videoDetailsMap.set(v.id, v);
                    });
                }
            }

            let syncedCount = 0;

            for (const item of playlistItems.data.items || []) {
                const videoId = item.contentDetails?.videoId;
                const title = item.snippet?.title;
                const description = item.snippet?.description;
                const thumbnailUrl = item.snippet?.thumbnails?.high?.url;

                if (!videoId || !title) continue;

                // Check duration
                const videoDetail = videoDetailsMap.get(videoId);
                const durationIso = videoDetail?.contentDetails?.duration;
                const durationSeconds = parseISO8601Duration(durationIso);

                if (durationSeconds > 600) { // 10 minutes
                    console.log(`Skipping video "${title}" (${videoId}): Duration ${durationSeconds}s > 600s`);
                    continue;
                }

                // Check if already synced
                const [existing] = await db.select().from(videos).where(eq(videos.youtubeVideoId, videoId));
                if (existing) continue;

                const { success } = await uploadRateLimit.limit(userId);
                if (!success) {
                    console.log(`Rate limit reached for user ${userId}`);
                    break;
                }

                try {
                    console.log(`Starting sync for video: ${title} (${videoId})`);
                    
                    // 1. Create placeholder in Bunny
                    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
                    if (!libraryId) throw new Error("BUNNY_STREAM_LIBRARY_ID is not set");
                    
                    const bunnyVideo = await createBunnyVideo(libraryId, title);
                    console.log(`Created Bunny video: ${bunnyVideo.guid}`);
                    
                    // 2. Get Video Stream from YouTube
                    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                    console.log(`Fetching stream from: ${videoUrl}`);
                    
                    // Use yt-dlp-wrap for robust downloading
                    const ytDlpBinaryPath = path.join(process.cwd(), 'yt-dlp.exe');
                    
                    // Ensure binary exists (simple check for dev environment)
                    if (!fs.existsSync(ytDlpBinaryPath)) {
                        console.log("Downloading yt-dlp binary...");
                        await YTDlpWrap.downloadFromGithub(ytDlpBinaryPath);
                    }
                    
                    const ytDlpWrap = new YTDlpWrap(ytDlpBinaryPath);
                    
                    // Download to temp file to avoid stream timeouts
                    const tempFilePath = path.join(os.tmpdir(), `${videoId}.mp4`);
                    console.log(`Downloading to temp file: ${tempFilePath}`);
                    
                    try {
                        await ytDlpWrap.execPromise([videoUrl, '-f', 'best[ext=mp4]/best', '-o', tempFilePath]);
                    } catch (err) {
                        console.error("yt-dlp download failed:", err);
                        throw err;
                    }

                    // 3. Upload to Bunny
                    console.log(`Uploading to Bunny...`);
                    const fileStream = fs.createReadStream(tempFilePath);
                    const webStream = Readable.toWeb(fileStream) as ReadableStream;
                    
                    await uploadBunnyVideoStream(libraryId, bunnyVideo.guid, webStream);
                    console.log(`Upload complete.`);
                    
                    // Cleanup
                    try {
                        fs.unlinkSync(tempFilePath);
                    } catch (e) {
                        console.error("Failed to cleanup temp file:", e);
                    }

                    // 4. Save to DB
                    console.log(`Saving to DB...`);
                    await db.insert(videos).values({
                        userId,
                        title,
                        description: description || "",
                        visibility: 'private',
                        status: 'processing',
                        bunnyVideoId: bunnyVideo.guid,
                        bunnyLibraryId: libraryId,
                        bunnyStatus: 'queued',
                        youtubeVideoId: videoId,
                        thumbnailUrl: thumbnailUrl,
                        s3Name: "",
                    });
                    console.log(`Saved to DB.`);

                    syncedCount++;
                } catch (e) {
                    console.error(`Failed to sync video ${videoId}:`, e);
                    // Continue to next video
                }
            }

            return { synced: syncedCount };
        })
});

function parseISO8601Duration(duration: string | null | undefined): number {
    if (!duration) return 0;
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;
    
    const hours = (parseInt(match[1] || '0') || 0);
    const minutes = (parseInt(match[2] || '0') || 0);
    const seconds = (parseInt(match[3] || '0') || 0);
    
    return hours * 3600 + minutes * 60 + seconds;
}
    
