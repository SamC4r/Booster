import { z } from "zod";
import { db } from "@/db";
import { comments, videoRatings, videos, videoViews } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq, and, or, lt, desc, sql, getTableColumns, avg, count, sum } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getBunnyVideo, statusMap } from "@/lib/bunny";

export const studioRouter = createTRPCRouter({

    getOne: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ input }) => {


            const [video] = await db
                .select({
                    ...getTableColumns(videos),
                    views: sql<number>`(SELECT count(*) FROM ${videoViews} WHERE ${videoViews.videoId} = ${videos.id})`.mapWith(Number),
                })
                .from(videos)
                .where(eq(videos.id, input.id));
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
                         }).where(eq(videos.id, video.id));

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
        })
})    
