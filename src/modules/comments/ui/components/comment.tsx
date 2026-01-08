'use client';

import { InfiniteScroll } from "@/components/infinite-scroll";
import { UserAvatar } from "@/components/user-avatar";
import { COMMENT_REPLIES_SIZE, COMMENT_SECTION_SIZE, } from "@/constants";
import { compactDate, compactNumber } from "@/lib/utils";
import { UserInfo } from "@/modules/users/ui/components/user-info";
import { UserTitle } from "@/modules/users/ui/components/user-title";
import { CommentOutput } from "@/modules/videos/types";
import { trpc } from "@/trpc/client";
import { useClerk, useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, MoreHorizontal, ChevronDown, ChevronUp, Trash2, Edit2 } from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import { useClampDetector } from "../../hooks/resize-hook";
import { CommentReplyInput } from "./comment-reply-input";
import { User } from "@/modules/users/types";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

type Comment = CommentOutput[0];

interface CommentProps {
    parentComment: Comment;
    videoId: string;
    viewer?: User;
    isPending: boolean;
    depth: number;
    maxDepth: number;
}



export const Comment = ({ parentComment, videoId, viewer, depth, maxDepth }: CommentProps) => {
    const clerk = useClerk();
    const utils = trpc.useUtils();
    const { isSignedIn } = useAuth();
    const isTemp = parentComment.commentId.startsWith("temp-");
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const { setRefFor, isClamped } = useClampDetector();
    const [replyingTo, setReplyingTo] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(parentComment.comment);

    const remove = trpc.comments.remove.useMutation({
        onSuccess: () => {
            toast.success("Comment deleted");
            utils.comments.getTopLevel.invalidate({ videoId, limit: COMMENT_SECTION_SIZE });
            if (parentComment.parentId) {
                utils.comments.getReplies.invalidate({ commentId: parentComment.parentId, videoId, limit: COMMENT_REPLIES_SIZE });
            }
        },
        onError: () => {
            toast.error("Failed to delete comment");
        }
    });

    const update = trpc.comments.update.useMutation({
        onSuccess: () => {
            toast.success("Comment updated");
            setIsEditing(false);
            utils.comments.getTopLevel.invalidate({ videoId, limit: COMMENT_SECTION_SIZE });
            if (parentComment.parentId) {
                utils.comments.getReplies.invalidate({ commentId: parentComment.parentId, videoId, limit: COMMENT_REPLIES_SIZE });
            }
        },
        onError: () => {
            toast.error("Failed to update comment");
        }
    });

    const handleUpdate = () => {
        if (!editedText.trim()) return;
        update.mutate({ commentId: parentComment.commentId, comment: editedText });
    }

    // Determine if the current viewer is the comment author
    // const isViewerCommentAuthor = viewer?.id === parentComment.userId;

    const {
        data: repliesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isFetching,
    } = trpc.comments.getReplies.useInfiniteQuery(
        { videoId, commentId: parentComment.commentId, limit: COMMENT_REPLIES_SIZE },
        {
            getNextPageParam: (last) => last?.nextCursor,
            enabled: open && !isTemp,
            staleTime: 30_000,
        }
    );

    const replies = useMemo(
        () => repliesData ? repliesData.pages.flatMap(p => p.comments) : [],
        [repliesData]
    );

    const prefetchReplies = useCallback(() => {
        if (isTemp) return;
        utils.comments.getReplies.prefetchInfinite({ commentId: parentComment.commentId, videoId, limit: COMMENT_REPLIES_SIZE });
    }, [utils, parentComment.commentId, videoId, isTemp]);

    const listKey = { commentId: parentComment.parentId, videoId, limit: COMMENT_REPLIES_SIZE };

    const { mutate: commentAddReply, isPending: isReplying } = trpc.comments.createReply.useMutation({
        onError: () => {
            toast.error("something went wrong")
        },
        onSuccess: () => {
            utils.comments.getTopLevel.invalidate({ videoId, limit: COMMENT_SECTION_SIZE });
            utils.comments.getReplies.invalidate({ commentId: parentComment.commentId, videoId, limit: COMMENT_REPLIES_SIZE });

            //@ts-ignore --> here comment is guaranteed to have a parentId. In the worst case, the procedure will reject it
            utils.comments.getReplies.invalidate({ commentId: parentComment.parentId, videoId, limit: COMMENT_REPLIES_SIZE });
        },
    });

    // Like/Unlike mutations with proper optimistic updates
    const likeRoot = trpc.commentReactions.create.useMutation({
        onMutate: async ({ commentId }) => {
            await utils.comments.getTopLevel.cancel({ videoId, limit: COMMENT_SECTION_SIZE });
            const previous = utils.comments.getTopLevel.getInfiniteData({ videoId, limit: COMMENT_SECTION_SIZE });

            utils.comments.getTopLevel.setInfiniteData({ videoId, limit: COMMENT_SECTION_SIZE }, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((p: any) => ({
                        ...p,
                        comments: p.comments.map((c: any) =>
                            c.commentId === commentId ? { ...c, viewerLiked: true, commentLikes: c.commentLikes + (c.viewerLiked ? 0 : 1) } : c
                        ),
                    })),
                };
            });

            return { previous };
        },
        onError: (_e, _v, ctx) => {
            if (ctx?.previous) utils.comments.getTopLevel.setInfiniteData({ videoId, limit: COMMENT_SECTION_SIZE }, ctx.previous);
            clerk.openSignIn();
        },
        onSettled: () => utils.comments.getTopLevel.invalidate({ videoId, limit: COMMENT_SECTION_SIZE }),
    });

    const unlikeRoot = trpc.commentReactions.delete.useMutation({
        onMutate: async ({ commentId }) => {
            await utils.comments.getTopLevel.cancel({ videoId, limit: COMMENT_SECTION_SIZE });
            const previous = utils.comments.getTopLevel.getInfiniteData({ videoId, limit: COMMENT_SECTION_SIZE });

            utils.comments.getTopLevel.setInfiniteData({ videoId, limit: COMMENT_SECTION_SIZE }, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((p: any) => ({
                        ...p,
                        comments: p.comments.map((c: any) =>
                            c.commentId === commentId ? { ...c, viewerLiked: false, commentLikes: c.commentLikes - (c.viewerLiked ? 1 : 0) } : c
                        ),
                    })),
                };
            });

            return { previous };
        },
        onError: (_e, _v, ctx) => {
            if (ctx?.previous) utils.comments.getTopLevel.setInfiniteData({ videoId, limit: COMMENT_SECTION_SIZE }, ctx.previous);
            clerk.openSignIn();
        },
        onSettled: () => utils.comments.getTopLevel.invalidate({ videoId, limit: COMMENT_SECTION_SIZE }),
    });

    const likeReply = trpc.commentReactions.create.useMutation({
        onMutate: async ({ commentId }) => {
            // @ts-ignore
            await utils.comments.getReplies.cancel(listKey);
            // @ts-ignore
            const previous = utils.comments.getReplies.getInfiniteData(listKey);

            // @ts-ignore
            utils.comments.getReplies.setInfiniteData(listKey, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((p: any) => ({
                        ...p,
                        comments: p.comments.map((c: any) =>
                            c.commentId === commentId
                                ? { ...c, viewerLiked: true, commentLikes: c.commentLikes + (c.viewerLiked ? 0 : 1) }
                                : c
                        ),
                    })),
                };
            });

            return { previous };
        },
        onError: (_e, _v, ctx) => {
            // @ts-ignore
            if (ctx?.previous) utils.comments.getReplies.setInfiniteData(listKey, ctx.previous);
            clerk.openSignIn();
        },
        // @ts-ignore
        onSettled: () => utils.comments.getReplies.invalidate(listKey),
    });

    const unlikeReply = trpc.commentReactions.delete.useMutation({
        onMutate: async ({ commentId }) => {
            // @ts-ignore
            await utils.comments.getReplies.cancel(listKey);
            // @ts-ignore
            const previous = utils.comments.getReplies.getInfiniteData(listKey);
            // @ts-ignore
            utils.comments.getReplies.setInfiniteData(listKey, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((p: any) => ({
                        ...p,
                        comments: p.comments.map((c: any) =>
                            c.commentId === commentId
                                ? { ...c, viewerLiked: false, commentLikes: c.commentLikes - (c.viewerLiked ? 1 : 0) }
                                : c
                        ),
                    })),
                };
            });

            return { previous };
        },
        onError: (_e, _v, ctx) => {
            // @ts-ignore
            if (ctx?.previous) utils.comments.getReplies.setInfiniteData(listKey, ctx.previous);
            clerk.openSignIn();
        },
        // @ts-ignore
        onSettled: () => utils.comments.getReplies.invalidate(listKey),
    });

    const addCommentReply = (commentId: string, replyText: string) => {
        if (!isSignedIn) return clerk.openSignIn();
        setOpen(true);
        commentAddReply({ parentId: replyingTo, videoId, comment: replyText });
        setReplyingTo("")
    }

    const handleLike = (c: Comment) => {
        if (!isSignedIn) return clerk.openSignIn();
        const isRoot = !c.parentId;
        if (!c.viewerLiked) {
            isRoot ? likeRoot.mutate({ commentId: c.commentId }) : likeReply.mutate({ commentId: c.commentId });
        } else {
            isRoot ? unlikeRoot.mutate({ commentId: c.commentId }) : unlikeReply.mutate({ commentId: c.commentId });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group comment-item relative p-2 ml-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
            <div className="flex gap-3">
                <UserAvatar size="md" imageUrl={parentComment.user.imageUrl} name={parentComment.user.name} userId={parentComment.userId} badgeSize={5} />

                <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex flex-col items-start gap-0 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <UserInfo size="xs" name={parentComment.user.name?.replace(/\s*null\s*$/i, "")} userId={parentComment.userId} />

                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {compactDate(parentComment.createdAt) ?? ""}
                            </span>

                            {viewer?.id === parentComment.userId && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            className="opacity-0 group-hover:opacity-100 transition-all text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </motion.button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                            setEditedText(parentComment.comment);
                                            setIsEditing(true);
                                        }}>
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => remove.mutate({ commentId: parentComment.commentId })} className="text-red-600 focus:text-red-600">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                        <UserTitle userId={parentComment.userId} size="xs" />
                    </div>

                    {isEditing ? (
                        <div className="flex flex-col gap-2">
                            <Textarea
                                value={editedText}
                                onChange={(e) => setEditedText(e.target.value)}
                                className="w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-lg p-2 text-sm outline-none focus:border-amber-500 transition-colors resize-none"
                                rows={2}
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    disabled={update.isPending}
                                    className="text-xs bg-amber-500 text-white px-3 py-1 rounded-full hover:bg-amber-600 transition-colors disabled:opacity-50"
                                >
                                    {update.isPending ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p
                            ref={setRefFor(parentComment.commentId)}
                            className={[
                                "text-sm text-gray-800 dark:text-gray-200 mb-2 max-w-xs text-left",
                                "whitespace-pre-wrap break-words",
                                expanded[parentComment.commentId] ? "" : "line-clamp-2",
                            ].join(" ")}
                        >
                            {parentComment.comment}
                        </p>
                    )}

                    {(expanded[parentComment.commentId] || isClamped[parentComment.commentId]) && !isEditing && (
                        <button
                            className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                            onClick={() =>
                                setExpanded((x) => ({ ...x, [parentComment.commentId]: !x[parentComment.commentId] }))
                            }
                        >
                            {expanded[parentComment.commentId] ? "Show less" : "Read more"}
                        </button>
                    )}

                    <div className="flex items-center gap-6 mt-2">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleLike(parentComment)}
                            className="flex gap-1 text-xs text-gray-500 dark:text-gray-400 hover:cursor-pointer hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                        >
                            <Heart className={`w-4 h-4 ${parentComment.viewerLiked ? "fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" : ""}`} />
                            {compactNumber(parentComment.commentLikes)}
                        </motion.button>

                        {depth < maxDepth && (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { setReplyingTo(""); setReplyingTo(parentComment.commentId) }}
                                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                                disabled={isReplying}
                            >
                                <MessageCircle className="w-4 h-4" />
                                Reply
                            </motion.button>
                        )}
                        {(parentComment.replies ?? 0) > 0 && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onMouseEnter={prefetchReplies}
                                onFocus={prefetchReplies}
                                onTouchStart={prefetchReplies}
                                onClick={() => setOpen((s) => !s)}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                            >
                                {isFetching && open ?
                                    <Spinner variant='circle' className="w-4 h-4" />
                                    :
                                    <>
                                        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        <span>{open ? "Hide replies" : `${parentComment.replies} replies`}</span>
                                    </>
                                }
                            </motion.button>
                        )}
                    </div>

                    {/* Reply input */}
                    <AnimatePresence>
                        {replyingTo === parentComment.commentId && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-3"
                            >
                                <CommentReplyInput
                                    isPending={isReplying}
                                    addCommentReply={addCommentReply}
                                    viewer={viewer}
                                    parentCommentId={parentComment.commentId}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Children */}
                    <AnimatePresence>
                        {open && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="mt-4 pl-6 border-l-2 border-amber-300 dark:border-amber-600 rounded-b-2xl space-y-4">
                                    {replies.map((child) => (
                                        <Comment key={child.commentId} isPending={isReplying} parentComment={child} videoId={videoId} viewer={viewer} depth={depth + 1} maxDepth={maxDepth} />
                                    ))}
                                </div>
                                <InfiniteScroll
                                    isManual={true}
                                    hasNextPage={hasNextPage}
                                    isFetchingNextPage={isFetchingNextPage}
                                    fetchNextPage={fetchNextPage}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};
