import { z } from "zod";
import { db } from "@/db";
import { userFollows, users, videoRatings, videos, videoViews } from "@/db/schema";
import { baseProcedure, createTRPCRouter, } from "@/trpc/init";
import { eq, and, or, lt, desc, sql, getTableColumns, inArray, isNotNull, } from "drizzle-orm";
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
                    viewCount: sql<number>`(SELECT count(*) FROM ${videoViews} WHERE ${videoViews.videoId} = ${videos.id})`.mapWith(Number),
                    user: {
                        ...getTableColumns(users),
                        followsCount: sql<number>` (SELECT COUNT(*) FROM ${userFollows} WHERE ${userFollows.creatorId} = ${users.id}) `.mapWith(Number),
                        viewerIsFollowing: isNotNull(viewerFollow.userId).mapWith(Boolean),
                        videoCount: sql<number>`(SELECT COUNT(*) FROM ${videos} WHERE ${videos.userId} = ${users.id})`.mapWith(Number),
                        viewerRating: (userId ? sql<number>`(SELECT ${videoRatings.rating} FROM ${videoRatings} WHERE ${videoRatings.userId} = ${userId} AND ${videoRatings.videoId} = ${videos.id} LIMIT 1)`.mapWith(Number) : sql<number>`(NULL)`.mapWith(Number)),
                    },
                    videoRatings: videos.ratingCount,
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

            return {
                ...existingVideo,
                videoViews: existingVideo.viewCount,
                averageRating: existingVideo.averageRating,
                viewer: user,
            }
        }),

    getMany: baseProcedure
        .input(
            z.object({
                cursor: z.object({
                    id: z.string().uuid().nullish(),
                    score: z.number().nullish(),
                    featuredId: z.string().uuid().nullish(),
                    featuredScore: z.number().nullish(),
                }).nullish(),
                limit: z.number().min(1).max(100),
            })
        )
        .query(async ({ input }) => {
            const { cursor, limit } = input;

            // Common Where Clauses
            const baseWhere = and(
                eq(videos.visibility, "public"),
                // not(eq(videos.status, "processing"))
            );

            // --- Normal Videos ---
            let normalVideos: { id: string, updatedAt: Date, isFeatured: boolean, score: number }[] = [];
            let nextNormalCursor: { id: string, score: number } | null = null;

            // Determine if we should fetch normal videos
            // Fetch if cursor is null (start) OR cursor.id is present (continuation)
            const shouldFetchNormal = !cursor || (cursor.id !== null && cursor.id !== undefined);

            if (shouldFetchNormal) {
                const normalWhereParts = [
                    baseWhere,
                    eq(videos.isFeatured, false)
                ];

                if (cursor && cursor.id && cursor.score != null) {
                    normalWhereParts.push(
                        or(
                            lt(videos.trendingScore, cursor.score),
                            and(eq(videos.trendingScore, cursor.score), lt(videos.id, cursor.id))
                        )
                    );
                }

                const normalRows = await db
                    .select({
                        id: videos.id,
                        updatedAt: videos.updatedAt,
                        isFeatured: sql<boolean>`COALESCE(${videos.isFeatured}, false)`.mapWith(Boolean),
                        score: videos.trendingScore,
                    })
                    .from(videos)
                    .where(and(...normalWhereParts))
                    .orderBy(desc(videos.trendingScore), desc(videos.id))
                    .limit(limit + 1);

                if (normalRows.length > limit) {
                    const last = normalRows[limit - 1];
                    nextNormalCursor = { id: last.id, score: last.score };
                    normalVideos = normalRows.slice(0, limit);
                } else {
                    nextNormalCursor = null; // No more normal videos
                    normalVideos = normalRows;
                }
            }

            // --- Featured Videos ---
            let featuredVideos: { id: string, updatedAt: Date, isFeatured: boolean, score: number }[] = [];
            let nextFeaturedCursor: { id: string, score: number } | null = null;

            // Fetch 1 featured video for every batch (assuming limit ~5)
            const featuredLimit = 1;

            const shouldFetchFeatured = !cursor || (cursor.featuredId !== null && cursor.featuredId !== undefined);

            if (shouldFetchFeatured) {
                const featuredWhereParts = [
                    baseWhere,
                    eq(videos.isFeatured, true)
                ];

                if (cursor && cursor.featuredId && cursor.featuredScore != null) {
                    featuredWhereParts.push(
                        or(
                            lt(videos.trendingScore, cursor.featuredScore),
                            and(eq(videos.trendingScore, cursor.featuredScore), lt(videos.id, cursor.featuredId))
                        )
                    );
                }

                const featuredRows = await db
                    .select({
                        id: videos.id,
                        updatedAt: videos.updatedAt,
                        isFeatured: sql<boolean>`COALESCE(${videos.isFeatured}, false)`.mapWith(Boolean),
                        score: videos.trendingScore,
                    })
                    .from(videos)
                    .where(and(...featuredWhereParts))
                    .orderBy(desc(videos.trendingScore), desc(videos.id))
                    .limit(featuredLimit + 1);

                if (featuredRows.length > featuredLimit) {
                    const last = featuredRows[featuredLimit - 1];
                    nextFeaturedCursor = { id: last.id, score: last.score };
                    featuredVideos = featuredRows.slice(0, featuredLimit);
                } else {
                    nextFeaturedCursor = null;
                    featuredVideos = featuredRows;
                }
            }

            // --- Combine ---
            const combined = [...normalVideos];
            // Insert featured videos at index 4 (5th position)
            if (featuredVideos.length > 0) {
                // If we have enough normal videos, insert at 4.
                // If not, append.
                if (combined.length >= 4) {
                    combined.splice(4, 0, featuredVideos[0]);
                } else {
                    combined.push(featuredVideos[0]);
                }
            }

            // --- Next Cursor ---
            let nextCursor = null;
            if (nextNormalCursor || nextFeaturedCursor) {
                nextCursor = {
                    id: nextNormalCursor?.id ?? null,
                    score: nextNormalCursor?.score ?? null,
                    featuredId: nextFeaturedCursor?.id ?? null,
                    featuredScore: nextFeaturedCursor?.score ?? null,
                };
            }

            return {
                items: combined,
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
