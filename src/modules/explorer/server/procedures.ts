import { db } from "@/db";
import { userFollows, users, videoRatings, videos, videoViews } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { and, avg, count, desc, eq, getTableColumns, inArray, isNotNull, lt, or, sql, sum } from "drizzle-orm";
import z from "zod";

export const explorerRouter = createTRPCRouter({
     getMany: baseProcedure
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
            const {clerkUserId}  = ctx;

            let userId;

            const [user] = await db
                .select()
                .from(users)
                .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : [])) //trick

            if (user) {
                userId = user.id;
            }
            const viewerFollow = db.$with("viewer_follow").as(
                db
                    .select()
                    .from(userFollows)
                    .where(inArray(userFollows.userId, userId ? [userId] : []))
            )

            const ratingStats = db.$with("video_stats").as(
                db
                    .select({
                        videoId: videoRatings.videoId,
                        ratingCount: count(videoRatings.rating).as("ratingCount"),
                        averageRating: avg(videoRatings.rating).as("avgRating")
                    })
                    .from(videoRatings)
                    .groupBy(videoRatings.videoId)
            );
            const videoViewsStats = db.$with("video_views_stats").as(
                db
                    .select({
                        videoId: videoViews.videoId,
                        viewCount: sum(videoViews.seen).as("viewCount"),
                    })
                    .from(videoViews)
                    .groupBy(videoViews.videoId)
            );


            const data = await db
            .with(viewerFollow,ratingStats,videoViewsStats)
            .select({
                ...getTableColumns(videos),
                user: {
                    ...getTableColumns(users),
                    followsCount: sql<number>` (SELECT COUNT(*) FROM ${userFollows} WHERE ${userFollows.creatorId} = ${users.id}) `.mapWith(Number),
                    viewerIsFollowing: isNotNull(viewerFollow.userId).mapWith(Boolean),
                    videoCount: sql<number>`(SELECT COUNT(*) FROM ${videos} WHERE ${videos.userId} = ${users.id})`.mapWith(Number),
                    viewerRating : (userId ? sql<number>`(SELECT ${videoRatings.rating} FROM ${videoRatings} WHERE ${videoRatings.userId} = ${userId} AND ${videoRatings.videoId} = ${videos.id} LIMIT 1)`.mapWith(Number) : sql<number>`(NULL)`.mapWith(Number)),
                },
                videoRatings: ratingStats.ratingCount,
                averageRating: ratingStats.averageRating,
                videoViews: videoViewsStats.viewCount,
            }).from(videos)
            .innerJoin(users,eq(videos.userId,users.id))
            .leftJoin(viewerFollow,eq(viewerFollow.creatorId,users.id))
            .leftJoin(ratingStats,eq(ratingStats.videoId,videos.id))
            .leftJoin(videoViewsStats,eq(videoViewsStats.videoId,videos.id))
            .where(and(
                    eq(videos.visibility,'public'),
                    cursor ?
                        or(
                            lt(videos.updatedAt, cursor.updatedAt)
                            , and(
                                eq(videos.updatedAt, cursor.updatedAt),
                                lt(videos.id, cursor.id)
                            ))
                        : undefined)).orderBy(desc(videos.updatedAt), desc(videos.id)).limit(limit + 1); //ad 1 to limit to check if there's more data

            const hasMore = data.length > limit;
            //remove last item if hasMore
            const rows = hasMore ? data.slice(0, -1) : data;

            const lastItem = rows[rows.length - 1];
            const nextCursor = hasMore ?
                {
                    id: lastItem.id,
                    updatedAt: lastItem.updatedAt,
                } : null;

            
            const items = rows
            

            return {
                items,
                nextCursor,
            }
        })
})