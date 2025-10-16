import { z } from "zod";
import { db } from "@/db";
import { userFollows, users, videoRatings, videos, videoUpdateSchema, videoViews } from "@/db/schema";
import { createTRPCRouter, protectedProcedure, baseProcedure } from "@/trpc/init";
import { eq, and, getTableColumns, sum, avg, inArray, isNotNull, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { mux } from "@/lib/mux";
import { UTApi } from "uploadthing/server";
import { DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";


const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

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
                        videoCount: sql<number>`(SELECT COUNT(*) FROM ${videos} WHERE ${videos.userId} = ${users.id})`.mapWith(Number),

                        viewerRating: (userId ? sql<number>`(SELECT ${videoRatings.rating} FROM ${videoRatings} WHERE ${videoRatings.userId} = ${userId} AND ${videoRatings.videoId} = ${videos.id} LIMIT 1)`.mapWith(Number) : sql<number>`(NULL)`.mapWith(Number)),


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

    restoreThumbnail: protectedProcedure
        .input(z.object({
            id: z.string().uuid(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user; //db user
            const [existingVideo] = await db
                .select()
                .from(videos)
                .where(and(
                    eq(videos.id, input.id),
                    eq(videos.userId, userId)
                ))
            if (!existingVideo) {
                throw new TRPCError({ code: "NOT_FOUND" })
            }

            if (existingVideo.thumbnailKey) {
                const utapi = new UTApi();

                await utapi.deleteFiles(existingVideo.thumbnailKey);
                await db
                    .update(videos)
                    .set({ thumbnailKey: null, thumbnailUrl: null })
                    .where(
                        and(
                            eq(videos.id, input.id),
                            eq(videos.userId, userId)
                        ));
            }

            if (!existingVideo.id) {
                throw new TRPCError({ code: "BAD_REQUEST" })
            }



            const newThumbnailUrl = `https://image.mux.com/${existingVideo.id}/thumbnail.webp`

            const [updatedVideo] = await db
                .update(videos)
                .set({ thumbnailUrl: newThumbnailUrl })
                .where(and(
                    eq(videos.id, input.id),
                    eq(videos.userId, userId)
                )).returning(); //returning used in updates

            return updatedVideo;

        })

    ,


    remove: protectedProcedure
        .input(z.object({
            id: z.string().uuid(),
        }))
        .mutation(async ({ ctx, input }) => {



            const { id: userId } = ctx.user;
            const [removedVideo] = await db
                .delete(videos)
                .where(and(eq(videos.id, input.id), eq(videos.userId, userId))).returning();

            if (!removedVideo) {
                throw new TRPCError({ code: "NOT_FOUND" });

            }

            const upload_key = `videos/${removedVideo.id}_${removedVideo.userId}_${removedVideo.s3Name}`; // unique key

            console.log("upload_key", upload_key)

            await s3.send(new DeleteObjectCommand({
                Bucket: process.env.AWS_S3_UPLOAD_BUCKET!,
                Key: upload_key,
            }))

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
            return removedVideo

        }),



    update: protectedProcedure
        .input(videoUpdateSchema)
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user;
            if (!input.id) {
                throw new TRPCError({ code: "NOT_FOUND" })
            }
            const [updatedVideo] = await db
                .update(videos)
                .set({
                    title: input.title,
                    description: input.description,
                    categoryId: input.categoryId,
                    visibility: (input.visibility === "private" || input.visibility === "public") ? input.visibility : undefined,
                    updatedAt: new Date(),
                    isAi: input.isAi,
                })
                .where(and(
                    eq(videos.id, input.id),
                    eq(videos.userId, userId),
                ))
                .returning();

            if (!updatedVideo) {
                throw new TRPCError({ code: "NOT_FOUND" })
            }

            return updatedVideo;
        }),

    //to get URL endpoint
    getDirectUpload: protectedProcedure.mutation(async ({ ctx }) => {
        const directUpload = await mux.video.uploads.create({
            cors_origin: "*", //TODO: in production change to my url
            new_asset_settings: {
                playback_policy: ['public'],
                passthrough: JSON.stringify({ userId: ctx.user.id }),  //identify user in case the resolveUpload method is not executed
                input: [
                    {
                        generated_subtitles: [
                            {
                                language_code: "en",
                                name: "English",
                            },
                            {
                                language_code: "es",
                                name: "Spanish"
                            }
                        ]
                    }
                ]
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



    createAfterUpload: protectedProcedure
        .input(z.object({
            title: z.string().min(1),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user;
            const { title } = input;


            const fileName = (title).replace(/\s/g, '');
            const encodedFileName = encodeURIComponent(fileName);

            const [row] = await db.insert(videos).values({
                title,
                userId,
                s3Name: encodedFileName,
            }).returning();
            console.log(row)
            return row;
        }),

    updateVideoUrl: protectedProcedure
        .input(z.object({
            videoId: z.string().uuid(),
            fileUrl: z.string(),
            thumbnailUrl: z.string(),
        }))
        .mutation(async ({ input }) => {
            const { videoId, fileUrl, thumbnailUrl } = input;

            await db
                .update(videos)
                .set({
                    playbackUrl: fileUrl,
                    thumbnailUrl
                })
                .where(eq(videos.id, videoId))

        }),

    getUserByVideoId: baseProcedure
        .input(z.object({
            videoId: z.string().uuid(),
        }))
        .query(async ({ ctx, input }) => {
            const { videoId } = input;
            console.log("KJADLSKD")
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

            const [creator] = await db
                .with(viewerFollow)
                .select({
                    ...getTableColumns(users),
                    followsCount: sql<number>` (SELECT COUNT(*) FROM ${userFollows} WHERE ${userFollows.creatorId} = ${users.id}) `.mapWith(Number),
                    viewerIsFollowing: isNotNull(viewerFollow.userId).mapWith(Boolean),
                })
                .from(videos)
                .innerJoin(users, eq(videos.userId, users.id))
                .leftJoin(viewerFollow, eq(viewerFollow.creatorId, users.id))
                .where(eq(videos.id, videoId))
                .limit(1)

            return creator;

        })
});

