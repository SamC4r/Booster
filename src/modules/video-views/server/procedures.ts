import { db } from "@/db";
import { users, videos, videoViews } from "@/db/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { and, eq, sql } from "drizzle-orm";
import z from "zod";
import { updateVideoScore } from "@/modules/videos/server/utils";



export const videoViewsRouter = createTRPCRouter({

    getAllViewsByUserId: baseProcedure
        .input(z.object({ userId: z.string().uuid() }))
        .query(async ({ input }) => {

            const { userId: creatorId } = input;

            const views = await db
                .select({
                    creatorViews: sql<number>`(SELECT SUM (${videoViews.seen}) WHERE ${videos.userId}=${creatorId})`.mapWith(Number),
                })
                .from(videoViews)
                .leftJoin(videos, eq(videos.id, videoViews.videoId))
                .groupBy(videos.userId)
                .where(eq(videos.userId, creatorId))
                .limit(1)

            return views;
        }),


    //TODO: check for RCE
    create: protectedProcedure
        .input(z.object({ videoId: z.string().uuid() }))
        .mutation(async ({ input, ctx }) => {
            const { id: userId } = ctx.user;
            const { videoId } = input;

            const [createdVideoView] = await db
                .insert(videoViews)
                .values({ userId, videoId })
                .onConflictDoNothing()
                .returning()


            if (!createdVideoView) {
                const [existingVideoView] = await db
                    .select().from(videoViews)
                    .where(and(
                        eq(videoViews.videoId, videoId),
                        eq(videoViews.userId, userId)
                    ))

                if (existingVideoView) {     // only 1 view per user

                    const now = new Date();
                    const last_update = new Date(existingVideoView.updatedAt);
                    const RATE_LIMIT_VIEWS_TIME = 12 * 60 * 60 * 1000; // 12 hour in ms 

                    if (now.getTime() - last_update.getTime() < RATE_LIMIT_VIEWS_TIME) {
                        console.log("rate limited")
                        return {
                            ...existingVideoView,
                            xpEarned: 0,
                            message: "You've already watched this video recently."
                        };
                    } else {
                        const [updatedVideoViews] = await db
                            .update(videoViews)
                            .set({
                                seen: (existingVideoView.seen ?? 0) + 1,
                                updatedAt: now
                            }).where(
                                and(
                                    eq(videoViews.videoId, existingVideoView.videoId),
                                    eq(videoViews.userId, existingVideoView.userId)
                                ))
                            .returning()

                        // Update video view count and score
                        // const [updatedVideo] = await db.update(videos)
                        //     .set({ viewCount: sql`${videos.viewCount} + 1` })
                        //     .where(eq(videos.id, videoId))
                        //     .returning({ isFeatured: videos.isFeatured });
                        //
                        // await updateVideoScore(videoId);
                        //
                        // let result = { xpEarned: 0, message: undefined as string | undefined };
                        // if (updatedVideo?.isFeatured) {
                        //     result = await awardXpForView(userId);
                        // }

                        return {
                            ...updatedVideoViews,
                            // xpEarned: result.xpEarned,
                            // message: result.message
                        };
                    }
                    // return existingVideoView;
                }
            }

            // Update video view count and score
            // const [updatedVideo] = await db.update(videos)
            //     .set({ viewCount: sql`${videos.viewCount} + 1` })
            //     .where(eq(videos.id, videoId))
            //     .returning({ isFeatured: videos.isFeatured });
            //
            // await updateVideoScore(videoId);
            //
            // let result = { xpEarned: 0, message: undefined as string | undefined };
            // if (updatedVideo?.isFeatured) {
            //     result = await awardXpForView(userId);
            // }

            return {
                ...createdVideoView,
                // xpEarned: result.xpEarned,
                // message: result.message
            }
        })
})
