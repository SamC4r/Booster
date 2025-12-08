import { db } from "@/db";
import {
  comments,
  userFollows,
  users,
  videoRatings,
  videos,
  videoViews,
} from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import {
  and,
  avg,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
  lt,
  not,
  or,
  sql,
  sum,
} from "drizzle-orm";
import z from "zod";
import { categories } from "../../../db/schema";
import { embedText } from "@/modules/videos/server/procedures";

export const explorerRouter = createTRPCRouter({
  getEmbedding: baseProcedure
    .input(
      z.object({
        text: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
        const {text} = input;
        const embedding = await embedText(text);
        console.log("Embedding:", embedding);

        return { embedding };
        
    }),

  aiSearch: baseProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string().uuid(),
            distance: z.number().nullish(),
            // include the embedding used for the query so subsequent pages reuse same vector
            embedding: z.array(z.number()).nullish(),
          })
          .nullish(),
        text: z.string().min(1),
        limit: z.number().min(1).max(100).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, text, limit = 10 } = input;

      // If the cursor already contains the embedding from the initial request,
      // reuse it to avoid recomputing (and possible tiny differences) between pages.
      let embeddingArr: number[] | null = null;
      if (cursor && Array.isArray((cursor as any).embedding) && (cursor as any).embedding.length > 0) {
        embeddingArr = ((cursor as any).embedding as any[]).map((n: unknown) => Number(n));
      } else {
        // Reuse your embedText helper to get the embedding for the initial page
        const embedding = await embedText(text);
        if (!Array.isArray(embedding) || embedding.length === 0) {
          return { items: [], nextCursor: null };
        }

        embeddingArr = (embedding || []).map((n: unknown) => Number(n));
        if (embeddingArr.some(Number.isNaN)) {
          console.error("Invalid embedding generated for aiSearch", embeddingArr);
          return { items: [], nextCursor: null };
        }
      }

      const vecLiteral = `'[${embeddingArr.join(",")}]'::vector`;
      const distanceExpr = sql`embedding <-> ${sql.raw(vecLiteral)}`;

      // Build the same helpers used in getMany so returned items match shape
      const { clerkUserId } = ctx;

      let userId;

      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : [])); //trick

      if (user) {
        userId = user.id;
      }

      const viewerFollow = db.$with("viewer_follow").as(
        db
          .select()
          .from(userFollows)
          .where(inArray(userFollows.userId, userId ? [userId] : []))
      );

      const ratingStats = db.$with("video_stats").as(
        db
          .select({
            videoId: videoRatings.videoId,
            ratingCount: count(videoRatings.rating).as("ratingCount"),
            averageRating: avg(videoRatings.rating).as("avgRating"),
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
          commentCount: sql<number>`COUNT(*)`.as("commentCount"),
        })
        .from(comments)
        .groupBy(comments.videoId)
        .as("ca");

      const whereParts: any[] = [
        and(
          eq(videos.visibility, "public"),
          not(eq(videos.status, "processing"))
        ),
      ];

      if (cursor && cursor.distance != null) {
        // Use lexicographic row comparison (distance, id) > (cursor.distance, cursor.id)
        // This avoids floating-point equality issues and ensures pagination is deterministic
        whereParts.push(
          sql`((${distanceExpr}), ${videos.id}) > (${cursor.distance}, ${cursor.id})`
        );
      }

      const rows = await db
        .with(viewerFollow, ratingStats, videoViewsStats)
        .select({
          ...getTableColumns(videos),
          user: {
            ...getTableColumns(users),
            followsCount:
              sql<number>` (SELECT COUNT(*) FROM ${userFollows} WHERE ${userFollows.creatorId} = ${users.id}) `.mapWith(
                Number
              ),
            viewerIsFollowing: isNotNull(viewerFollow.userId).mapWith(Boolean),
            videoCount:
              sql<number>`(SELECT COUNT(*) FROM ${videos} WHERE ${videos.userId} = ${users.id})`.mapWith(
                Number
              ),
            viewerRating: userId
              ? sql<number>`(SELECT ${videoRatings.rating} FROM ${videoRatings} WHERE ${videoRatings.userId} = ${userId} AND ${videoRatings.videoId} = ${videos.id} LIMIT 1)`.mapWith(
                  Number
                )
              : sql<number>`(NULL)`.mapWith(Number),
          },
          distance: sql<number>`${distanceExpr}`.as("distance"),

          category: {
            ...getTableColumns(categories),
          },

          videoRatings: ratingStats.ratingCount,
          averageRating: ratingStats.averageRating,
          videoViews: videoViewsStats.viewCount,
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .leftJoin(viewerFollow, eq(viewerFollow.creatorId, users.id))
        .leftJoin(ratingStats, eq(ratingStats.videoId, videos.id))
        .leftJoin(videoViewsStats, eq(videoViewsStats.videoId, videos.id))
        .leftJoin(commentsAgg, eq(commentsAgg.videoId, videos.id))
        .leftJoin(categories, eq(videos.categoryId, categories.id))
        .where(and(...whereParts))
        // Order primarily by distance (closest first) and secondarily by id to make ordering deterministic
        .orderBy(distanceExpr, videos.id)
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, -1) : rows;
      const last = items[items.length - 1];
      const nextCursor = hasMore && last
        ? { id: last.id, distance: Number((last as any).distance), embedding: embeddingArr }
        : null;

      return {
        items,
        nextCursor,
      };
    }),

  getMany: baseProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string().uuid(),
            score: z.number().nullish(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
        categoryId: z.string().uuid().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit, categoryId } = input;
      const { clerkUserId } = ctx;

      let userId;

      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : [])); //trick

      if (user) {
        userId = user.id;
      }
      const viewerFollow = db.$with("viewer_follow").as(
        db
          .select()
          .from(userFollows)
          .where(inArray(userFollows.userId, userId ? [userId] : []))
      );

      const ratingStats = db.$with("video_stats").as(
        db
          .select({
            videoId: videoRatings.videoId,
            ratingCount: count(videoRatings.rating).as("ratingCount"),
            averageRating: avg(videoRatings.rating).as("avgRating"),
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
          commentCount: sql<number>`COUNT(*)`.as("commentCount"),
        })
        .from(comments)
        .groupBy(comments.videoId)
        .as("ca");

      //TODO: add time factor -> older videos get subtracted? Or recent are more valuable
      const scoreExpr = sql<number>`
                            LN(
                                POWER(COALESCE(SQRT(${users.boostPoints} * 1000) / 1000, 0) + 1, 2)  
                                + COALESCE(${videoViewsStats.viewCount}, 0) 
                                + TANH(COALESCE(${ratingStats.averageRating}, 0) - 3.5)
                                * LN(GREATEST(COALESCE(${ratingStats.ratingCount}, 0), 1))
                                + LN(GREATEST(COALESCE(${ratingStats.ratingCount}, 0), 1))
                                + LN(GREATEST(COALESCE(${commentsAgg.commentCount}, 0), 1))
                            )   * COALESCE(SQRT(${users.boostPoints} * 1000) / 1000, 0)
                    `;

      const whereParts: any[] = [
        and(
          eq(videos.visibility, "public"),
          not(eq(videos.status, "processing"))
        ),
      ];

      if (cursor && cursor.score != null) {
        whereParts.push(
          or(
            lt(scoreExpr, cursor.score),
            and(sql`${scoreExpr} = ${cursor.score}`, lt(videos.id, cursor.id))
          )
        );
      }

      if (categoryId) {
        whereParts.push(eq(videos.categoryId, categoryId));
      }

      const rows = await db
        .with(viewerFollow, ratingStats, videoViewsStats)
        .select({
          ...getTableColumns(videos),
          user: {
            ...getTableColumns(users),
            followsCount:
              sql<number>` (SELECT COUNT(*) FROM ${userFollows} WHERE ${userFollows.creatorId} = ${users.id}) `.mapWith(
                Number
              ),
            viewerIsFollowing: isNotNull(viewerFollow.userId).mapWith(Boolean),
            videoCount:
              sql<number>`(SELECT COUNT(*) FROM ${videos} WHERE ${videos.userId} = ${users.id})`.mapWith(
                Number
              ),
            viewerRating: userId
              ? sql<number>`(SELECT ${videoRatings.rating} FROM ${videoRatings} WHERE ${videoRatings.userId} = ${userId} AND ${videoRatings.videoId} = ${videos.id} LIMIT 1)`.mapWith(
                  Number
                )
              : sql<number>`(NULL)`.mapWith(Number),
          },
          score: sql<number>`
                        LN(
                            POWER(COALESCE(SQRT(${users.boostPoints} * 1000) / 1000, 0) + 1, 2)  
                            + COALESCE(${videoViewsStats.viewCount}, 0) 
                            + TANH(COALESCE(${ratingStats.averageRating}, 0) - 3.5)
                            * LN(GREATEST(COALESCE(${ratingStats.ratingCount}, 0), 1))
                            + LN(GREATEST(COALESCE(${ratingStats.ratingCount}, 0), 1))
                            + LN(GREATEST(COALESCE(${commentsAgg.commentCount}, 0), 1))
                        )   * COALESCE(SQRT(${users.boostPoints} * 1000) / 1000, 0)
                            `.as("score"),

          category: {
            ...getTableColumns(categories),
          },

          videoRatings: ratingStats.ratingCount,
          averageRating: ratingStats.averageRating,
          videoViews: videoViewsStats.viewCount,
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .leftJoin(viewerFollow, eq(viewerFollow.creatorId, users.id))
        .leftJoin(ratingStats, eq(ratingStats.videoId, videos.id))
        .leftJoin(videoViewsStats, eq(videoViewsStats.videoId, videos.id))
        .leftJoin(commentsAgg, eq(commentsAgg.videoId, videos.id))
        .leftJoin(categories, eq(videos.categoryId, categories.id))
        .where(and(...whereParts))
        .orderBy(desc(sql`score`))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, -1) : rows;
      const last = items[items.length - 1];
      const nextCursor =
        hasMore && last ? { id: last.id, score: Number(last.score) } : null;

      return {
        items,
        nextCursor,
      };
    }),
});
