import { z } from "zod";
import { db } from "@/db";
import { commentReactions, comments, userFollows, users, videoRatings, videos, videoUpdateSchema, videoViews } from "@/db/schema";
import { createTRPCRouter, protectedProcedure, baseProcedure } from "@/trpc/init";
import { eq,and, getTableColumns, sum, avg, inArray, isNotNull, count, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { mux } from "@/lib/mux";
import { UTApi } from "uploadthing/server";
import { isHeadersProtocol } from "@mux/mux-node/core.mjs";

export const videosRouter = createTRPCRouter({
    //.query() para queries
    //.mutation() para editar algo en db

    //TODO: separate comment fetch from video

    getOne: baseProcedure
    .input(z.object({id: z.string().uuid()}))
    .query(async ({input,ctx}) => {

        const {clerkUserId}  = ctx;
        let userId;

        const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId,clerkUserId ? [clerkUserId] : [])) //trick

        if(user){
            userId = user.id;
        }

        const viewerFollow = db.$with("viewer_follow").as(
            db
            .select()
            .from(userFollows)
            .where(inArray(userFollows.userId,userId ? [userId] : []))
        )

      


        const[existingVideo] = await db
        .with(viewerFollow)
        .select({
            ...getTableColumns(videos), //instead of ...videos
            user: {
                ...getTableColumns(users),
                followsCount: sql<number>` (SELECT COUNT(*) FROM ${userFollows} WHERE ${userFollows.creatorId} = ${users.id}) `.mapWith(Number),
                viewerIsFollowing: isNotNull(viewerFollow.userId).mapWith(Boolean),
                videoCount: sql<number>`(SELECT COUNT(*) FROM ${videos} WHERE ${videos.userId} = ${users.id})`.mapWith(Number),
                viewerRating: sql<number>`(SELECT ${videoRatings.rating} FROM ${videoRatings} WHERE ${videoRatings.userId} = ${userId} AND ${videoRatings.videoId} = ${videos.id} LIMIT 1)`.mapWith(Number) 

            },
            videoRatings: db.$count(videoRatings, eq(videoRatings.videoId,videos.id)), //inefficient?
        })
        .from(videos)
        .innerJoin(users,eq(videos.userId,users.id))
        .leftJoin(viewerFollow,eq(viewerFollow.creatorId,users.id))
        .where(
            eq(videos.id,input.id)
        )
        //inner join to get data of user

        if(!existingVideo){
            throw new TRPCError({code: "NOT_FOUND"})
        }

        const [viewCount] = await db
        .select({
                count: sum(videoViews.seen)
            })
        .from(videoViews)
        .where(eq(videoViews.videoId,input.id))



        
        const [averageRating] = await db
        .select({
                averageRating: avg(videoRatings.rating)
            }).from(videoRatings)
        .where(eq(videoRatings.videoId,input.id))



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
        .mutation(async ({ctx,input}) => {
            const {id: userId } = ctx.user; //db user
            const [ existingVideo ] = await db
            .select()
            .from(videos)
            .where(and(
                eq(videos.id,input.id),
                eq(videos.userId,userId)
            ))
            if(!existingVideo){
                throw new TRPCError({code: "NOT_FOUND"})
            }
            
            if(existingVideo.thumbnailKey){
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

            if(!existingVideo.muxPlaybackId){
                throw new TRPCError({code: "BAD_REQUEST"})
            }



            const newThumbnailUrl = `https://image.mux.com/${existingVideo.muxPlaybackId}/thumbnail.jpg`

            const [updatedVideo] = await db
            .update(videos)
            .set({thumbnailUrl: newThumbnailUrl})
            .where(and(
               eq(videos.id,input.id),
                eq(videos.userId,userId) 
            )).returning(); //returning used in updates

            return updatedVideo;

        })
        
        ,
    
 remove:protectedProcedure
    .input(z.object({id:z.string().uuid()}))
    .mutation(async ({ctx,input}) => {
        const {id:userId} = ctx.user;
        const [removedVideo] = await db
        .delete(videos)
        .where(and(eq(videos.id,input.id),eq(videos.userId,userId))).returning();
        if(!removedVideo){
            throw new TRPCError({code: "NOT_FOUND"})
        }
        return removedVideo;
    }),
    update: protectedProcedure
    .input(videoUpdateSchema)
    .mutation(async ({ctx,input}) => {
        const {id: userId} = ctx.user;
        if(!input.id){
            throw new TRPCError({code: "NOT_FOUND"})
        }
        const [updatedVideo] = await db
        .update(videos)
        .set({
                title:input.title,
                description:input.description,
                categoryId:input.categoryId,
                visibility: (input.visibility === "private" || input.visibility === "public") ? input.visibility : undefined,
                updatedAt: new Date(),
            })
        .where(and(
            eq(videos.id,input.id),
            eq(videos.userId,userId),
        ))
        .returning();

        if(!updatedVideo){
            throw new TRPCError({code: "NOT_FOUND"})
        }

        return updatedVideo;
    }),

    create: protectedProcedure.mutation(async ({ctx}) => {
        // throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "-What?  - Error. This will be reported" });
        
        try {
            const {id: userId} = ctx.user;

            const upload = await mux.video.uploads.create({
                new_asset_settings: {
                    passthrough: userId, //beacuse we need to wait for a webhook to wait for it to upload. We identify it by user id so we know who uploaded it 
                    playback_policy: ["public"],
                    input: [
                        {
                            generated_subtitles: [
                                {
                                    language_code: "en",
                                    name: "English",
                                }
                            ]
                        }
                    ]
                    // mp4_support: "standard",
                },
                cors_origin: "*", //TODO: In production set to my url
            });

            const [video] = await db.insert(videos).values({
                userId,
                title: "Untitiled",
                description: "",
                muxStatus: 'waiting',
                muxUploadId: upload.id
            }).returning();
            return {
                video:video, 
                url: upload.url,
            };
        } catch (error) {
            console.error(error);
            throw new Error("Failed to create video");
        }
    }),
});
