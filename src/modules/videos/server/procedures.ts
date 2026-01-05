import { z } from "zod";
import { deleteBunnyVideo } from "@/lib/bunny";
import { db } from "@/db";
import { uploadRateLimit } from "@/lib/ratelimit";
import {
  comments,
  userFollows,
  users,
  videoRatings,
  videos,
  videoUpdateSchema,
  videoViews,
  assets,
  communities,
  communityModerators,
} from "@/db/schema";
import {
  createTRPCRouter,
  protectedProcedure,
  baseProcedure,
} from "@/trpc/init";
import {
  eq,
  and,
  getTableColumns,
  sum,
  avg,
  inArray,
  isNotNull,
  sql,
  count,
  desc,
  lt,
  not,
  or,
} from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { mux } from "@/lib/mux";
import { UTApi } from "uploadthing/server";
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { OpenAI } from "openai/client";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embedText(text: string) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (e) {
    console.log("Embedding response", e);
  }
}

export const videosRouter = createTRPCRouter({
  //.query() para queries
  //.mutation() para editar algo en db

  //TODO: separate comment fetch from video

  getOne: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
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

      const [existingVideo] = await db
        .with(viewerFollow)
        .select({
          ...getTableColumns(videos), //instead of ...videos
          user: {
            ...getTableColumns(users),
            equippedTitle: assets.name,
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
            
            viewerHasViewed: userId
              ? sql<boolean>`EXISTS (SELECT 1 FROM ${videoViews} WHERE ${videoViews.userId} = ${userId} AND ${videoViews.videoId} = ${videos.id})`.mapWith(Boolean)
              : sql<boolean>`false`.mapWith(Boolean),
          },
          videoRatings: db.$count(
            videoRatings,
            eq(videoRatings.videoId, videos.id)
          ), //inefficient?
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .leftJoin(assets, eq(users.equippedTitleId, assets.assetId))
        .leftJoin(viewerFollow, eq(viewerFollow.creatorId, users.id))
        .where(eq(videos.id, input.id));
      //inner join to get data of user

      if (!existingVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [viewCount] = await db
        .select({
          count: sum(videoViews.seen),
        })
        .from(videoViews)
        .where(eq(videoViews.videoId, input.id));

      const [averageRating] = await db
        .select({
          averageRating: avg(videoRatings.rating),
        })
        .from(videoRatings)
        .where(eq(videoRatings.videoId, input.id));

      const average = Number(averageRating?.averageRating ?? 0);
      return {
        ...existingVideo,
        videoViews: Number(viewCount.count ?? 0),
        averageRating: average,
        viewer: user,
      };
    }),

  getMore: baseProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string().uuid(),
            score: z.number().nullish(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
        videoId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit, videoId } = input;
      const { clerkUserId } = ctx;

      let userId;

      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : [])); //trick

      if (user) {
        userId = user.id;
      }

      const [currentVideo] = await db
        .select({ 
          categoryId: videos.categoryId,
          embedding: videos.embedding,
          tags: videos.tags
        })
        .from(videos)
        .where(eq(videos.id, videoId));

      const currentCategoryId = currentVideo?.categoryId;
      const currentEmbedding = currentVideo?.embedding;
      const currentTags = currentVideo?.tags;

      const viewerFollow = db.$with("viewer_follow").as(
        db
          .select()
          .from(userFollows)
          .where(inArray(userFollows.userId, userId ? [userId] : []))
      );

      const viewerView = db.$with("viewer_view").as(
        db
          .select({
            videoId: videoViews.videoId,
          })
          .from(videoViews)
          .where(inArray(videoViews.userId, userId ? [userId] : []))
          .groupBy(videoViews.videoId)
      );

      const userCategoryAffinity = db.$with("user_category_affinity").as(
        db
          .select({
            categoryId: videos.categoryId,
            affinityScore: sum(videoViews.seen).as("affinityScore"),
          })
          .from(videoViews)
          .innerJoin(videos, eq(videoViews.videoId, videos.id))
          .where(inArray(videoViews.userId, userId ? [userId] : []))
          .groupBy(videos.categoryId)
      );

      const similarViewers = db.$with("similar_viewers").as(
        db
          .select({ userId: videoViews.userId })
          .from(videoViews)
          .where(eq(videoViews.videoId, videoId ?? "00000000-0000-0000-0000-000000000000"))
          .limit(50)
      );

      const collaborativeMatch = db.$with("collaborative_match").as(
        db
          .select({
            videoId: videoViews.videoId,
            matchCount: count(videoViews.userId).as("matchCount"),
          })
          .from(videoViews)
          .innerJoin(similarViewers, eq(videoViews.userId, similarViewers.userId))
          .groupBy(videoViews.videoId)
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
                            (
                            LN(
                                POWER(COALESCE(SQRT(${users.boostPoints} * 1000) / 1000, 0) + 1, 2)  
                                + COALESCE(${videoViewsStats.viewCount}, 0) 
                                + TANH(COALESCE(${ratingStats.averageRating}, 0) - 3.5)
                                * LN(GREATEST(COALESCE(${ratingStats.ratingCount}, 0), 1))
                                + LN(GREATEST(COALESCE(${ratingStats.ratingCount}, 0), 1))
                                + LN(GREATEST(COALESCE(${commentsAgg.commentCount}, 0), 1))
                            )   * COALESCE(SQRT(${users.boostPoints} * 1000) / 1000, 0)
                            )
                            + (100 / LN(GREATEST(EXTRACT(EPOCH FROM (NOW() - ${videos.createdAt})) / 3600 + 2, 2)))
                            - (CASE WHEN ${viewerView.videoId} IS NOT NULL THEN 100 ELSE 0 END)
                            + (CASE WHEN ${viewerFollow.userId} IS NOT NULL THEN 50 ELSE 0 END)
                            + (20 * LN(COALESCE(${userCategoryAffinity.affinityScore}, 0) + 1))
                            + (CASE WHEN ${videos.categoryId} = ${currentCategoryId ?? null} THEN 50 ELSE 0 END)
                            + (CASE WHEN ${currentEmbedding ? sql`(${videos.embedding} <=> ${JSON.stringify(currentEmbedding)}::vector)` : sql`1`} < 0.5 THEN 100 ELSE 0 END)
                            + (CASE WHEN ${currentTags && currentTags.length > 0 ? sql`${videos.tags} && ${sql.raw(`'{${currentTags.join(',')}}'`)}` : sql`false`} THEN 50 ELSE 0 END)
                            + (COALESCE(${collaborativeMatch.matchCount}, 0) * 20)
                    `;

      const whereParts: any[] = [
        and(
          eq(videos.visibility, "public"),
          not(eq(videos.status, "processing")),
          not(eq(videos.id, videoId))
        ),
      ];

      if (user && user.aiContentEnabled === false) {
        whereParts.push(eq(videos.isAi, false));
      }

      if (cursor && cursor.score != null) {
        whereParts.push(
          or(
            lt(scoreExpr, cursor.score),
            and(sql`${scoreExpr} = ${cursor.score}`, lt(videos.id, cursor.id))
          )
        );
        whereParts.push(not(eq(videos.id, cursor.id)));
      }
      const rows = await db
        .with(viewerFollow, ratingStats, videoViewsStats, viewerView, userCategoryAffinity, similarViewers, collaborativeMatch)
        .select({
          ...getTableColumns(videos),
          user: {
            ...getTableColumns(users),
            equippedTitle: assets.name,
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
          score: scoreExpr.as("score"),

          videoRatings: ratingStats.ratingCount,
          averageRating: ratingStats.averageRating,
          videoViews: videoViewsStats.viewCount,
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .leftJoin(assets, eq(users.equippedTitleId, assets.assetId))
        .leftJoin(viewerFollow, eq(viewerFollow.creatorId, users.id))
        .leftJoin(ratingStats, eq(ratingStats.videoId, videos.id))
        .leftJoin(videoViewsStats, eq(videoViewsStats.videoId, videos.id))
        .leftJoin(commentsAgg, eq(commentsAgg.videoId, videos.id))
        .leftJoin(viewerView, eq(viewerView.videoId, videos.id))
        .leftJoin(userCategoryAffinity, eq(userCategoryAffinity.categoryId, videos.categoryId))
        .leftJoin(collaborativeMatch, eq(collaborativeMatch.videoId, videos.id))
        .where(and(...whereParts))
        .orderBy(desc(sql`score`), desc(videos.id))
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

  restoreThumbnail: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user; //db user
      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));
      if (!existingVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existingVideo.thumbnailKey) {
        const utapi = new UTApi();

        await utapi.deleteFiles(existingVideo.thumbnailKey);
        await db
          .update(videos)
          .set({ thumbnailKey: null, thumbnailUrl: null })
          .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));
      }

      if (!existingVideo.id) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const newThumbnailUrl = `https://image.mux.com/${existingVideo.id}/thumbnail.webp`;

      const [updatedVideo] = await db
        .update(videos)
        .set({ thumbnailUrl: newThumbnailUrl })
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning(); //returning used in updates

      return updatedVideo;
    }),

  remove: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const [removedVideo] = await db
        .delete(videos)
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();

      if (!removedVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (removedVideo.bunnyVideoId && removedVideo.bunnyLibraryId) {
        try {
          await deleteBunnyVideo(removedVideo.bunnyLibraryId, removedVideo.bunnyVideoId);
        } catch (error) {
          console.error("Failed to delete video from BunnyCDN:", error);
        }
      }

      const upload_key = `videos/${removedVideo.id}_${removedVideo.userId}_${removedVideo.s3Name}`; // unique key

      console.log("upload_key", upload_key);

      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_UPLOAD_BUCKET!,
          Key: upload_key,
        })
      );

      const prefix = `videos/${removedVideo.id}_${removedVideo.userId}_${removedVideo.s3Name}/`;

      const list = await s3.send(
        new ListObjectsV2Command({
          Bucket: process.env.AWS_S3_PROCESSED_VIDEOS_BUCKET!,
          Prefix: prefix,
        })
      );

      if (list.Contents && list.Contents.length > 0) {
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: process.env.AWS_S3_PROCESSED_VIDEOS_BUCKET!,
            Delete: {
              Objects: list.Contents.map((obj) => ({ Key: obj.Key! })),
            },
          })
        );
      }
      return removedVideo;
    }),

  update: protectedProcedure
    .input(videoUpdateSchema.extend({
      title: z.string().min(1).max(100).optional(),
      description: z.string().max(5000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      if (!input.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (input.communityId) {
        const [community] = await db
          .select({ allowUserPosts: communities.allowUserPosts })
          .from(communities)
          .where(eq(communities.communityId, input.communityId));

        if (!community) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Community not found",
          });
        }

        if (!community.allowUserPosts) {
          const [isModerator] = await db
            .select()
            .from(communityModerators)
            .where(
              and(
                eq(communityModerators.communityId, input.communityId),
                eq(communityModerators.userId, userId)
              )
            );

          if (!isModerator) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Only moderators can post in this community",
            });
          }
        }
      }

      const textToEmbed = `${input.title}\n${input.description}`;
      const embedding = await embedText(textToEmbed);


      const [updatedVideo] = await db
        .update(videos)
        .set({
          title: input.title,
          description: input.description,
          categoryId: input.categoryId,
          communityId: input.communityId,
          visibility:
            input.visibility === "private" || input.visibility === "public"
              ? input.visibility
              : undefined,
          updatedAt: new Date(),
          isAi: input.isAi,
          embedding: embedding,
          tags: input.tags,
        })
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();

      if (!updatedVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return updatedVideo;
    }),

  //to get URL endpoint
  getDirectUpload: protectedProcedure.mutation(async ({ ctx }) => {
    const { success } = await uploadRateLimit.limit(ctx.user.id);
    if (!success) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "You have reached your daily upload limit." });
    }

    const directUpload = await mux.video.uploads.create({
      cors_origin: "*", //TODO: in production change to my url
      new_asset_settings: {
        playback_policy: ["public"],
        passthrough: JSON.stringify({ userId: ctx.user.id }), //identify user in case the resolveUpload method is not executed
        input: [
          {
            generated_subtitles: [
              {
                language_code: "en",
                name: "English",
              },
              {
                language_code: "es",
                name: "Spanish",
              },
            ],
          },
        ],
      },
    });

    return { url: directUpload.url, uploadId: directUpload.id };
  }),

  // Poll Mux for asset_id using the uploadId
  // resolveUpload: protectedProcedure
  //     .input(z.object({ uploadId: z.string() }))
  //     .mutation(async ({ ctx,input }) => {
  //         let assetId: string | null = null;

  //         const du = await mux.video.uploads.retrieve(input.uploadId);
  //         // du?.asset_id appears once Mux has created the asset
  //         if (du?.asset_id) {
  //             assetId = du.asset_id;
  //         }

  //         if (!assetId) throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not ready yet' });

  //         // Optionally fetch asset to get playback IDs (or create one if policy requires)
  //         const asset = await mux.video.assets.retrieve(assetId);
  //         const playbackId = asset.playback_ids?.[0]?.id ?? null;

  //         const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
  //         const previewUrl = `https://image.mux.com/${playbackId}/animated.gif`;
  //         const duration = asset.duration ? Math.round(asset.duration * 1000) : 0;

  //         const video=  await db.insert(videos).values({
  //             userId: ctx.user.id,
  //             muxUploadId: asset.upload_id,
  //             muxAssetId: asset.id,
  //             muxPlaybackId: playbackId,
  //             muxStatus: asset.status,
  //             status: 'private',
  //             title: 'Untitled',
  //             thumbnailUrl,
  //             previewUrl,
  //             duration,
  //         }).onConflictDoUpdate({
  //             target: videos.muxUploadId,
  //             set: {
  //                 muxAssetId: asset.id,
  //                 muxPlaybackId: playbackId,
  //                 muxStatus: asset.status,
  //             },
  //         });
  //         const vid = await db
  //         .select()
  //         .from(videos)
  //         .where(inArray(videos.muxUploadId,asset.upload_id ? [asset.upload_id] : []))
  //         console.log(vid)
  //         return {  video:vid, assetId, playbackId };
  //     }),

  // create: protectedProcedure
  //     .input(z.object(
  //         {
  //             uploadUrl: z.string().nullish(),
  //             uploadId: z.string().nullish(),
  //         }
  //     ))
  //     .mutation(async ({ ctx, input }) => {
  //         // throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "-What?  - Error. This will be reported" });
  //
  //         try {
  //
  //             const { id: userId } = ctx.user;
  //             const [video] = await db.insert(videos).values({
  //                 userId,
  //                 title: "New video title",
  //                 description: "",
  //                 s3Name: "",
  //                 // muxStatus: 'waiting',
  //                 // muxUploadId: input.uploadId,
  //             }).returning();
  //             return {
  //                 video: video,
  //                 url: input.uploadUrl,
  //             };
  //         } catch (error) {
  //             console.error(error);
  //             throw new Error("Failed to create video");
  //         }
  //     }),

  // createAfterUpload: protectedProcedure
  //     .input(z.object({
  //         title: z.string().min(1),
  //     }))
  //     .mutation(async ({ ctx, input }) => {
  //         const { id: userId } = ctx.user;
  //         const { title } = input;

  //         const fileName = (title).replace(/\s/g, '');
  //         const encodedFileName = encodeURIComponent(fileName);

  //         const [row] = await db.insert(videos).values({
  //             title,
  //             userId,
  //             s3Name: encodedFileName,
  //         }).returning();
  //         console.log(row)
  //         return row;
  //     }),

  createAfterUpload: protectedProcedure
    .input(
      z.object({
        bunnyVideoId: z.string(), // Bunny GUID you just uploaded to
        title: z.string().min(1),
        description: z.string().optional(),
        categoryId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id: userId, accountType } = ctx.user;
      const [row] = await db
        .insert(videos)
        .values({
          title: input.title,
          description: input.description,
          userId,
          categoryId: input.categoryId,
          bunnyVideoId: input.bunnyVideoId,
          bunnyLibraryId: process.env.BUNNY_STREAM_LIBRARY_ID!,
          bunnyStatus: "uploaded", // webhook will flip to "ready"
          s3Name: "a",
          isAi: false,
          isFeatured: accountType === 'business',
        })
        .returning();
      return row;
    }),

  updateVideoUrl: protectedProcedure
    .input(
      z.object({
        videoId: z.string().uuid(),
        fileUrl: z.string(),
        thumbnailUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { videoId, fileUrl, thumbnailUrl } = input;

      await db
        .update(videos)
        .set({
          playbackUrl: fileUrl,
          thumbnailUrl,
        })
        .where(eq(videos.id, videoId));
    }),

  getUserByVideoId: baseProcedure
    .input(
      z.object({
        videoId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { videoId } = input;
      console.log("KJADLSKD");
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

      const [creator] = await db
        .with(viewerFollow)
        .select({
          ...getTableColumns(users),
          followsCount:
            sql<number>` (SELECT COUNT(*) FROM ${userFollows} WHERE ${userFollows.creatorId} = ${users.id}) `.mapWith(
              Number
            ),
          viewerIsFollowing: isNotNull(viewerFollow.userId).mapWith(Boolean),
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .leftJoin(viewerFollow, eq(viewerFollow.creatorId, users.id))
        .where(eq(videos.id, videoId))
        .limit(1);

      return creator;
    }),
});
