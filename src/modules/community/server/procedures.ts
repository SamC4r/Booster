import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { userFollows, users, assets } from "@/db/schema";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
    ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)!
      )
    : null;

export const communityRouter = createTRPCRouter({
    getMessages: baseProcedure
        .input(z.object({
            channelId: z.string().uuid(),
            limit: z.number().min(1).max(100).default(20),
            cursor: z.string().nullish(), // timestamp string
        }))
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
                .from('community_messages')
                .select('*')
                .eq('channel_id', channelId)
                .order('created_at', { ascending: false })
                .limit(limit + 1);

            if (cursor) {
                query = query.lt('created_at', cursor);
            }

            const { data: messages, error } = await query;

            if (error) {
                console.error("Supabase error:", error);
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch messages" });
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
            const userIds = [...new Set(messages.map(m => m.user_id))];
            
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
                .flatMap(u => [u.equippedAssetId, u.equippedTitleId])
                .filter((id): id is string => !!id);
            
            const assetsData = assetIds.length > 0 
                ? await db.select().from(assets).where(inArray(assets.assetId, assetIds))
                : [];
            
            const assetMap = new Map(assetsData.map(a => [a.assetId, a]));

            const userMap = new Map(usersData.map(u => {
                const equippedAsset = u.equippedAssetId ? assetMap.get(u.equippedAssetId) : null;
                const equippedTitle = u.equippedTitleId ? assetMap.get(u.equippedTitleId) : null;
                
                return [u.id, {
                    ...u,
                    equippedAsset,
                    equippedTitle
                }];
            }));

            // 3. Combine data
            const enrichedMessages = messages.map(msg => {
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
                    user
                };
            });

            return {
                items: enrichedMessages, // Return newest to oldest for pagination
                nextCursor,
            };
        }),

    sendMessage: protectedProcedure
        .input(z.object({
            channelId: z.string().uuid(),
            content: z.string().min(1).max(1000),
        }))
        .mutation(async ({ ctx, input }) => {
            const { channelId, content } = input;
            const userId = ctx.user.id;

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
                    .where(and(
                        eq(userFollows.userId, userId),
                        eq(userFollows.creatorId, channelId)
                    ));

                if (!follow) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You must follow the channel to send messages.",
                    });
                }
            }

            const { data, error } = await supabaseAdmin
                .from('community_messages')
                .insert({
                    channel_id: channelId,
                    user_id: userId,
                    content,
                })
                .select()
                .single();

            if (error) {
                console.error("Supabase error:", error);
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to send message" });
            }

            return data;
        }),
});
