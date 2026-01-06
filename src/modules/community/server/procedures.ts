import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { userFollows, users, assets, communities, communityMembers, communityModerators, videos } from "@/db/schema";
import { z } from "zod";
import { and, eq, inArray, desc, lt, count, getTableColumns, not } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";
import { UTApi } from "uploadthing/server";
import { COMMUNITY_CREATION_LIMIT } from "@/constants";

import { messageRateLimit } from "@/lib/ratelimit";

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
    ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)!
      )
    : null;

export const communityRouter = createTRPCRouter({
  getJoined: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.id;

      const joinedCommunities = await db
        .select({
          community: communities,
        })
        .from(communityMembers)
        .innerJoin(communities, eq(communityMembers.communityId, communities.communityId))
        .where(eq(communityMembers.userId, userId));

      const communitiesWithVideos = await Promise.all(
        joinedCommunities.map(async ({ community }) => {
          const recentVideos = await db
            .select({
              video: videos,
              user: {
                id: users.id,
                name: users.name,
                imageUrl: users.imageUrl,
              },
            })
            .from(videos)
            .innerJoin(users, eq(videos.userId, users.id))
            .where(
              and(
                eq(videos.communityId, community.communityId),
                eq(videos.visibility, "public")
              )
            )
            .limit(10)
            .orderBy(desc(videos.createdAt));

          return {
            ...community,
            recentVideos,
          };
        })
      );

      return communitiesWithVideos;
    }),

  getMany: baseProcedure
    .input(
      z.object({
        categoryId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish().nullable(),
      })
    )
    .query(async ({ input }) => {
      const { categoryId, limit, cursor } = input;

      const data = await db
        .select({
          ...getTableColumns(communities),
          membersCount: count(communityMembers.communityId),
        })
        .from(communities)
        .leftJoin(
          communityMembers,
          eq(communities.communityId, communityMembers.communityId)
        )
        .groupBy(communities.communityId)
        .where(
          and(
            categoryId ? eq(communities.categoryId, categoryId) : undefined,
            cursor ? lt(communities.createdAt, new Date(cursor)) : undefined
          )
        )
        .limit(limit + 1)
        .orderBy(desc(communities.createdAt));

      let nextCursor: string | undefined = undefined;
      if (data.length > limit) {
        const nextItem = data.pop();
        if (nextItem) {
          nextCursor = nextItem.createdAt.toISOString();
        }
      }

      return {
        items: data,
        nextCursor,
      };
    }),

  get: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [community] = await db
        .select()
        .from(communities)
        .where(eq(communities.communityId, input.id));

      if (!community) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Check if user is a member
      let isMember = false;
      let isModerator = false;
      if (ctx.clerkUserId) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, ctx.clerkUserId));

        if (user) {
          const [membership] = await db
            .select()
            .from(communityMembers)
            .where(
              and(
                eq(communityMembers.communityId, input.id),
                eq(communityMembers.userId, user.id)
              )
            );
          isMember = !!membership;

          const [moderatorship] = await db
            .select()
            .from(communityModerators)
            .where(
              and(
                eq(communityModerators.communityId, input.id),
                eq(communityModerators.userId, user.id)
              )
            );
          isModerator = !!moderatorship;
        }
      }

      // Get member count
      const [memberCount] = await db
        .select({ count: count() })
        .from(communityMembers)
        .where(eq(communityMembers.communityId, input.id));

      // Get moderators
      const moderators = await db
        .select({
          userId: communityModerators.userId,
          user: {
            name: users.name,
            imageUrl: users.imageUrl,
            username: users.username,
          },
        })
        .from(communityModerators)
        .innerJoin(users, eq(communityModerators.userId, users.id))
        .where(eq(communityModerators.communityId, input.id));

      return {
        ...community,
        isMember,
        isModerator,
        memberCount: memberCount.count,
        moderators,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3).max(50),
        description_short: z.string().max(200).optional(),
        description_long: z.string().max(2000).optional(),
        categoryId: z.string().uuid().optional(),
        banner_url: z.string().url().optional(),
        icon_url: z.string().url().optional(),
        rules: z.string().max(1000).optional(),
        is_private: z.boolean().optional(),
        allow_user_posts: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      // COMMUNITY CREATION LIMIT IS SET TO 4
      // Check if user has reached the limit of 4 communities
      const [userCommunities] = await db
        .select({ count: count() })
        .from(communityMembers)
        .where(and(eq(communityMembers.userId, userId), eq(communityMembers.role, "admin")));

      if (userCommunities && userCommunities.count >= COMMUNITY_CREATION_LIMIT) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You have reached the limit of 4 communities created.",
        });
      }

      // Create community
      const [community] = await db
        .insert(communities)
        .values({
          name: input.name,
          description_short: input.description_short,
          description_long: input.description_long,
          categoryId: input.categoryId,
          banner_url: input.banner_url,
          icon_url: input.icon_url,
          rules: input.rules,
          isPrivate: input.is_private,
          allowUserPosts: input.allow_user_posts,
        })
        .returning();

      // Add creator as member and moderator
      await db.insert(communityMembers).values({
        communityId: community.communityId,
        userId,
        role: "admin", // Keep role for backward compatibility or extra info
      });

      await db.insert(communityModerators).values({
        communityId: community.communityId,
        userId,
      });

      return community;
    }),

  update: protectedProcedure
    .input(
      z.object({
        //ignore this horrible implementation. Just laugh at it :)
        communityId: z.string().uuid().nullable(),
        name: z.string().min(3).max(50).optional().nullable(),
        description_short: z.string().max(200).optional().nullable(),
        description_long: z.string().max(2000).optional().nullable(),
        categoryId: z.string().uuid().optional().nullable(),
        banner_url: z.string().url().or(z.literal("")).optional().nullable(),
        icon_url: z.string().url().or(z.literal("")).optional().nullable(),
        rules: z.string().max(1000).optional().nullable(),
        isPrivate: z.boolean().optional().nullable(),
        allowUserPosts: z.boolean().optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      const {
        name,
        communityId,
        description_short,
        description_long,
        categoryId,
        banner_url,
        icon_url,
        rules,
        isPrivate,
        allowUserPosts,
      } = input;

      // Check if user is moderator
      const [moderatorship] = await db
        .select()
        .from(communityModerators)
        .where(
          and(
            eq(communityModerators.communityId, communityId || ""),
            eq(communityModerators.userId, userId)
          )
        );

      if (!moderatorship) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only moderators can update community settings.",
        });
      }



      //To delete the old images from upload thing. 
      const [existingCommunity] = await db
        .select()
        .from(communities)
        .where(eq(communities.communityId, communityId || ""));

      if (existingCommunity) {
        const utapi = new UTApi();
        
        if (banner_url === "" && existingCommunity.banner_url) {
          const key = existingCommunity.banner_url.split("/").pop();
          if (key) await utapi.deleteFiles(key);
        }

        if (icon_url === "" && existingCommunity.icon_url) {
          const key = existingCommunity.icon_url.split("/").pop();
          if (key) await utapi.deleteFiles(key);
        }
      }

      const [updatedCommunity] = await db
        .update(communities)
        .set({
          name: name || "",
          description_short,
          description_long,
          categoryId,
          banner_url,
          icon_url,
          rules,
          isPrivate: isPrivate ?? false,
          allowUserPosts: allowUserPosts ?? true,
          updatedAt: new Date(),
        })
        .where(eq(communities.communityId, communityId || ""))
        .returning();

      return updatedCommunity;
    }),

  addModerator: protectedProcedure
    .input(
      z.object({
        communityId: z.string().uuid(),
        username: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const actorId = ctx.user.id;

      // Check if actor is moderator
      const [actorModeratorship] = await db
        .select()
        .from(communityModerators)
        .where(
          and(
            eq(communityModerators.communityId, input.communityId),
            eq(communityModerators.userId, actorId)
          )
        );

      if (!actorModeratorship) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only moderators can add other moderators.",
        });
      }

      // Find user by username
      const [userToAdd] = await db
        .select()
        .from(users)
        .where(eq(users.username, input.username));

      if (!userToAdd) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      // Add to moderators table
      await db
        .insert(communityModerators)
        .values({
          communityId: input.communityId,
          userId: userToAdd.id,
        })
        .onConflictDoNothing();

      return { success: true };
    }),

  removeModerator: protectedProcedure
    .input(
      z.object({
        communityId: z.string().uuid(),
        userId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const actorId = ctx.user.id;

      // Check if actor is moderator
      const [actorModeratorship] = await db
        .select()
        .from(communityModerators)
        .where(
          and(
            eq(communityModerators.communityId, input.communityId),
            eq(communityModerators.userId, actorId)
          )
        );

      if (!actorModeratorship) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only moderators can remove moderators.",
        });
      }

      // Remove from moderators table
      await db
        .delete(communityModerators)
        .where(
          and(
            eq(communityModerators.communityId, input.communityId),
            eq(communityModerators.userId, input.userId)
          )
        );

      return { success: true };
    }),

  getModerators: baseProcedure
    .input(
      z.object({
        communityId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const moderators = await db
        .select({
          userId: communityModerators.userId,
          createdAt: communityModerators.createdAt,
          user: {
            id: users.id,
            name: users.name,
            username: users.username,
            image: users.imageUrl,
          },
        })
        .from(communityModerators)
        .innerJoin(users, eq(communityModerators.userId, users.id))
        .where(eq(communityModerators.communityId, input.communityId));

      return moderators;
    }),

  join: protectedProcedure
    .input(z.object({ communityId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      await db
        .insert(communityMembers)
        .values({
          communityId: input.communityId,
          userId,
        })
        .onConflictDoNothing();

      return { success: true };
    }),

  leave: protectedProcedure
    .input(z.object({ communityId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      await db
        .delete(communityMembers)
        .where(
          and(
            eq(communityMembers.communityId, input.communityId),
            eq(communityMembers.userId, userId)
          )
        );

      return { success: true };
    }),

  getVideos: baseProcedure
    .input(
      z.object({
        communityId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ input }) => {
      const { communityId, limit, cursor } = input;

      const data = await db
        .select({
          video: videos,
          user: {
            id: users.id,
            name: users.name,
            imageUrl: users.imageUrl,
            username: users.username,
          },
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .where(
          and(
            eq(videos.communityId, communityId),
            cursor ? lt(videos.createdAt, new Date(cursor)) : undefined,
            eq(videos.visibility, "public"),
          eq(videos.status, "completed"),          )
        )
        .limit(limit + 1)
        .orderBy(desc(videos.createdAt));

      let nextCursor: string | undefined = undefined;
      if (data.length > limit) {
        const nextItem = data.pop();
        if (nextItem) {
          nextCursor = nextItem.video.createdAt.toISOString();
        }
      }

      return {
        items: data,
        nextCursor,
      };
    }),

  getMessages: baseProcedure
    .input(
      z.object({
        channelId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(), // timestamp string
      })
    )
    .query(async ({ input }) => {
      const { channelId, limit, cursor } = input;

      if (!supabaseAdmin) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Supabase client not initialized",
        });
      }

      // 1. Fetch messages from Supabase
      let query = supabaseAdmin
        .from("community_messages")
        .select("*")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .limit(limit + 1);

      if (cursor) {
        query = query.lt("created_at", cursor);
      }

      const { data: messages, error } = await query;

      if (error) {
        console.error("Supabase error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch messages",
        });
      }

      if (!messages || messages.length === 0) {
        return { items: [], nextCursor: undefined };
      }

      let nextCursor: string | undefined = undefined;
      if (messages.length > limit) {
        const nextItem = messages.pop();
        if (nextItem) {
          nextCursor = nextItem.created_at;
        }
      }

      // 2. Fetch user details from Neon
      const userIds = [...new Set(messages.map((m) => m.user_id))];

      const usersData = await db
        .select({
          id: users.id,
          name: users.name,
          imageUrl: users.imageUrl,
          username: users.username,
          equippedAssetId: users.equippedAssetId,
          equippedTitleId: users.equippedTitleId,
        })
        .from(users)
        .where(inArray(users.id, userIds));

      // Fetch assets (icons and titles)
      const assetIds = usersData
        .flatMap((u) => [u.equippedAssetId, u.equippedTitleId])
        .filter((id): id is string => !!id);

      const assetsData =
        assetIds.length > 0
          ? await db
              .select()
              .from(assets)
              .where(inArray(assets.assetId, assetIds))
          : [];

      const assetMap = new Map(assetsData.map((a) => [a.assetId, a]));

      const userMap = new Map(
        usersData.map((u) => {
          const equippedAsset = u.equippedAssetId
            ? assetMap.get(u.equippedAssetId)
            : null;
          const equippedTitle = u.equippedTitleId
            ? assetMap.get(u.equippedTitleId)
            : null;

          return [
            u.id,
            {
              ...u,
              equippedAsset,
              equippedTitle,
            },
          ];
        })
      );

      // 3. Combine data
      const enrichedMessages = messages.map((msg) => {
        const user = userMap.get(msg.user_id) || {
          id: msg.user_id,
          name: "Unknown User",
          imageUrl: "",
          username: "unknown",
          equippedAsset: null,
          equippedTitle: null,
        };

        return {
          id: msg.id,
          content: msg.content,
          createdAt: new Date(msg.created_at),
          user,
        };
      });

      return {
        items: enrichedMessages, // Return newest to oldest for pagination
        nextCursor,
      };
    }),

  removeVideo: protectedProcedure
    .input(z.object({
      videoId: z.string().uuid(),
      communityId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { videoId, communityId } = input;
      const { id: userId } = ctx.user;

      // Check if user is moderator
      const [moderatorship] = await db
        .select()
        .from(communityModerators)
        .where(
          and(
            eq(communityModerators.communityId, communityId),
            eq(communityModerators.userId, userId)
          )
        );

      if (!moderatorship) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not a moderator of this community" });
      }

      // Update video
      await db
        .update(videos)
        .set({ communityId: null })
        .where(
          and(
            eq(videos.id, videoId),
            eq(videos.communityId, communityId)
          )
        );

      return { success: true };
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        channelId: z.string().uuid(),
        content: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { channelId, content } = input;
      const userId = ctx.user.id;

      const { success } = await messageRateLimit.limit(userId);

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "You are sending messages too fast",
        });
      }

      if (!supabaseAdmin) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Supabase client not initialized",
        });
      }

      // Check if user follows the channel or is the owner
      if (userId !== channelId) {
        const [follow] = await db
          .select()
          .from(userFollows)
          .where(
            and(
              eq(userFollows.userId, userId),
              eq(userFollows.creatorId, channelId)
            )
          );

        if (!follow) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You must follow the channel to send messages.",
          });
        }
      }

      const { data, error } = await supabaseAdmin
        .from("community_messages")
        .insert({
          channel_id: channelId,
          user_id: userId,
          content,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message",
        });
      }

      return data;
    }),
});
