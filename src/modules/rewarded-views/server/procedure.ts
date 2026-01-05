import { db } from "@/db";
import { rewardedView,  users,  videos } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, sql, desc } from "drizzle-orm";
import z from "zod";

// Helper type for transaction
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const awardXp = async (tx: Tx, userId: string) => {
    
    //select all rewardedViews that have been updated in the past 20 hours.
    const RATE_LIMIT_REWARDS_TIME = 20 * 60 * 60 * 1000; // 20h
    const since = new Date(Date.now() - RATE_LIMIT_REWARDS_TIME);

    const [{ count }] = await tx
    .select({ count: sql<number>`count(*)` })
    .from(rewardedView)
    .where(and(
        eq(rewardedView.userId, userId),
        gte(rewardedView.updatedAt, since),
    ));

    const currentDailyCount = Number(count);

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

    return { xpToAward: xpToAward, message };
}

const updateUserXp = async (tx: Tx, userId: string, xpToAward: number) => {
    await tx
    .update(users)
    .set({ xp: sql<number>`(${users.xp} + ${xpToAward})` })
    .where(eq(users.id, userId));
}

export const rewardedViewsRouter = createTRPCRouter({

    awardXpForView: protectedProcedure
    .input(
        z.object({ videoId: z.string() })
    )
    .mutation(async ({ctx, input }) => {
        const {videoId} = input;
        const {id:userId} = ctx.user;

        return await db.transaction(async (tx) => {
          // Lock the user to prevent race conditions
          // This ensures that only one request per user is processed at a time. If users B tries to execute, he will wait => atomic
          
          
          await tx
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .for("update");

          //bot love prevention xd
          const [lastReward] = await tx
            .select({ updatedAt: rewardedView.updatedAt })
            .from(rewardedView)
            .where(eq(rewardedView.userId, userId))
            .orderBy(desc(rewardedView.updatedAt))
            .limit(1);

          if (lastReward) {
            const timeSinceLastReward =
              Date.now() - lastReward.updatedAt.getTime();
            const MIN_WATCH_TIME = 10 * 1000; // 10 seconds
            if (timeSinceLastReward < MIN_WATCH_TIME) {
              throw new TRPCError({
                code: "TOO_MANY_REQUESTS",
                message: "You are watching videos too fast.",
              });
            }
          }

          const [video] = await tx
            .select({
              isFeatured: videos.isFeatured,
              visibility: videos.visibility,
              userId: videos.userId,
            })
            .from(videos)
            .where(eq(videos.id, videoId))
            .limit(1);

          if (!video?.isFeatured || video?.visibility !== "public") {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Can't reward xp on this video",
            });
          }

          if (video.userId === userId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You cannot earn XP from your own videos",
            });
          }

          const [rewardedViewRow] = await tx
            .select()
            .from(rewardedView)
            .where(
              and(
                eq(rewardedView.videoId, videoId),
                eq(rewardedView.userId, userId)
              )
            );

          if (!rewardedViewRow) {
            //insert

            const { xpToAward } = await awardXp(tx, userId);

            await tx
              .insert(rewardedView)
              .values({
                userId: userId,
                videoId: videoId,
                xpEarned: xpToAward,
              })
              .returning();

            //update user XP
            await updateUserXp(tx, userId, xpToAward);

            return {
              xpEarned: xpToAward,
              message: `You've earned ${xpToAward} XP for watching this featured video`,
            };
          } else {
            //update
            const now = new Date();
            const last_update = new Date(rewardedViewRow.updatedAt);
            const RATE_LIMIT_REWARDS_TIME = 20 * 60 * 60 * 1000; // 20 hour in ms

            if (
              now.getTime() - last_update.getTime() <
              RATE_LIMIT_REWARDS_TIME
            ) {
              return {
                message:
                  "You've already earned rewards for this video recently.",
                xpEarned: 0,
              };
            }

            const { xpToAward } = await awardXp(tx, userId);

            //After 20 hours reward again.
            await tx
              .update(rewardedView)
              .set({
                xpEarned: xpToAward,
                updatedAt: new Date(), //XD :)
              })
              .where(
                and(
                  eq(rewardedView.videoId, videoId),
                  eq(rewardedView.userId, userId)
                )
              )
              .returning();

            //update user XP
            await updateUserXp(tx, userId, xpToAward);

            return {
              xpEarned: xpToAward,
              message: `You've earned ${xpToAward} XP for watching this featured video`,
            };
          }
        });
    })
});
