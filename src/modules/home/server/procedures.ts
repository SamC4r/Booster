import { z } from "zod";
import { db } from "@/db";
import { comments, userFollows, users, videoRatings, videos, videoViews } from "@/db/schema";
import { baseProcedure, createTRPCRouter, } from "@/trpc/init";
import { eq, and, or, lt, desc, sql, getTableColumns, sum, avg, inArray, isNotNull, not, } from "drizzle-orm";
import { TRPCError } from "@trpc/server";


// const channelLevel = Math.floor(
//     Math.floor(Math.sqrt(boostPoints.boostPoints * 1000)) / 1000
// );

export const homeRouter = createTRPCRouter({

    getOne: baseProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ input, ctx }) => {

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




            const [existingVideo] = await db
                .with(viewerFollow)
                .select({
                    ...getTableColumns(videos), //instead of ...videos
                    user: {
                        ...getTableColumns(users),
                        followsCount: sql<number>` (SELECT COUNT(*) FROM ${userFollows} WHERE ${userFollows.creatorId} = ${users.id}) `.mapWith(Number),
                        viewerIsFollowing: isNotNull(viewerFollow.userId).mapWith(Boolean),
                        videoCount: sql<number>`(SELECT COUNT(*) FROM ${videos} WHERE ${videos.userId} = ${users.id})`.mapWith(Number)
                    },
                    videoRatings: db.$count(videoRatings, eq(videoRatings.videoId, videos.id)), //inefficient?
                })
                .from(videos)
                .innerJoin(users, eq(videos.userId, users.id))
                .leftJoin(viewerFollow, eq(viewerFollow.creatorId, users.id))
                .where(
                    eq(videos.id, input.id)
                )
            //inner join to get data of user

            if (!existingVideo) {
                throw new TRPCError({ code: "NOT_FOUND" })
            }

            const [viewCount] = await db
                .select({
                    count: sum(videoViews.seen)
                })
                .from(videoViews)
                .where(eq(videoViews.videoId, input.id))




            const [averageRating] = await db
                .select({
                    averageRating: avg(videoRatings.rating)
                }).from(videoRatings)
                .where(eq(videoRatings.videoId, input.id))



            const average = Number(averageRating?.averageRating ?? 0);
            return {
                ...existingVideo,
                videoViews: Number(viewCount.count ?? 0),
                averageRating: average,
                viewer: user,
            }
        }),

    getMany: baseProcedure
        .input(
            z.object({
                cursor: z.object({
                    id: z.string().uuid(),
                    score: z.number().nullish(),
                }).nullish(),
                limit: z.number().min(1).max(100),
            })
        )
        .query(async ({ ctx, input }) => {
            const { cursor, limit } = input;
            const { clerkUserId } = ctx;
            console.log(clerkUserId)

            //TODO: add more points if the user is following the creator of the video


            const ratingsAgg = db
                .select({
                    videoId: videoRatings.videoId,
                    avgRating: sql<number>`AVG(${videoRatings.rating})`.as('avgRating'),
                    ratingCount: sql<number>`COUNT(*)`.as('ratingCount'),
                })
                .from(videoRatings)
                .groupBy(videoRatings.videoId)
                .as("ra");

            // 2) Pre-aggregate comments per video
            const commentsAgg = db
                .select({
                    videoId: comments.videoId,
                    commentCount: sql<number>`COUNT(*)`.as('commentCount'),
                })
                .from(comments)
                .groupBy(comments.videoId)
                .as("ca");

            const viewsAgg = db
                .select({
                    videoId: videoViews.videoId,
                    viewCount: sql<number>`SUM(${videoViews.seen})`.as('viewCount')
                }).from(videoViews)
                .groupBy(videoViews.videoId)
                .as("vv")




            //TODO: add time factor -> older videos get subtracted? Or recent are more valuable
            const scoreExpr = sql<number>`
                    LN(
                        POWER(COALESCE(SQRT(${users.boostPoints} * 1000) / 1000, 0) + 1, 1)
                        + LN(GREATEST(COALESCE(${viewsAgg.viewCount}, 0), 1))
                        + TANH(COALESCE(${ratingsAgg.avgRating}, 0) - 3.5) 
                        * LN(GREATEST(COALESCE(${ratingsAgg.ratingCount}, 0), 1))
                        + LN(GREATEST(COALESCE(${ratingsAgg.ratingCount}, 0), 1))
                        + LN(GREATEST(COALESCE(${commentsAgg.commentCount}, 0), 1))
                    )   * COALESCE(SQRT(${users.boostPoints} * 1000) / 1000, 0)
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


            const rows = await db
                .select({
                    id: videos.id,
                    updatedAt: videos.updatedAt,
                    score: sql<number>`
                    LN(
                        POWER(COALESCE(SQRT(${users.boostPoints} * 1000) / 1000, 0) + 1, 1)
                        + LN(GREATEST(COALESCE(${viewsAgg.viewCount}, 0), 1))
                        + TANH(COALESCE(${ratingsAgg.avgRating}, 0) - 3.5) 
                        * LN(GREATEST(COALESCE(${ratingsAgg.ratingCount}, 0), 1))
                        + LN(GREATEST(COALESCE(${ratingsAgg.ratingCount}, 0), 1))
                        + LN(GREATEST(COALESCE(${commentsAgg.commentCount}, 0), 1))
                    )   * COALESCE(SQRT(${users.boostPoints} * 1000) / 1000, 0)

                        `.as("score"),
                })
                .from(videos)
                .leftJoin(users, eq(users.id, videos.userId))
                .leftJoin(ratingsAgg, eq(ratingsAgg.videoId, videos.id))
                .leftJoin(commentsAgg, eq(commentsAgg.videoId, videos.id))
                .leftJoin(viewsAgg, eq(viewsAgg.videoId, videos.id))
                .where(and(...whereParts))
                .orderBy(desc(sql`score`))
                .limit(limit + 1);



            const hasMore = rows.length > limit;
            const items = hasMore ? rows.slice(0, -1) : rows;
            const last = items[items.length - 1];
            const nextCursor = hasMore && last ? { id: last.id, score: Number(last.score) } : null;


            return {
                items,
                nextCursor,
            }
        })

    // getMany: baseProcedure
    //     .input(
    //         z.object({
    //             cursor: z.object({
    //                 id: z.string().uuid(),
    //                 updatedAt: z.date(),
    //             }).nullish(),
    //             limit: z.number().min(1).max(100),
    //         })
    //     )
    //     .query(async ({ ctx, input }) => {
    //         const { cursor, limit } = input;
    //         const {clerkUserId}  = ctx;
    //         console.log(clerkUserId)

    //         let userId;

    //         const [user] = await db
    //             .select()
    //             .from(users)
    //             .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : [])) //trick

    //         if (user) {
    //             userId = user.id;
    //         }
    //         const viewerFollow = db.$with("viewer_follow").as(
    //             db
    //                 .select()
    //                 .from(userFollows)
    //                 .where(inArray(userFollows.userId, userId ? [userId] : []))
    //         )

    //         const ratingStats = db.$with("video_stats").as(
    //             db
    //                 .select({
    //                     videoId: videoRatings.videoId,
    //                     ratingCount: count(videoRatings.rating).as("ratingCount"),
    //                     averageRating: avg(videoRatings.rating).as("avgRating")
    //                 })
    //                 .from(videoRatings)
    //                 .groupBy(videoRatings.videoId)
    //         );
    //         const videoViewsStats = db.$with("video_views_stats").as(
    //             db
    //                 .select({
    //                     videoId: videoViews.videoId,
    //                     viewCount: sum(videoViews.seen).as("viewCount"),
    //                 })
    //                 .from(videoViews)
    //                 .groupBy(videoViews.videoId)
    //         );


    //         const data = await db
    //         .with(viewerFollow,ratingStats,videoViewsStats)
    //         .select({
    //             ...getTableColumns(videos),
    //             user: {
    //                 ...getTableColumns(users),
    //                 followsCount: sql<number>` (SELECT COUNT(*) FROM ${userFollows} WHERE ${userFollows.creatorId} = ${users.id}) `.mapWith(Number),
    //                 viewerIsFollowing: isNotNull(viewerFollow.userId).mapWith(Boolean),
    //                 videoCount: sql<number>`(SELECT COUNT(*) FROM ${videos} WHERE ${videos.userId} = ${users.id})`.mapWith(Number),
    //                 viewerRating : (userId ? sql<number>`(SELECT ${videoRatings.rating} FROM ${videoRatings} WHERE ${videoRatings.userId} = ${userId} AND ${videoRatings.videoId} = ${videos.id} LIMIT 1)`.mapWith(Number) : sql<number>`(NULL)`.mapWith(Number)),
    //             },
    //             videoRatings: ratingStats.ratingCount,
    //             averageRating: ratingStats.averageRating,
    //             videoViews: videoViewsStats.viewCount,
    //         }).from(videos)
    //         .innerJoin(users,eq(videos.userId,users.id))
    //         .leftJoin(viewerFollow,eq(viewerFollow.creatorId,users.id))
    //         .leftJoin(ratingStats,eq(ratingStats.videoId,videos.id))
    //         .leftJoin(videoViewsStats,eq(videoViewsStats.videoId,videos.id))
    //         .where(and(
    //                 eq(videos.visibility,'public'),
    //                 cursor ?
    //                     or(
    //                         lt(videos.updatedAt, cursor.updatedAt)
    //                         , and(
    //                             eq(videos.updatedAt, cursor.updatedAt),
    //                             lt(videos.id, cursor.id)
    //                         ))
    //                     : undefined)).orderBy(desc(videos.updatedAt), desc(videos.id)).limit(limit + 1); //ad 1 to limit to check if there's more data

    //         const hasMore = data.length > limit;
    //         //remove last item if hasMore
    //         const rows = hasMore ? data.slice(0, -1) : data;

    //         const lastItem = rows[rows.length - 1];
    //         const nextCursor = hasMore ?
    //             {
    //                 id: lastItem.id,
    //                 updatedAt: lastItem.updatedAt,
    //             } : null;


    //         const items = {
    //             ...rows,
    //         }

    //         return {
    //             items,
    //             nextCursor,
    //         }
    //     })
})    
