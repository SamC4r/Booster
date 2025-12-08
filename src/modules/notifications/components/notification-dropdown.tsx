'use client';

import { trpc } from "@/trpc/client";
import { UserAvatar } from "@/components/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { CheckCheck, MessageCircle, UserPlus, X, Mail, Rocket, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationDropdown } from "@/contexts/notification-context";
import { MessageChat } from "@/modules/messages/ui/components/message-chat";

interface NotificationDropdownProps {
    onClose: () => void;
    onNotificationRead: () => void;
}

export const NotificationDropdown = ({ onClose, onNotificationRead }: NotificationDropdownProps) => {
    const { activeTab, setActiveTab, selectedUserId, clearSelectedUser, openMessages } = useNotificationDropdown();
    const { data: notifications, isLoading } = trpc.notifications.getNotifications.useQuery();
    const { data: conversations, isLoading: isLoadingConversations } = trpc.messages.getConversations.useQuery();
    const { data: unreadMessagesCount } = trpc.messages.getUnreadCount.useQuery();
    const utils = trpc.useUtils();

    const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
        onSuccess: () => {
            utils.notifications.getNotifications.invalidate();
            utils.notifications.getUnreadCount.invalidate();
            onNotificationRead();
        },
    });

    const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
        onSuccess: () => {
            utils.notifications.getNotifications.invalidate();
            utils.notifications.getUnreadCount.invalidate();
            onNotificationRead();
        },
    });

    const handleMarkAsRead = (notificationId: string) => {
        markAsReadMutation.mutate({ notificationId });
    };

    const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate();
    };

    const getNotificationIcon = (type: 'follow' | 'comment' | 'reply' | 'boost') => {
        switch (type) {
            case 'follow':
                return <UserPlus className="size-4 text-blue-500" />;
            case 'comment':
                return <MessageCircle className="size-4 text-green-500" />;
            case 'reply':
                return <MessageCircle className="size-4 text-purple-500" />;
            case 'boost':
                return <Rocket className="size-4 text-orange-500" />;
        }
    };

    const getNotificationText = (notification: any) => {
        switch (notification.type) {
            case 'follow':
                return `${notification.relatedUser?.name || 'Someone'} started following you`;
            case 'comment':
                return `${notification.relatedUser?.name || 'Someone'} commented on your video "${notification.video?.title || 'your video'}"`;
            case 'reply':
                return `${notification.relatedUser?.name || 'Someone'} replied to your comment`;
            case 'boost':
                return `${notification.relatedUser?.name || 'Someone'} boosted your channel with ${notification.boostAmount || 0} XP`;
            default:
                return 'New notification';
        }
    };

    const getNotificationLink = (notification: any) => {
        switch (notification.type) {
            case 'follow':
                return `/users/${notification.relatedUserId}`;
            case 'comment':
            case 'reply':
                return `/videos/${notification.videoId}`;
            case 'boost':
                return `/users/${notification.userId}`; // Navigate to the boosted user's channel
            default:
                return '#';
        }
    };

    return (
        <div className="absolute right-0 top-full mt-2 w-[400px] max-w-[calc(100vw-2rem)] bg-background border border-border rounded-lg shadow-2xl z-50 overflow-hidden">
            {/* Header with Tabs */}
            <div className="border-b border-border bg-muted/50">
                <div className="flex items-center justify-between p-4 pb-2">
                    <h3 className="font-semibold text-lg">Messages & Notifications</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        aria-label="Close"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                
                {/* Tabs */}
                <div className="flex px-4 pb-2">
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`
                            flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                            ${activeTab === 'notifications' 
                                ? 'bg-background text-foreground border-t border-x border-border' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }
                        `}
                    >
                        <Mail className="size-4" />
                        Notifications
                        {notifications && notifications.length > 0 && (
                            <span className="bg-blue-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                {notifications.filter(n => !n.isRead).length || notifications.length}
                            </span>
                        )}
                    </button>
                    
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`
                            flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                            ${activeTab === 'messages' 
                                ? 'bg-background text-foreground border-t border-x border-border' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }
                        `}
                    >
                        <MessageSquare className="size-4" />
                        DMs
                        {unreadMessagesCount && unreadMessagesCount > 0 && (
                            <span className="bg-green-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'notifications' ? (
                <>
                    {/* Mark All Read Button */}
                    {notifications && notifications.length > 0 && (
                        <div className="px-4 py-2 border-b border-border bg-muted/30">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                disabled={markAllAsReadMutation.isPending}
                                className="text-xs w-full"
                            >
                                <CheckCheck className="size-4 mr-1" />
                                Mark all as read
                            </Button>
                        </div>
                    )}

                    {/* Notification List */}
                    <ScrollArea className="max-h-[500px]">
                        {isLoading ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                <p className="mt-2">Loading notifications...</p>
                            </div>
                        ) : notifications && notifications.length > 0 ? (
                            <div className="divide-y divide-border">
                                {notifications.map((notification) => (
                                    <Link
                                        key={notification.id}
                                        href={getNotificationLink(notification)}
                                        onClick={() => {
                                            if (!notification.isRead) {
                                                handleMarkAsRead(notification.id);
                                            }
                                            onClose();
                                        }}
                                        className={`
                                            flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors
                                            ${!notification.isRead ? 'bg-blue-500/5' : ''}
                                        `}
                                    >
                                        {/* User Avatar */}
                                        <div className="flex-shrink-0">
                                            {notification.relatedUser && (
                                                <UserAvatar
                                                    imageUrl={notification.relatedUser.imageUrl}
                                                    name={notification.relatedUser.name}
                                                    size="sm"
                                                    userId={notification.relatedUserId || ''}
                                                    disableLink={true}
                                                />
                                            )}
                                        </div>

                                        {/* Notification Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start gap-2">
                                                {getNotificationIcon(notification.type)}
                                                <p className="text-sm flex-1">
                                                    {getNotificationText(notification)}
                                                </p>
                                            </div>
                                            
                                            {/* Comment Preview */}
                                            {notification.comment && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    &quot;{notification.comment.comment}&quot;
                                                </p>
                                            )}
                                            
                                            {/* Timestamp */}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>

                                        {/* Unread Indicator */}
                                        {!notification.isRead && (
                                            <div className="flex-shrink-0">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">
                                <Mail className="size-12 mx-auto mb-2 opacity-50" />
                                <p className="font-medium">No notifications yet</p>
                                <p className="text-sm mt-1">When you get notifications, they&apos;ll show up here</p>
                            </div>
                        )}
                    </ScrollArea>
                </>
            ) : (
                /* DMs Tab Content */
                selectedUserId ? (
                    /* Show chat interface for selected user */
                    <MessageChat
                        userId={selectedUserId}
                        onBack={clearSelectedUser}
                        onClose={onClose}
                    />
                ) : (
                    /* Show conversations list */
                    <ScrollArea className="max-h-[500px]">
                        {isLoadingConversations ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                <p className="mt-2">Loading conversations...</p>
                            </div>
                        ) : conversations && conversations.length > 0 ? (
                            <div className="divide-y divide-border">
                                {conversations.map((conversation) => (
                                    <button
                                        key={conversation.userId}
                                        onClick={() => openMessages(conversation.userId)}
                                        className={`
                                            w-full flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors text-left
                                            ${conversation.unreadCount > 0 ? 'bg-green-500/5' : ''}
                                        `}
                                    >
                                        {/* User Avatar */}
                                        <div className="flex-shrink-0">
                                            <UserAvatar
                                                imageUrl={conversation.userImageUrl}
                                                name={conversation.userName}
                                                size="md"
                                                userId={conversation.userId}
                                                disableLink={true}
                                            />
                                        </div>

                                        {/* Message Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-medium text-sm truncate">
                                                    {conversation.userName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true })}
                                                </p>
                                            </div>
                                            
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {conversation.lastMessageContent}
                                            </p>
                                        </div>

                                        {/* Unread Indicator */}
                                        {conversation.unreadCount > 0 && (
                                            <div className="flex-shrink-0">
                                                <div className="bg-green-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1">
                                                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">
                                <MessageSquare className="size-12 mx-auto mb-2 opacity-50" />
                                <p className="font-medium">No messages yet</p>
                                <p className="text-sm mt-1">Start a conversation with users you follow!</p>
                            </div>
                        )}
                    </ScrollArea>
                )
            )}
        </div>
    );
};
