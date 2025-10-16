import { db } from "@/db";
import { comments, userFollows, users, videoRatings, videos, videoViews } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { and, avg, count, desc, eq, getTableColumns, inArray, isNotNull, lt, not, or, sql, sum } from "drizzle-orm";
import z from "zod";

export const explorerRouter = createTRPCRouter({
    getMany: baseProcedure
        .input(
            z.object({
                cursor: z.object({
                    id: z.string().uuid(),
                    updatedAt: z.date(),
                    score: z.number().nullish(),
                }).nullish(),
                limit: z.number().min(1).max(100),
            })
        )
        .query(async ({ ctx, input }) => {
            const { cursor, limit } = input;
            const { clerkUserId } = ctx;

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



            const commentsAgg = db
                .select({
                    videoId: comments.videoId,
                    commentCount: sql<number>`COUNT(*)`.as('commentCount'),
                })
                .from(comments)
                .groupBy(comments.videoId)
                .as("ca");

            //TODO: add time factor -> older videos get subtracted? Or recent are more valuable
            const scoreExpr = sql<number>`
                POWER(COALESCE(SQRT(${users.boostPoints} * 1000) / 1000, 0) + 1, 2)
                + COALESCE(${videoViewsStats.viewCount}, 0) * PI()
                + TANH(COALESCE(${ratingStats.averageRating}, 0) - 3.5) * LN(GREATEST(COALESCE(${ratingStats.ratingCount}, 0), 1))
                + LN(GREATEST(COALESCE(${ratingStats.ratingCount}, 0), 1))
                + LN(GREATEST(COALESCE(${commentsAgg.commentCount}, 0), 1))
                    `;

            const whereParts: any[] = [and(eq(videos.visibility, "public"), not(eq(videos.status, "processing")))]

            if (cursor && cursor.score != null) {
                whereParts.push(
                    or(
                        lt(scoreExpr, cursor.score),
                        and(sql`${scoreExpr} = ${cursor.score}`, lt(videos.id, cursor.id))
                    )
                );
            }


            const data = await db
                .with(viewerFollow, ratingStats, videoViewsStats)
                .select({
                    ...getTableColumns(videos),
                    user: {
                        ...getTableColumns(users),
                        followsCount: sql<number>` (SELECT COUNT(*) FROM ${userFollows} WHERE ${userFollows.creatorId} = ${users.id}) `.mapWith(Number),
                        viewerIsFollowing: isNotNull(viewerFollow.userId).mapWith(Boolean),
                        videoCount: sql<number>`(SELECT COUNT(*) FROM ${videos} WHERE ${videos.userId} = ${users.id})`.mapWith(Number),
                        viewerRating: (userId ? sql<number>`(SELECT ${videoRatings.rating} FROM ${videoRatings} WHERE ${videoRatings.userId} = ${userId} AND ${videoRatings.videoId} = ${videos.id} LIMIT 1)`.mapWith(Number) : sql<number>`(NULL)`.mapWith(Number)),
                        score: sql<number>`
                                POWER(COALESCE(SQRT(${users.boostPoints} * 1000) / 1000, 0) + 1, 2) + COALESCE(${videoViewsStats.viewCount}, 0) * PI()
                                + TANH(COALESCE(${ratingStats.averageRating}, 0) - 3.5) * LN(GREATEST(COALESCE(${ratingStats.ratingCount}, 0), 1))
                                + LN(GREATEST(COALESCE(${ratingStats.ratingCount}, 0), 1))
                                + LN(GREATEST(COALESCE(${commentsAgg.commentCount}, 0), 1))
                                `.as('score'),


                    },
                    videoRatings: ratingStats.ratingCount,
                    averageRating: ratingStats.averageRating,
                    videoViews: videoViewsStats.viewCount,
                }).from(videos)
                .innerJoin(users, eq(videos.userId, users.id))
                .leftJoin(viewerFollow, eq(viewerFollow.creatorId, users.id))
                .leftJoin(ratingStats, eq(ratingStats.videoId, videos.id))
                .leftJoin(videoViewsStats, eq(videoViewsStats.videoId, videos.id))
                .leftJoin(commentsAgg, eq(commentsAgg.videoId, videos.id))
                .where(and(...whereParts))
                .orderBy(desc(sql`score`), desc(videos.updatedAt))
                .limit(limit + 1); const hasMore = data.length > limit;

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
