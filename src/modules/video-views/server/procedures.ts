 import { db } from "@/db";
import { videos, videoViews } from "@/db/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import z from "zod";


export const videoViewsRouter = createTRPCRouter({

    getAllViewsByUserId: baseProcedure
    .input(z.object({userId:z.string().uuid()}))
    .query(async ({input}) => {

        const {userId: creatorId} = input;

        const [views] = await db
        .select({
            creatorViews: sql<number>`(SELECT SUM (${videoViews.seen}) WHERE ${videos.userId}=${creatorId})`.mapWith(Number),
        })
        .from(videoViews)
        .leftJoin(videos, eq(videos.id, videoViews.videoId))
        .groupBy(videos.userId)
        .where(eq(videos.userId, creatorId))

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
                const RATE_LIMIT_VIEWS_TIME = 1 * 60 * 60 * 1000; // 12 hours in ms 

                if (now.getTime() - last_update.getTime() < RATE_LIMIT_VIEWS_TIME) {
                    console.log("rate limited")
                    return existingVideoView;
                } else {
                    console.log("updating views")
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
                    return updatedVideoViews;
                }
                // return existingVideoView;
            }
        }
      return createdVideoView
    })
})