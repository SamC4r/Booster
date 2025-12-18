 import { db } from "@/db";
import { users, videos, videoViews } from "@/db/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { and, eq, sql } from "drizzle-orm";
import z from "zod";
import { updateVideoScore } from "@/modules/videos/server/utils";

async function awardXpForView(userId: string) {
    console.log("Awarding XP for user:", userId);
    const [user] = await db
        .select({
            dailyWatchCount: users.dailyWatchCount,
            lastDailyXpReset: users.lastDailyXpReset,
            xp: users.xp,
        })
        .from(users)
        .where(eq(users.id, userId));

    if (!user) {
        console.log("User not found for XP award");
        return { xpEarned: 0, message: "User not found" };
    }

    const now = new Date();
    const lastReset = new Date(user.lastDailyXpReset);
    
    const isSameDay = now.getDate() === lastReset.getDate() && 
                      now.getMonth() === lastReset.getMonth() && 
                      now.getFullYear() === lastReset.getFullYear();
    
    console.log("XP Check - Is Same Day:", isSameDay, "Last Reset:", lastReset, "Now:", now);

    const currentDailyCount = isSameDay ? user.dailyWatchCount : 0;
    console.log("Current Daily Count:", currentDailyCount);
    
    let xpToAward = 0;
    let message = undefined;

    if (currentDailyCount < 5) {
        xpToAward = 20;
    } else if (currentDailyCount === 5) {
        xpToAward = 15;
    } else if (currentDailyCount === 6) {
        xpToAward = 10;
    } else if (currentDailyCount === 7) {
        xpToAward = 5;
    } else {
        xpToAward = 0;
        message = "Daily XP limit reached for watching videos.";
    }

    console.log("XP to award:", xpToAward);

    if (xpToAward > 0 || !isSameDay) {
         await db.update(users).set({
            xp: (user.xp || 0) + xpToAward,
            dailyWatchCount: currentDailyCount + 1,
            lastDailyXpReset: now,
        }).where(eq(users.id, userId));
        console.log("User XP updated");
    } else {
        // Still need to increment count if it's 0 xp but same day? 
        // The requirement says "After 5XP no longer XP should be given."
        // But we should probably still track the count so they don't get XP later in the same day if they watch more.
        // Yes, we must increment dailyWatchCount even if xpToAward is 0, to maintain the "no more XP" state.
        await db.update(users).set({
            dailyWatchCount: currentDailyCount + 1,
            lastDailyXpReset: now,
        }).where(eq(users.id, userId));
        console.log("User watch count updated (no XP)");
    }

    return { xpEarned: xpToAward, message };
}

export const videoViewsRouter = createTRPCRouter({

    getAllViewsByUserId: baseProcedure
    .input(z.object({userId:z.string().uuid()}))
    .query(async ({input}) => {

        const {userId: creatorId} = input;

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
    .input(z.object({videoId:z.string().uuid()}))
    .mutation(async ({input,ctx}) => {
        const {id:userId} = ctx.user;
        const {videoId} = input;

        const [createdVideoView] = await db
            .insert(videoViews)
            .values({ userId, videoId })
            .onConflictDoNothing()
            .returning()

        if(!createdVideoView){
            const [existingVideoView] = await db
                .select().from(videoViews)
                .where(and(
                    eq(videoViews.videoId, videoId),
                    eq(videoViews.userId, userId)
                ))

            if (existingVideoView) {     // only 1 view per user

                const now = new Date();
                const last_update = new Date(existingVideoView.updatedAt);
                const RATE_LIMIT_VIEWS_TIME = 1 * 60 * 60 * 1000; // 1 hour in ms 

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
                    const [updatedVideo] = await db.update(videos)
                        .set({ viewCount: sql`${videos.viewCount} + 1` })
                        .where(eq(videos.id, videoId))
                        .returning({ isFeatured: videos.isFeatured });

                    await updateVideoScore(videoId);

                    let result = { xpEarned: 0, message: undefined as string | undefined };
                    if (updatedVideo?.isFeatured) {
                        result = await awardXpForView(userId);
                    }

                    return {
                        ...updatedVideoViews,
                        xpEarned: result.xpEarned,
                        message: result.message
                    };
                }
                // return existingVideoView;
            }
        }
        
        // Update video view count and score
        const [updatedVideo] = await db.update(videos)
            .set({ viewCount: sql`${videos.viewCount} + 1` })
            .where(eq(videos.id, videoId))
            .returning({ isFeatured: videos.isFeatured });

        await updateVideoScore(videoId);

        let result = { xpEarned: 0, message: undefined as string | undefined };
        if (updatedVideo?.isFeatured) {
            result = await awardXpForView(userId);
        }

      return {
        ...createdVideoView,
        xpEarned: result.xpEarned,
        message: result.message
      }
    })
})