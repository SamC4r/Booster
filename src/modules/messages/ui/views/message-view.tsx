'use client';

import { trpc } from "@/trpc/client";
import { UserAvatar } from "@/components/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";

interface MessageViewProps {
    userId: string;
}

export const MessageView = ({ userId }: MessageViewProps) => {
    const [messageContent, setMessageContent] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const utils = trpc.useUtils();
    const { user } = useUser();
    const { getToken } = useAuth();
    const supabase = createClient();

    // Get the other user's details
    const { data: otherUser } = trpc.users.getByUserId.useQuery({ userId });
    
    // Get messages
    const { data: messages, isLoading } = trpc.messages.getMessagesWithUser.useQuery(
        { otherUserId: userId }
    );

    // Subscribe to real-time messages
    useEffect(() => {
        if (!user || !userId) return;

        const setupRealtime = async () => {
            // Try to get the Supabase token from Clerk if configured
            // If not configured, this might return null, which is fine if RLS allows anon
            try {
                const token = await getToken({ template: 'supabase' });
                if (token) {
                    supabase.realtime.setAuth(token);
                }
            } catch (e) {
                console.error("Failed to get Supabase token:", e);
            }

            // Use a unique channel ID for this conversation "Room"
            const channelId = [user.id, userId].sort().join('-');

            const handleNewMessage = (payload: any) => {
                const msg = payload.new;
                // Check if this message belongs to the current conversation
                // We listen to all messages involving us, so we filter here
                const isRelevant = 
                    (msg.sender_id === userId && msg.receiver_id === user.id) || // Incoming from them
                    (msg.sender_id === user.id && msg.receiver_id === userId);   // Outgoing to them (sync from other tabs)

                if (isRelevant) {
                    // Optimistically update the cache instead of invalidating
                    utils.messages.getMessagesWithUser.setData(
                        { otherUserId: userId },
                        (oldData) => {
                            // Avoid duplicates if we already added it via mutation
                            if (oldData?.some(m => m.id === msg.id)) return oldData;
                            
                            if (!oldData) return [];
                            const newMessage = {
                                id: msg.id,
                                content: msg.content,
                                senderId: msg.sender_id,
                                receiverId: msg.receiver_id,
                                isRead: msg.is_read,
                                createdAt: new Date(msg.created_at),
                                senderName: msg.sender_id === userId ? (otherUser?.name || "") : (user.fullName || ""),
                                senderImageUrl: msg.sender_id === userId ? (otherUser?.imageUrl || "") : (user.imageUrl || ""),
                            };
                            return [...oldData, newMessage];
                        }
                    );
                    
                    // Still invalidate others to keep them fresh eventually
                    utils.messages.getConversations.invalidate();
                    utils.messages.getUnreadCount.invalidate();
                }
            };

            const channel = supabase
                .channel(`chat:${channelId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `receiver_id=eq.${user.id}`, // Listen for incoming messages
                    },
                    handleNewMessage
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `sender_id=eq.${user.id}`, // Listen for outgoing messages (sync)
                    },
                    handleNewMessage
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        const cleanupPromise = setupRealtime();

        return () => {
            cleanupPromise.then(cleanup => cleanup && cleanup());
        };
    }, [user, userId, utils, supabase, otherUser, getToken]);

    // Send message mutation
    const sendMessageMutation = trpc.messages.sendMessage.useMutation({
        onMutate: async (newMessage) => {
            // Cancel outgoing refetches
            await utils.messages.getMessagesWithUser.cancel({ otherUserId: userId });

            // Snapshot previous value
            const previousMessages = utils.messages.getMessagesWithUser.getData({ otherUserId: userId });

            // Optimistically update to the new value
            utils.messages.getMessagesWithUser.setData(
                { otherUserId: userId },
                (old) => {
                    const optimisticMessage = {
                        id: 'optimistic-' + Date.now(),
                        content: newMessage.content,
                        senderId: user?.id || '',
                        receiverId: userId,
                        isRead: false,
                        createdAt: new Date(),
                        senderName: user?.fullName || '',
                        senderImageUrl: user?.imageUrl || '',
                    };
                    return old ? [...old, optimisticMessage] : [optimisticMessage];
                }
            );

            setMessageContent(""); // Clear input immediately
            
            // Scroll to bottom immediately
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 10);

            return { previousMessages };
        },
        onError: (err, newMessage, context) => {
            // Rollback
            utils.messages.getMessagesWithUser.setData(
                { otherUserId: userId },
                context?.previousMessages
            );
            setMessageContent(newMessage.content); // Restore input
        },
        onSettled: () => {
            // Refetch to ensure sync
            utils.messages.getMessagesWithUser.invalidate({ otherUserId: userId });
            utils.messages.getConversations.invalidate();
        },
    });

    // Scroll to bottom on initial load and when new messages arrive
    useEffect(() => {
        if (messages && messages.length > 0) {
            scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageContent.trim()) return;

        sendMessageMutation.mutate({
            receiverId: userId,
            content: messageContent.trim(),
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#212121] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="size-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading messages...</p>
                </div>
            </div>
        );
    }

    if (!otherUser) {
        return (
            <div className="min-h-screen bg-[#212121] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 font-medium">User not found</p>
                    <Link href="/" className="text-primary hover:underline mt-2 inline-block">
                        Go back home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#212121] text-white">
            <div className="max-w-4xl mx-auto h-screen flex flex-col">
                {/* Header */}
                <div className="bg-[#333333] border-b border-gray-700 p-4 flex items-center gap-3">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="rounded-full">
                            <ArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    
                    <Link href={`/users/${userId}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
                        <UserAvatar
                            imageUrl={otherUser.imageUrl}
                            name={otherUser.name}
                            size="md"
                            userId={userId}
                            disableLink={true}
                        />
                        <div>
                            <h2 className="font-semibold">{otherUser.name}</h2>
                            <p className="text-xs text-gray-400">Click to view profile</p>
                        </div>
                    </Link>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages && messages.length > 0 ? (
                            messages.map((message) => {
                                const isOwnMessage = message.senderId !== userId;
                                return (
                                    <div
                                        key={message.id}
                                        className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                                    >
                                        {!isOwnMessage && (
                                            <UserAvatar
                                                imageUrl={message.senderImageUrl}
                                                name={message.senderName}
                                                size="sm"
                                                userId={message.senderId}
                                                disableLink={true}
                                            />
                                        )}
                                        
                                        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                            <div
                                                className={`rounded-2xl px-4 py-2 ${
                                                    isOwnMessage
                                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                                        : 'bg-[#333333] text-white'
                                                }`}
                                            >
                                                <p className="text-sm break-words">{message.content}</p>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <p className="font-medium mb-2">No messages yet</p>
                                <p className="text-sm">Start the conversation!</p>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="bg-[#333333] border-t border-gray-700 p-4">
                    <div className="flex gap-2">
                        <Input
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-[#212121] border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-amber-500"
                            maxLength={1000}
                            disabled={sendMessageMutation.isPending}
                        />
                        <Button
                            type="submit"
                            disabled={!messageContent.trim() || sendMessageMutation.isPending}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full px-6"
                        >
                            {sendMessageMutation.isPending ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Send className="size-4" />
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        You can only message users who mutually follow each other
                    </p>
                </form>
            </div>
        </div>
    );
};
