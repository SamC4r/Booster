import { db } from "@/db";
import { commentReactions, comments, users, videos, notifications } from "@/db/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { eq, getTableColumns, inArray, desc, sql, or, and, lt, isNull, asc, gt } from "drizzle-orm";
import z from "zod";
import { updateVideoScore } from "@/modules/videos/server/utils";
import { commentRateLimit } from "@/lib/ratelimit";

export const commentsRouter = createTRPCRouter({
  getTopLevel: baseProcedure
    .input(z.object({
      videoId: z.string().uuid(),               
      cursor: z.object({
        updatedAt: z.date(),
        commentId: z.string().uuid(),           
      }).nullish(),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { videoId, cursor, limit } = input;

      let userId;
      const [user] = await db.select().from(users).where(inArray(users.clerkId, ctx.clerkUserId ? [ctx.clerkUserId] : []));

      if (user) {
        userId = user.id;
      }

      const likesSql = sql<number>`( select count(*)::int from ${commentReactions} cr where cr.comment_id = ${comments.commentId})`;
      const viewerLikedSql = user ? sql<boolean>`exists ( select 1 from ${commentReactions} cr2 where cr2.comment_id = ${comments.commentId} and cr2.user_id = ${userId})` : sql<boolean>`false`;
      const [{ total }] = await db .select({ total: sql<number>`COUNT(*)`.mapWith(Number) }) .from(comments) .where(eq(comments.videoId, videoId));
      
      const rows = await db
        .select({
          ...getTableColumns(comments),
          user: { ...getTableColumns(users) },
          commentLikes: likesSql.mapWith(Number),
          viewerLiked: viewerLikedSql.mapWith(Boolean),
          
          //to count how many comments the video has for the UI
        })
        .from(comments)
        .innerJoin(users, eq(users.id, comments.userId))
        .where(and(
          eq(comments.videoId, videoId),
          isNull(comments.parentId),
          cursor
            ? or(
              lt(comments.updatedAt, cursor.updatedAt),                 // older than cursor
              and(
                eq(comments.updatedAt, cursor.updatedAt),               // same time -> tie-break
                lt(comments.commentId, cursor.commentId)                // lexicographic on UUID
              )
            )
            : undefined
        ))
        .orderBy(desc(comments.updatedAt), desc(comments.commentId))       // <- matches cursor
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, -1) : rows;
      const last = items[items.length - 1];

      return {
        comments: items,
        viewer: user,
        commentCount:total,
        nextCursor: hasMore
          ? { updatedAt: last.updatedAt, commentId: last.commentId }
          : null,
      };

    }),

  getReplies: baseProcedure
    .input(z.object({
      commentId: z.string().uuid(),               
      videoId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.object({
        updatedAt: z.date(),
        commentId: z.string().uuid(),           
      }).nullish(),
    }))
    .query(async ({ ctx, input }) => {
      const { commentId, cursor, limit,videoId } = input;

      // auth

      let userId;
      const [user] = await db.select().from(users).where(inArray(users.clerkId, ctx.clerkUserId ? [ctx.clerkUserId] : []));

      if (user) {
        userId = user.id;
      }


      const likesSql = sql<number>`( select count(*)::int from ${commentReactions} cr where cr.comment_id = ${comments.commentId})`;
      const viewerLikedSql = user ? sql<boolean>`exists ( select 1 from ${commentReactions} cr2 where cr2.comment_id = ${comments.commentId} and cr2.user_id = ${userId})` : sql<boolean>`false`;

      const rows = await db
        .select({
          ...getTableColumns(comments),
          user: { ...getTableColumns(users) },
          commentLikes: likesSql.mapWith(Number),
          viewerLiked: viewerLikedSql.mapWith(Boolean),
          //TODO: consider putting commentCount in video fetch? --> more difficult to acess it in comment section component
          // hasReplies: sql<boolean>`exists ( select 1 from ${commentReplies} cr2 where cr2.replying_to_id = ${comments.commentId} )`.mapWith(Boolean),
          // repliesCount: sql<number>` ( select count(*)::int from ${commentReplies} cr3 where cr3.replying_to_id = ${comments.commentId}) `.mapWith(Number),
        })
        .from(comments)
        .innerJoin(users, eq(users.id, comments.userId))
        .where(and(
          eq(comments.videoId, videoId),         // keep if you include videoId in input
          eq(comments.parentId,commentId),
          cursor
            ? or(
              gt(comments.updatedAt, cursor.updatedAt),                 // older than cursor
              and(
                eq(comments.updatedAt, cursor.updatedAt),               // same time -> tie-break
                gt(comments.commentId, cursor.commentId)                // lexicographic on UUID
              )
            )
            : undefined
        ))
        .orderBy(asc(comments.updatedAt), asc(comments.commentId))       // <- matches cursor
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, -1) : rows;
      const last = items[items.length - 1];



      const [{ total }] = await db .select({ total: sql<number>`COUNT(*)`.mapWith(Number) }) .from(comments) .where(eq(comments.videoId, videoId));

      return {
        comments: items,
        viewer: user,
        commentCount: total,
        nextCursor: hasMore
          ? { updatedAt: last.updatedAt, commentId: last.commentId }
          : null,
      };
    }),
  //create does not need prefetch REMEMBER
  create: protectedProcedure
    .input(z.object({
      videoId: z.string().uuid(),
      comment: z.string().min(1).max(2000)
    }))
    .mutation(async ({ ctx, input }) => {

      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, ctx.clerkUserId ? [ctx.clerkUserId] : []))

      let userId;
      if (user) {
        userId = user.id
      } else {
        throw new TRPCError({ code: "UNAUTHORIZED" })
      }

      const { success } = await commentRateLimit.limit(userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "You are commenting too fast." });
      }

      const { videoId, comment } = input;

      const [createdComment] = await db
        .insert(comments)
        .values({
          userId: userId,
          videoId: videoId,
          comment: comment,
        }).returning()

      // Create notification for video owner (if not commenting on own video)
      const [video] = await db
        .select({ userId: videos.userId })
        .from(videos)
        .where(eq(videos.id, videoId));

      if (video && video.userId !== userId) {
        await db.insert(notifications).values({
          userId: video.userId, // Video owner
          type: 'comment',
          relatedUserId: userId, // Commenter
          videoId: videoId,
          commentId: createdComment.commentId,
        });
      }

      // Update video comment count and score
      await db.update(videos)
        .set({ commentCount: sql`${videos.commentCount} + 1` })
        .where(eq(videos.id, videoId));
      await updateVideoScore(videoId);

      return createdComment;
    }),

    createReply: protectedProcedure
    .input(z.object({
      videoId: z.string().uuid(),
      parentId: z.string().uuid(),
      comment: z.string().min(1).max(2000)
    }))
    .mutation(async ({ ctx, input }) => {

      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, ctx.clerkUserId ? [ctx.clerkUserId] : []))

      let userId;
      if (user) {
        userId = user.id
      } else {
        throw new TRPCError({ code: "UNAUTHORIZED" })
      }

      const { videoId, comment,parentId } = input;

      const [createdComment] = await db
        .insert(comments)
        .values({
          userId,
          videoId,
          parentId,
          comment,
        }).returning()

        if(!createdComment) return;
        
        // Get parent comment to notify its author
        const [parentComment] = await db
          .select({ userId: comments.userId })
          .from(comments)
          .where(eq(comments.commentId, parentId));

        // Create notification for parent comment author (if not replying to own comment)
        if (parentComment && parentComment.userId !== userId) {
          await db.insert(notifications).values({
            userId: parentComment.userId, // Parent comment author
            type: 'reply',
            relatedUserId: userId, // Replier
            videoId: videoId,
            commentId: createdComment.commentId,
          });
        }

        //TODO: update parent Id replies count

        // const [replies] = await db
        // .select({
        //   count: comments.replies
        // })
        // .from(comments)
        // .where(eq(comments.commentId,parentId))

        console.log("updating replies on comment", parentId)
        await db
        .update(comments)
          .set({ 
            replies: sql`${comments.replies} + 1`
          }).where(eq(comments.commentId,parentId))
        .returning()

      // Update video comment count and score
      await db.update(videos)
        .set({ commentCount: sql`${videos.commentCount} + 1` })
        .where(eq(videos.id, videoId));
      await updateVideoScore(videoId);

      return createdComment;
    }),

  remove: protectedProcedure
    .input(z.object({
      commentId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { commentId } = input;

      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, ctx.clerkUserId ? [ctx.clerkUserId]: []));

      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const [commentToDelete] = await db
        .select()
        .from(comments)
        .where(eq(comments.commentId, commentId));

      if (!commentToDelete) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (commentToDelete.userId !== user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Delete the comment
      const [deletedComment] = await db
        .delete(comments)
        .where(eq(comments.commentId, commentId))
        .returning();

      // If it was a reply, decrement parent's reply count
      if (deletedComment.parentId) {
        await db
          .update(comments)
          .set({ replies: sql`${comments.replies} - 1` })
          .where(eq(comments.commentId, deletedComment.parentId));
      }

      // Decrement video comment count
      // We need to subtract 1 (the comment itself) + the number of replies it had
      const totalDeleted = 1 + deletedComment.replies;
      await db
        .update(videos)
        .set({ commentCount: sql`${videos.commentCount} - ${totalDeleted}` })
        .where(eq(videos.id, deletedComment.videoId));

      // Update video score
      await updateVideoScore(deletedComment.videoId);

      return deletedComment;
    }),

  update: protectedProcedure
    .input(z.object({
      commentId: z.string().uuid(),
      comment: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const { commentId, comment } = input;

      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, ctx.clerkUserId ? [ctx.clerkUserId]: []));

      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const [existingComment] = await db
        .select()
        .from(comments)
        .where(eq(comments.commentId, commentId));

      if (!existingComment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existingComment.userId !== user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const [updatedComment] = await db
        .update(comments)
        .set({ comment, updatedAt: new Date() })
        .where(eq(comments.commentId, commentId))
        .returning();

      return updatedComment;
    }),

})