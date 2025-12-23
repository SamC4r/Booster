import { createTRPCRouter } from "@/trpc/init";
import { protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { messages, users, userFollows } from "@/db/schema";
import { z } from "zod";
import { and, eq, or, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";

// We need the SECRET key (service_role) for the backend to bypass RLS and write messages
// If you named it SUPABASE_SECRET_KEY in your .env, we use that.
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
    ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)!
      )
    : null;

export const messagesRouter = createTRPCRouter({
    // Get conversations list (users you've exchanged messages with)
    getConversations: protectedProcedure
        .query(async ({ ctx }) => {
            const currentUserId = ctx.user.id;

            if (!supabaseAdmin) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Supabase client not initialized",
                });
            }

            // 1. Get the latest message for each conversation from Supabase
            const { data: recentMessages, error } = await supabaseAdmin
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error("Supabase error:", error);
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch conversations" });
            }

            // 2. Process messages to find unique conversation partners
            const conversationMap = new Map();
            
            for (const msg of recentMessages) {
                const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
                
                if (!conversationMap.has(otherUserId)) {
                    conversationMap.set(otherUserId, {
                        lastMessage: msg,
                        unreadCount: 0
                    });
                }

                if (msg.receiver_id === currentUserId && !msg.is_read) {
                    conversationMap.get(otherUserId).unreadCount++;
                }
            }

            const otherUserIds = Array.from(conversationMap.keys());

            if (otherUserIds.length === 0) {
                return [];
            }

            // 3. Fetch user details from Neon for these IDs
            const usersList = await db
                .select({
                    id: users.id,
                    name: users.name,
                    imageUrl: users.imageUrl,
                    clerkId: users.clerkId,
                })
                .from(users)
                .where(sql`${users.id} IN ${otherUserIds}`);

            // 4. Combine the data
            const conversations = usersList.map(user => {
                const convData = conversationMap.get(user.id);
                return {
                    userId: user.id,
                    userName: user.name,
                    userImageUrl: user.imageUrl,
                    userClerkId: user.clerkId,
                    lastMessageContent: convData.lastMessage.content,
                    lastMessageTime: new Date(convData.lastMessage.created_at),
                    lastMessageSenderId: convData.lastMessage.sender_id,
                    unreadCount: convData.unreadCount,
                };
            }).sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());

            return conversations;
        }),

    // Get messages with a specific user
    getMessagesWithUser: protectedProcedure
        .input(z.object({ otherUserId: z.string().uuid() }))
        .query(async ({ input, ctx }) => {
            const currentUserId = ctx.user.id;
            const { otherUserId } = input;

            if (!supabaseAdmin) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Supabase client not initialized" });
            }

            // Verify both users follow each other
            const mutualFollow = await db
                .select()
                .from(userFollows)
                .where(
                    or(
                        and(
                            eq(userFollows.userId, currentUserId),
                            eq(userFollows.creatorId, otherUserId)
                        ),
                        and(
                            eq(userFollows.userId, otherUserId),
                            eq(userFollows.creatorId, currentUserId)
                        )
                    )
                );

            if (mutualFollow.length < 2) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Both users must follow each other to exchange messages",
                });
            }

            // Get messages from Supabase
            const { data: messagesList, error } = await supabaseAdmin
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
                .order('created_at', { ascending: true });

            if (error) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
            }

            // Mark messages as read in Supabase
            await supabaseAdmin
                .from('messages')
                .update({ is_read: true })
                .match({ sender_id: otherUserId, receiver_id: currentUserId, is_read: false });

            return messagesList.map(msg => ({
                id: msg.id,
                content: msg.content,
                senderId: msg.sender_id,
                receiverId: msg.receiver_id,
                isRead: msg.is_read,
                createdAt: new Date(msg.created_at),
                senderName: "", // UI handles this
                senderImageUrl: "", // UI handles this
            }));
        }),

    // Send a message
    sendMessage: protectedProcedure
        .input(z.object({
            receiverId: z.string().uuid(),
            content: z.string().min(1).max(1000),
        }))
        .mutation(async ({ input, ctx }) => {
            const senderId = ctx.user.id;
            const { receiverId, content } = input;

            if (!supabaseAdmin) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Supabase client not initialized" });
            }

            // 1. Save to Supabase
            const { data, error } = await supabaseAdmin
                .from('messages')
                .insert({
                    sender_id: senderId,
                    receiver_id: receiverId,
                    content: content,
                    is_read: false,
                })
                .select()
                .single();

            if (error) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
            }

            return {
                ...data,
                createdAt: new Date(data.created_at),
                senderId: data.sender_id,
                receiverId: data.receiver_id,
                isRead: data.is_read
            };
        }),

    // Get users that the current user can message (mutual follows)
    getMutualFollows: protectedProcedure
        .query(async ({ ctx }) => {
            const currentUserId = ctx.user.id;

            // Get users where both follow each other
            const mutualFollowers = await db
                .select({
                    id: users.id,
                    name: users.name,
                    imageUrl: users.imageUrl,
                    clerkId: users.clerkId,
                })
                .from(userFollows)
                .innerJoin(users, eq(userFollows.creatorId, users.id))
                .where(eq(userFollows.userId, currentUserId))
                .innerJoin(
                    sql`${userFollows} as reverse_follows`,
                    sql`reverse_follows.user_id = ${userFollows.creatorId} AND reverse_follows.creator_id = ${currentUserId}`
                );

            return mutualFollowers;
        }),

    // Get unread message count
    getUnreadCount: protectedProcedure
        .query(async ({ ctx }) => {
            const currentUserId = ctx.user.id;

            if (!supabaseAdmin) {
                return 0;
            }

            const { count, error } = await supabaseAdmin
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', currentUserId)
                .eq('is_read', false);

            if (error) {
                console.error("Supabase error:", error);
                return 0;
            }

            return count || 0;
        }),

    // Mark messages as read
    markAsRead: protectedProcedure
        .input(z.object({ otherUserId: z.string().uuid() }))
        .mutation(async ({ input, ctx }) => {
            const currentUserId = ctx.user.id;
            const { otherUserId } = input;

            if (!supabaseAdmin) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Supabase client not initialized" });
            }

            const { error } = await supabaseAdmin
                .from('messages')
                .update({ is_read: true })
                .match({ sender_id: otherUserId, receiver_id: currentUserId, is_read: false });

            if (error) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
            }

            return { success: true };
        }),
});
