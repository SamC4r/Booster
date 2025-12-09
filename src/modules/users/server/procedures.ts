import { db } from "@/db";
import {  users, videoRatings, videos, videoViews, userAssets, assets } from "@/db/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { desc,eq, getTableColumns, inArray, sql, and } from "drizzle-orm";
import z from "zod";

export const usersRouter = createTRPCRouter({
    

    getByClerkId: protectedProcedure
    .input(z.object({clerkId: z.string().nullish()}))
    .query(async ({input}) => {
        const {clerkId} = input;
        const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkId ? [clerkId] : []));
        

        if(!user) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: `User with clerkId ${input.clerkId} not found`
            });
        }

        return user;
    }),

     getByUserId: baseProcedure
    .input(z.object({userId: z.string().uuid()}))
    .query(async ({input}) => {
        const {userId} = input;

        const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.id, userId ? [userId] : []));

        if(!user) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: `User with clerkId ${userId} not found`
            });
        }

        return user;
    }),

   getVideosByUserId: baseProcedure
  .input(z.object({ userId: z.string().uuid() }))
  .query(async ({ input }) => {
    const { userId } = input;

    const [user] = await db
      .select()
      .from(users)
      .where(inArray(users.id, userId ? [userId] : []));
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `User with id ${userId} not found`, // ← was "clerkId"
      });
    }

    const userVideos = await db
      .select({
        ...getTableColumns(videos),
        videoViews: sql<number>`
          COALESCE((
            SELECT SUM(${videoViews.seen})
            FROM ${videoViews}
            WHERE ${videoViews.videoId} = ${videos.id}
          ), 0)
        `.mapWith(Number),

        averageRating: sql<number> `(SELECT AVG(${videoRatings.rating}) FROM ${videoRatings} WHERE ${videoRatings.videoId} = ${videos.id})`.mapWith(Number),
        
      })
      .from(videos)
      .where(eq(videos.userId, userId))
      .orderBy(desc(videos.createdAt));

    return { userVideos,  };
  }),

  // Equip an asset (must be owned by user)
  equipAsset: protectedProcedure
    .input(z.object({ 
      assetId: z.string().uuid().nullable() // null to unequip
    }))
    .mutation(async ({ input, ctx }) => {
      const { assetId } = input;
      const userId = ctx.user.id;

      // If equipping an asset, verify user owns it
      if (assetId) {
        const [ownership] = await db
          .select()
          .from(userAssets)
          .where(and(
            eq(userAssets.userId, userId),
            eq(userAssets.assetId, assetId)
          ));

        if (!ownership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't own this asset"
          });
        }
      }

      // Update user's equipped asset
      const [updatedUser] = await db
        .update(users)
        .set({ equippedAssetId: assetId })
        .where(eq(users.id, userId))
        .returning();

      return updatedUser;
    }),

  // Equip a title (must be owned by user)
  equipTitle: protectedProcedure
    .input(z.object({ 
      assetId: z.string().uuid().nullable() // null to unequip
    }))
    .mutation(async ({ input, ctx }) => {
      const { assetId } = input;
      const userId = ctx.user.id;

      // If equipping a title, verify user owns it
      if (assetId) {
        const [ownership] = await db
          .select()
          .from(userAssets)
          .where(and(
            eq(userAssets.userId, userId),
            eq(userAssets.assetId, assetId)
          ));

        if (!ownership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't own this title"
          });
        }
      }

      // Update user's equipped title
      const [updatedUser] = await db
        .update(users)
        .set({ equippedTitleId: assetId })
        .where(eq(users.id, userId))
        .returning();

      return updatedUser;
    }),

  // Get user's currently equipped asset
  getEquippedAsset: baseProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      const { userId } = input;

      const [user] = await db
        .select({
          equippedAssetId: users.equippedAssetId
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user || !user.equippedAssetId) {
        return null;
      }

      // Fetch the actual asset details
      const [asset] = await db
        .select()
        .from(assets)
        .where(eq(assets.assetId, user.equippedAssetId));

      return asset || null;
    }),

  // Get user's currently equipped title
  getEquippedTitle: baseProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      const { userId } = input;

      const [user] = await db
        .select({
          equippedTitleId: users.equippedTitleId
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user || !user.equippedTitleId) {
        return null;
      }

      // Fetch the actual asset details
      const [asset] = await db
        .select()
        .from(assets)
        .where(eq(assets.assetId, user.equippedTitleId));

      return asset || null;
    }),

  // getAssetsByUser

})