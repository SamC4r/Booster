import { db } from "@/db";
import { users, commentReactions, } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { inArray, and, eq } from "drizzle-orm";
import z from "zod";

export const commentReactionsRouter = createTRPCRouter({
    create: protectedProcedure
        .input(z.object({
            commentId: z.string().uuid(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { clerkUserId } = ctx;
            const { commentId } = input;

            // console.log(commentId)
            const [user] = await db
                .select()
                .from(users)
                .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))

            if (!user) {
                throw new TRPCError({ code: "UNAUTHORIZED" })
            }

            const userId = user.id;

            const commentReaction = await db
                .insert(commentReactions)
                .values({
                    commentId,
                    userId,
                }).returning();
            return commentReaction
        }),

    delete: protectedProcedure
        .input(z.object({
            commentId: z.string().uuid(),
        }))
        .mutation(async ({ ctx, input }) => {

            const { clerkUserId } = ctx;
            const { commentId } = input;

            const [user] = await db
                .select()
                .from(users)
                .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))

            if (!user) {
                throw new TRPCError({ code: "UNAUTHORIZED" })
            }


            const commentReaction = await db
                .delete(commentReactions)
                .where(and(
                    eq(commentReactions.commentId, commentId),
                    eq(commentReactions.userId, user.id)
                )).returning()

            return commentReaction
        })

})