import { db } from "@/db";
import { users, videoRatings, videos, videoViews, userAssets, assets } from "@/db/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { desc, eq, getTableColumns, inArray, sql, and } from "drizzle-orm";
import z from "zod";

export const usersRouter = createTRPCRouter({


  getByClerkId: protectedProcedure
    .input(z.object({ clerkId: z.string().nullish() }))
    .query(async ({ input }) => {
      const { clerkId } = input;
      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkId ? [clerkId] : []));


      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `User with clerkId ${input.clerkId} not found`
        });
      }

      return user;
    }),

  getByUserId: baseProcedure
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
          message: `User with clerkId ${userId} not found`
        });
      }

      return user;
    }),

  getVideosByUserId: baseProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { userId } = input;
      const { clerkUserId } = ctx;

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

      // Fetch viewer settings
      let viewerSettings = null;
      if (clerkUserId) {
        const [viewer] = await db
          .select({ aiContentEnabled: users.aiContentEnabled })
          .from(users)
          .where(eq(users.clerkId, clerkUserId));
        viewerSettings = viewer;
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
        .where(and(
          eq(videos.userId, userId),
          viewerSettings?.aiContentEnabled === false ? eq(videos.isAi, false) : undefined
        ))
        .orderBy(desc(videos.createdAt));

      return { userVideos, };
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

  toggleRewardedAds: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const { enabled } = input;
      const userId = ctx.user.id;
      // Check if user is business account
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (user?.accountType === 'business') {
        // Business accounts cannot disable rewarded ads (featured videos)
        // They are always enabled
        return user;
      }

      const [updatedUser] = await db
        .update(users)
        .set({ rewardedAdsEnabled: enabled })
        .where(eq(users.id, userId))
        .returning();

      return updatedUser;
    }),

  toggleVerticalVideos: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const { enabled } = input;
      const userId = ctx.user.id;

      const [updatedUser] = await db
        .update(users)
        .set({ verticalVideosEnabled: enabled })
        .where(eq(users.id, userId))
        .returning();

      return updatedUser;
    }),

  toggleAiContent: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const { enabled } = input;
      const userId = ctx.user.id;

      const [updatedUser] = await db
        .update(users)
        .set({ aiContentEnabled: enabled })
        .where(eq(users.id, userId))
        .returning();

      return updatedUser;
    }),

  // getAssetsByUser

  setAccountType: protectedProcedure
    .input(z.object({
      accountType: z.enum(['personal', 'business'])
    }))
    .mutation(async ({ input, ctx }) => {
      const { accountType } = input;
      const userId = ctx.user.id;

      // Verify user is a business account

      const [user] = await db
        .select({ accountType: users.accountType })
        .from(users)
        .where(eq(users.id, userId));

      if (user.accountType !== null) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Account type has already been set and cannot be changed"
        });
      }

      await db.update(users)
        .set({ accountType })
        .where(eq(users.id, userId));

      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      name: z.string().max(50).optional(),
      about: z.string().max(2000).optional(),
      instagram: z.string().max(100).optional(),
      twitter: z.string().max(100).optional(),
      youtube: z.string().max(200).optional(),
      tiktok: z.string().max(100).optional(),
      discord: z.string().max(100).optional(),
      website: z.string().max(200).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { name, about, instagram, twitter, youtube, tiktok, discord, website } = input;
      const userId = ctx.user.id;

      if (name !== undefined || about !== undefined || instagram !== undefined || twitter !== undefined || youtube !== undefined || tiktok !== undefined || discord !== undefined || website !== undefined) {

        let nameToUpdate = name;
        if (name !== undefined) {
          let trimmedName = name.trim();
          if (!trimmedName) {
            if (ctx.user.username && ctx.user.username.trim()) {
              trimmedName = ctx.user.username;
            } else {
              trimmedName = `Anonymous ${Math.floor(Math.random() * 100000)}`;
            }
          }
          nameToUpdate = trimmedName.substring(0, 50);
        }

        await db.update(users)
          .set({
            ...(nameToUpdate !== undefined && { name: nameToUpdate }),
            ...(about !== undefined && { about }),
            ...(instagram !== undefined && { instagram }),
            ...(twitter !== undefined && { twitter }),
            ...(youtube !== undefined && { youtube }),
            ...(tiktok !== undefined && { tiktok }),
            ...(discord !== undefined && { discord }),
            ...(website !== undefined && { website }),
          })
          .where(eq(users.id, userId));
      }

      return { success: true };
    }),

  updateBusinessProfile: protectedProcedure
    .input(z.object({
      businessDescription: z.string().max(5000).optional(),
      businessImageUrls: z.array(z.string().url().max(500)).max(10).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { businessDescription, businessImageUrls } = input;
      const userId = ctx.user.id;

      // Verify user is a business account
      const [user] = await db
        .select({ accountType: users.accountType })
        .from(users)
        .where(eq(users.id, userId));

      if (!user || user.accountType !== 'business') {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only business accounts can update business profile"
        });
      }

      await db.update(users)
        .set({
          ...(businessDescription !== undefined && { businessDescription }),
          ...(businessImageUrls !== undefined && { businessImageUrls }),
        })
        .where(eq(users.id, userId));

      return { success: true };
    }),

})