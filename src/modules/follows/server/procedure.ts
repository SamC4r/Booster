import { db } from "@/db";
import { userFollows, users } from "@/db/schema";
import {
  createTRPCRouter,
  protectedProcedure,
  baseProcedure,
} from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { sql, eq, and, inArray, getTableColumns, isNotNull } from "drizzle-orm";
import { get } from "http";
import z from "zod";

export const followsRouter = createTRPCRouter({
  getFollowersByUserId: baseProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { userId: creatorId } = input;
      const { clerkUserId } = ctx;


      let userId;

      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))

      if(user) userId = user.id

   
      const [followers] = await db
        .select({
          id: sql<number>`${creatorId}`.mapWith(Number),
          followsCount: sql<number>` (SELECT COUNT(*) FROM ${userFollows} WHERE ${userFollows.creatorId} = ${creatorId}) `.mapWith(Number),
          viewerIsFollowing: 
          (userId ? sql<boolean>`EXISTS ( SELECT 1 FROM ${userFollows} WHERE ${userFollows.creatorId} = ${creatorId} AND ${userFollows.userId} = ${userId} )`.mapWith(Boolean)
                :
          sql<boolean>`NULL`.mapWith(Boolean)),
        })
        .from(userFollows)
        .where(inArray(userFollows.creatorId, [creatorId]));

        // console.log(followers)

      return followers;
    }),

  create: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { userId: creatorId } = input;
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "log in to follow",
        });
      }

      if (user.id === creatorId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot follow yourself",
        });
      }

      const [follow] = await db
        .insert(userFollows)
        .values({
          userId: user.id,
          creatorId: creatorId,
        })
        .onConflictDoNothing()
        .returning();

      if (!follow) {
        //already exists
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already following this user",
        });
      }

      return follow;
    }),

  delete: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { userId: creatorId } = input;
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "log in to follow",
        });
      }
      if (user.id === creatorId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot follow yourself",
        });
      }

      const [follow] = await db
        .delete(userFollows)
        .where(
          and(
            eq(userFollows.userId, user.id),
            eq(userFollows.creatorId, creatorId)
          )
        )
        .returning();

      if (!follow) {
        // does not exist
        throw new TRPCError({
          code: "CONFLICT",
          message: "Follow does not exist",
        });
      }

      //update
      return follow;
    }),

  getMany: baseProcedure.query(async ({ ctx }) => {
    const { clerkUserId } = ctx;
    let userId;

    const [user] = await db
      .select()
      .from(users)
      .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));

    if (user) {
      userId = user.id;
    }

    const following = await db
      .select({
        ...getTableColumns(userFollows),
        user: {
          ...getTableColumns(users),
          followsCount:
            sql<number>` (SELECT COUNT(*) FROM ${userFollows} WHERE ${userFollows.creatorId} = ${users.id}) `.mapWith(
              Number
            ),
        },
      })
      .from(userFollows)
      .leftJoin(users, eq(userFollows.creatorId, users.id))
      .where(inArray(userFollows.userId, userId ? [userId] : []));

    // console.log(following,userId,clerkUserId)
    return following;
  }),
});
