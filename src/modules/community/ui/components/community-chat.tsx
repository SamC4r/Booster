"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { trpc } from "@/trpc/client";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { Send, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { UserTitle, UserIcon } from "@/components/user-badges";

interface CommunityChatProps {
  channelId: string;
  isFollowing: boolean;
}

export const CommunityChat = ({ channelId, isFollowing }: CommunityChatProps) => {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const supabase = createClient();

  // Scroll refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const didInitialScrollRef = useRef(false);

  // Typing indicator state
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const typingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const channelRef = useRef<any>(null);
  const lastTypedRef = useRef<number>(0);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = trpc.community.getMessages.useInfiniteQuery(
    { channelId, limit: 20 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const allMessages = data?.pages.flatMap((p) => p.items).reverse() || [];

  const sendMessageMutation = trpc.community.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      shouldAutoScrollRef.current = true;
    },
    onError: (error) => toast.error(error.message),
  });

  const utils = trpc.useUtils();

  useEffect(() => {
    didInitialScrollRef.current = false;
    shouldAutoScrollRef.current = true;
  }, [channelId]);

  useEffect(() => {
    const channel = supabase
      .channel(`community-chat:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        () => {
          utils.community.getMessages.invalidate({ channelId });
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        const { userId, username } = payload.payload;
        if (!user || userId === user.id) return;

        if (typingTimeoutsRef.current[userId]) clearTimeout(typingTimeoutsRef.current[userId]);

        setTypingUsers((prev) => ({ ...prev, [userId]: username }));

        typingTimeoutsRef.current[userId] = setTimeout(() => {
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
          delete typingTimeoutsRef.current[userId];
        }, 3000);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, supabase, utils, user?.id]);

  const scrollToBottom = (behavior: ScrollBehavior) => {
    if (!scrollRef.current) return;
    
    const targetScrollTop = scrollRef.current.scrollHeight;

    if (behavior === "smooth") {
      scrollRef.current.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });
    } else {
      scrollRef.current.scrollTop = targetScrollTop;
    }
  };

  // Initial load + new messages
  useLayoutEffect(() => {
    if (isLoading) return;

    if (!didInitialScrollRef.current && allMessages.length > 0) {
      scrollToBottom("auto");
      didInitialScrollRef.current = true;
    } else if (shouldAutoScrollRef.current) {
      scrollToBottom("smooth");
    }
  }, [allMessages, isLoading]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate({ channelId, content: message });
  };

  const handleTyping = () => {
    const now = Date.now();
    if (now - lastTypedRef.current > 2000 && channelRef.current) {
      lastTypedRef.current = now;
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          userId: user?.id,
          username: user?.username || user?.fullName || "Someone",
        },
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Scroll handler: updates auto-scroll intent + handles pagination at top
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;


    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    
    // Only auto-scroll if user is very close to the bottom (e.g. reading the latest messages)
    const isAtBottom = distanceFromBottom <= 20;
    shouldAutoScrollRef.current = isAtBottom;

    if (target.scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
      const oldHeight = target.scrollHeight;
      // user is explicitly reading history, so don't auto-scroll down during this
      shouldAutoScrollRef.current = false;

      fetchNextPage().then(() => {
        // Restore scroll position after prepending older messages
        requestAnimationFrame(() => {
          const newHeight = target.scrollHeight;
          target.scrollTop = newHeight - oldHeight;
        });
      });
    }
  };

  if (!isFollowing && user?.id !== channelId) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] border rounded-lg bg-background p-4 text-center text-muted-foreground">
        <p>Follow this channel to join the community chat.</p>
      </div>
    );
  }

  const typingUsernames = Object.values(typingUsers);
  const typingText =
    typingUsernames.length === 1
      ? `${typingUsernames[0]} is typing...`
      : typingUsernames.length > 1
      ? `${typingUsernames.length} people are typing...`
      : "";

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-background">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Community Chat</h3>
      </div>

      <div
        className="flex-1 p-4 overflow-y-auto"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        <div className="space-y-4" ref={contentRef}>
          {hasNextPage && (
            <div className="flex justify-center p-2">
              {isFetchingNextPage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Button variant="ghost" size="sm" onClick={() => fetchNextPage()}>
                  Load previous messages
                </Button>
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center">
              <Loader2 className="animate-spin" />
            </div>
          )}

          {allMessages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <UserAvatar
                imageUrl={msg.user.imageUrl}
                name={msg.user.username || msg.user.name}
                userId={msg.user.id}
                size="md"
              />
              <div className="flex flex-col w-full">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {msg.user.username ? "@" + msg.user.username : msg.user.name}
                  </span>
                  
                  {msg.user.equippedAsset && (
                    <UserIcon iconNumber={msg.user.equippedAsset.iconNumber} />
                  )}

                  <span className="text-xs text-muted-foreground ml-1">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {msg.user.equippedTitle && (
                  <UserTitle title={msg.user.equippedTitle.name} className="w-fit" />
                )}

                <p className="text-sm break-all mt-0.5">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* sentinel */}
          <div ref={endRef} />
        </div>
      </div>

      <div className="px-4 pb-2 min-h-[20px]">
        {typingText && (
          <p className="text-xs text-muted-foreground animate-pulse">{typingText}</p>
        )}
      </div>

      <div className="p-4 border-t flex gap-2">
        <Input
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Send a message..."
          disabled={sendMessageMutation.isPending}
        />
        <Button
          onClick={handleSend}
          disabled={sendMessageMutation.isPending || !message.trim()}
        >
          {sendMessageMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
