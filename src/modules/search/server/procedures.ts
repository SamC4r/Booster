import { db } from "@/db";
import { categories, userFollows, users, videoRatings, videos, videoViews } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { and, avg, count, desc, eq, getTableColumns, ilike,  lt, or, sql, sum } from "drizzle-orm";
import z from "zod";

export const searchRouter = createTRPCRouter({
    getChannelsByQuery: baseProcedure
        .input(z.object({
            query: z.string().nullish(),
            limit: z.number().min(1).max(100)
        }))
        .query(async ({ input, ctx }) => {
            const { query, limit } = input;
            const { clerkUserId } = ctx;

            // Fetch user settings
            let userSettings = null;
            if (clerkUserId) {
                const [user] = await db
                    .select({ aiContentEnabled: users.aiContentEnabled })
                    .from(users)
                    .where(eq(users.clerkId, clerkUserId));
                userSettings = user;
            }

            const hasQuery = query && query.trim().length > 0;

            if (!hasQuery) {
                return { items: [] };
            }

            // Subquery to get channels that have videos matching the query
            const channelsWithMatchingVideos = db
                .$with("channels_with_matching_videos")
                .as(
                    db
                        .selectDistinct({
                            userId: videos.userId,
                            // Calculate relevance based on video matches
                            relevance: sql<number>`
                                MAX(
                                    (CASE WHEN LOWER(${videos.title}) = LOWER(${query}) THEN 100 ELSE 0 END) +
                                    (CASE WHEN LOWER(${videos.title}) LIKE LOWER(${query + '%'}) THEN 50 ELSE 0 END) +
                                    (CASE WHEN LOWER(${videos.title}) LIKE LOWER(${'%' + query + '%'}) THEN 20 ELSE 0 END) +
                                    (CASE WHEN LOWER(COALESCE(${videos.description}, '')) LIKE LOWER(${'%' + query + '%'}) THEN 10 ELSE 0 END)
                                )
                            `.mapWith(Number).as('relevance'),
                        })
                        .from(videos)
                        .leftJoin(categories, eq(videos.categoryId, categories.id))
                        .where(
                            and(
                                or(
                                    ilike(videos.title, `%${query}%`),
                                    ilike(videos.description, `%${query}%`),
                                    sql`${categories.name} IS NOT NULL AND LOWER(${categories.name}) LIKE LOWER(${`%${query}%`})`
                                ),
                                eq(videos.visibility, 'public'),
                                userSettings?.aiContentEnabled === false ? eq(videos.isAi, false) : undefined
                            )
                        )
                        .groupBy(videos.userId)
                );

            const data = await db
                .with(channelsWithMatchingVideos)
                .select({
                    ...getTableColumns(users),
                    followsCount: sql<number>`(SELECT COUNT(*) FROM ${userFollows} WHERE ${userFollows.creatorId} = ${users.id})`.mapWith(Number),
                    videoCount: sql<number>`(SELECT COUNT(*) FROM ${videos} WHERE ${videos.userId} = ${users.id} AND ${videos.visibility} = 'public')`.mapWith(Number),
                    viewerIsFollowing: clerkUserId
                        ? sql<boolean>`EXISTS(
                            SELECT 1 
                            FROM ${userFollows} uf 
                            INNER JOIN ${users} viewer ON uf.user_id = viewer.id 
                            WHERE uf.creator_id = ${users.id} 
                            AND viewer.clerk_id = ${clerkUserId}
                        )`.mapWith(Boolean)
                        : sql<boolean>`FALSE`.mapWith(Boolean),
                    relevanceScore: sql<number>`
                        -- Direct name match (highest priority)
                        (CASE WHEN LOWER(${users.name}) = LOWER(${query}) THEN 200 ELSE 0 END) +
                        -- Name starts with query
                        (CASE WHEN LOWER(${users.name}) LIKE LOWER(${query + '%'}) THEN 100 ELSE 0 END) +
                        -- Name contains query
                        (CASE WHEN LOWER(${users.name}) LIKE LOWER(${'%' + query + '%'}) THEN 50 ELSE 0 END) +
                        -- Boost if they have matching videos
                        COALESCE(${channelsWithMatchingVideos.relevance}, 0) +
                        -- Popularity boost
                        (${sql`(SELECT COUNT(*) FROM ${userFollows} WHERE ${userFollows.creatorId} = ${users.id})`}::float / 100.0)
                    `.mapWith(Number),
                })
                .from(users)
                .leftJoin(channelsWithMatchingVideos, eq(users.id, channelsWithMatchingVideos.userId))
                .where(
                    or(
                        // Match by username
                        ilike(users.name, `%${query}%`),
                        // Or has videos that match
                        sql`${channelsWithMatchingVideos.userId} IS NOT NULL`
                    )
                )
                .orderBy(
                    desc(sql<number>`
                        (CASE WHEN LOWER(${users.name}) = LOWER(${query}) THEN 200 ELSE 0 END) +
                        (CASE WHEN LOWER(${users.name}) LIKE LOWER(${query + '%'}) THEN 100 ELSE 0 END) +
                        (CASE WHEN LOWER(${users.name}) LIKE LOWER(${'%' + query + '%'}) THEN 50 ELSE 0 END) +
                        COALESCE(${channelsWithMatchingVideos.relevance}, 0) +
                        (${sql`(SELECT COUNT(*) FROM ${userFollows} WHERE ${userFollows.creatorId} = ${users.id})`}::float / 100.0)
                    `.mapWith(Number))
                )
                .limit(limit);


            return { items: data };
        }),
    getManyByQuery: baseProcedure
        .input(z.object({
            query: z.string().nullish(),
            // categoryId: z.string().uuid().nullish(),
            // Cursor may contain either an `updatedAt` (legacy) or a `score` for deterministic paging.
            cursor: z.object({
                id: z.string().uuid(),
                updatedAt: z.date().optional(),
                score: z.number().optional(),
            }).nullish(),
            limit: z.number().min(1).max(100)
        }))
        .query(async ({  input, ctx }) => {

            const { cursor, limit, query } = input;
            const { clerkUserId } = ctx;

            // Fetch user settings
            let userSettings = null;
            if (clerkUserId) {
                const [user] = await db
                    .select({ aiContentEnabled: users.aiContentEnabled })
                    .from(users)
                    .where(eq(users.clerkId, clerkUserId));
                userSettings = user;
            }

            const hasQuery = query && query.trim().length > 0;


            const videoViewsStats = db.$with("video_views_stats").as(
                db
                    .select({
                        videoId: videoViews.videoId,
                        viewCount: sum(videoViews.seen).as("viewCount"),
                    })
                    .from(videoViews)
                    .groupBy(videoViews.videoId)
            );

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

            // Build the same score expression once so we can reuse it for ordering and pagination
            const scoreExpr = hasQuery 
                ? sql<number>`
                            -- Exact title match (highest priority)
                            (CASE WHEN LOWER(${videos.title}) = LOWER(${query}) THEN 100 ELSE 0 END) +
                            -- Title starts with query (high priority)
                            (CASE WHEN LOWER(${videos.title}) LIKE LOWER(${query + '%'}) THEN 50 ELSE 0 END) +
                            -- Category exact match (high priority - for tags)
                            (CASE WHEN LOWER(COALESCE(${categories.name}, '')) = LOWER(${query}) THEN 40 ELSE 0 END) +
                            -- Category contains query (medium-high priority)
                            (CASE WHEN LOWER(COALESCE(${categories.name}, '')) LIKE LOWER(${'%' + query + '%'}) THEN 25 ELSE 0 END) +
                            -- Title contains query (medium priority)
                            (CASE WHEN LOWER(${videos.title}) LIKE LOWER(${'%' + query + '%'}) THEN 20 ELSE 0 END) +
                            -- Description contains query (medium-low priority)
                            (CASE WHEN LOWER(COALESCE(${videos.description}, '')) LIKE LOWER(${'%' + query + '%'}) THEN 10 ELSE 0 END) +
                            -- Creator name contains query (low priority)
                            (CASE WHEN LOWER(${users.name}) LIKE LOWER(${'%' + query + '%'}) THEN 5 ELSE 0 END) +
                            -- Boost by popularity (slight influence)
                            (COALESCE(${videoViewsStats.viewCount}, 0)::float / 10000.0) +
                            (COALESCE(${ratingStats.averageRating}, 0)::float / 2.0)
                        `.mapWith(Number)
                : sql<number>`
                            -- When no query, sort by popularity
                            (COALESCE(${videoViewsStats.viewCount}, 0)::float / 1000.0) +
                            (COALESCE(${ratingStats.averageRating}, 0)::float * 2)
                        `.mapWith(Number);

            const data = await db
                .with(ratingStats, videoViewsStats)
                .select({
                    ...getTableColumns(videos),
                    user: {
                        ...getTableColumns(users),
                        followsCount: sql<number>` (SELECT COUNT(*) FROM ${userFollows} WHERE ${userFollows.creatorId} = ${users.id}) `.mapWith(Number),
                        videoCount: sql<number>`(SELECT COUNT(*) FROM ${videos} WHERE ${videos.userId} = ${users.id})`.mapWith(Number),
                    },
                    category: {
                        id: categories.id,
                        name: categories.name,
                    },
                    videoRatings: ratingStats.ratingCount,
                    averageRating: ratingStats.averageRating,
                    videoViews: videoViewsStats.viewCount,
                    // Relevance score for ranking (same expression as `scoreExpr`)
                    relevanceScore: scoreExpr,
                }).from(videos)
                .innerJoin(users, eq(videos.userId, users.id))
                .leftJoin(categories, eq(videos.categoryId, categories.id))
                .leftJoin(ratingStats, eq(ratingStats.videoId, videos.id))
                .leftJoin(videoViewsStats, eq(videoViewsStats.videoId, videos.id))
                .where(and(
                    hasQuery 
                        ? or(
                            // Match in title
                            ilike(videos.title, `%${query}%`),
                            // Match in description
                            ilike(videos.description, `%${query}%`),
                            // Match in creator name
                            ilike(users.name, `%${query}%`),
                            // Match in category (tags) - handle NULL with sql
                            sql`${categories.name} IS NOT NULL AND LOWER(${categories.name}) LIKE LOWER(${`%${query}%`})`
                        )
                        : undefined,
                    eq(videos.visibility, 'public'),
                    userSettings?.aiContentEnabled === false ? eq(videos.isAi, false) : undefined,
                    // Pagination: if client provides `cursor.score` use a row-wise comparator on (score, id)
                    cursor && cursor.score != null
                        ? sql`(${scoreExpr}, ${videos.id}) < (${cursor.score}, ${cursor.id})`
                        : cursor && cursor.updatedAt != null ? or(
                            lt(videos.updatedAt, cursor.updatedAt),
                            and(
                                eq(videos.updatedAt, cursor.updatedAt),
                                lt(videos.id, cursor.id)
                            )
                        ) : undefined
                ))
                .orderBy(
                    desc(scoreExpr),
                    desc(videos.id)
                )
                .limit(limit + 1); //ad 1 to limit to check if there's more data

            const hasMore = data.length > limit;

            const items = hasMore ? data.slice(0, -1) : data;


            const lastItem = items[items.length - 1];
            const nextCursor = hasMore
                ? {
                    id: lastItem.id,
                    // prefer returning the relevance score so subsequent pages can reuse the same ordering value
                    score: lastItem.relevanceScore,
                    updatedAt: lastItem.updatedAt,
                } : null

            return {
                items,
                nextCursor,
            }
        }),
})