'use client'

import { Suspense, useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { trpc } from "@/trpc/client";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { COMMENT_SECTION_SIZE } from "@/constants";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { Comment } from "@/modules/comments/ui/components/comment";
import { CommentInput } from "@/modules/comments/ui/components/comment-input";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { compactNumber } from "@/lib/utils";
import { toast } from "sonner";

interface CommentSectionProps {
  videoId: string;
  openComments: boolean;
  onOpenChange?: (open: boolean) => void;
  home:boolean;
}

export const CommentsSection = (props: CommentSectionProps) => {
  return (
    <Suspense fallback={<CommentsSkeleton />}>
      <ErrorBoundary fallback={<div className="text-destructive p-4 rounded-lg bg-destructive/10">Error loading comments</div>}>
        <CommentsSuspense {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

const CommentsSkeleton = () => (
  <div className="h-full flex flex-col">
    <div className="h-[70px] px-5 flex items-center justify-between border-b border-white/10">
      <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
      <div className="h-10 w-10 bg-white/10 rounded-full animate-pulse" />
    </div>
    <div className="flex-1 bg-white/5" />
  </div>
);

export const CommentsSuspense = ({ videoId, openComments, onOpenChange,home }: CommentSectionProps) => {
  const clerk = useClerk();
  const utils = trpc.useUtils();
  const { isSignedIn } = useAuth();

  const [rootComments, query] = trpc.comments.getTopLevel.useSuspenseInfiniteQuery(
    { videoId, limit: COMMENT_SECTION_SIZE },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const items = useMemo(
    () => rootComments ? rootComments.pages.flatMap(p => p.comments) : [],
    [rootComments]
  );

  const viewer = rootComments.pages[0].viewer;
  const key = { videoId, limit: COMMENT_SECTION_SIZE };
  const maxDepth =(home ? 5 : 3); // limit depth on home for performance

  const { mutate: createRootComment, isPending } = trpc.comments.create.useMutation({
    onError: () => { 
      toast.error("something went wrong")
    },
    onSuccess: () => {
      utils.comments.getTopLevel.invalidate(key);
    },
  });

  const createComment = (newComment: string) => {
    if (!isSignedIn) return clerk.openSignIn();
    createRootComment({ videoId, comment: newComment });
  };

  // Controlled open mirror (header always visible at 70px)
  const [open, setOpen] = useState(openComments);
  useEffect(() => setOpen(openComments), [openComments]);
  

  return (
    <div className="h-full flex flex-col overflow-hidden "

        // onMouseLeave={()=>{if(!home) return; setOpen(false); onOpenChange?.(false)}}
        onClick={()=>{if(!home) return; setOpen(true);onOpenChange?.(true)}}
    >
      {/* HEADER — fixed 70px, matches home.html */}
      <div
        className="h-[60px] p-3 flex items-center justify-between border-b border-white/10 hover:cursor-pointer"
      >
        <h2 className="text-[1.1rem] font-semibold flex items-center gap-2  ml-2 text-gray-900 dark:text-white">
          <MessageCircle className="w-5 h-5 text-gray-900 dark:text-white" />
          <span>Comments {compactNumber(rootComments.pages[0].commentCount ?? 0)}</span>
        </h2>
        <span className="h-10 w-10 rounded-full bg-white dark:bg-[#333333] hover:bg-white/20 dark:hover:bg-[#333333]/80 inline-flex items-center justify-center transition">
          {query.isFetching && !query.isFetchingNextPage
            ? <Spinner variant='circle' className="w-5 h-5" />
            : (open ? <ChevronUp className="h-5 w-5" onClick={() => {setOpen(false); onOpenChange?.(false)}} /> : <ChevronDown onClick={() => {setOpen(true);onOpenChange?.(true)}} className="h-5 w-5" />)}
        </span>
      </div>

      {/* CONTENT — fills remaining height INSIDE this panel; scrolls internally */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className=" min-h-0 max-w-[95%] flex flex-col"
          >
            <div className="px-5  border-b border-white/10">
              <CommentInput viewer={viewer} createComment={createComment} isPending={isPending}/>
            </div>

            <div className="flex flex-col overflow-y-auto px-3 py-4 space-y-1">
              {items.map(c => (
                <Comment
                  key={c.commentId}
                  parentComment={c}
                  videoId={videoId}
                  viewer={viewer}
                  isPending={isPending}
                  depth={1}
                  maxDepth={maxDepth}
                />
              ))}
              <InfiniteScroll
                isManual={false}
                hasNextPage={query.hasNextPage}
                isFetchingNextPage={query.isFetchingNextPage}
                fetchNextPage={query.fetchNextPage}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
