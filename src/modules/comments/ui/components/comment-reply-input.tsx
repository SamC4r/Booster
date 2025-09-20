import { Spinner } from "@/components/ui/shadcn-io/spinner"
import { UserAvatar } from "@/components/user-avatar"
import { MAX_COMMENT_LENGTH } from "@/constants"
import { User } from "@/modules/users/types"
import { motion } from "framer-motion"
import { Smile, Send } from "lucide-react"
import { useState } from "react"





interface CommentReplyInputProps{
    viewer?: User;
    addCommentReply: (commentId: string, replyText:string) => void;
    parentCommentId: string;
    isPending: boolean;
}

export const CommentReplyInput = ({viewer,addCommentReply,parentCommentId,isPending}:CommentReplyInputProps) => {
    const [replyText, setReplyText] = useState("");

    const handleAddReply = (commentId: string) => {
        if(isPending) return;
        if (!replyText.trim()) return;
        addCommentReply(commentId, replyText);
    };
    return (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-2 min-w-0">
            <div className="flex gap-3 items-center min-w-0 overflow-hidden">
                <UserAvatar
                    size="sm"
                    imageUrl={viewer?.imageUrl || "/public-user.png"}
                    name={viewer?.name || "Booster anonymous user"}
                />
                <div className="flex-shrink bg-gray-100 min-w-0 dark:bg-gray-800 rounded-lg px-2 py-1 flex items-center">
                    <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full bg-transparent border-none outline-none text-sm"
                        maxLength={MAX_COMMENT_LENGTH}
                        onKeyDown={(e) => e.key === "Enter" && handleAddReply(parentCommentId)}
                    />
                    <div className="flex items-center gap-2">
                        <p className="ml-2 text-xs text-muted-foreground">{replyText.length}/{MAX_COMMENT_LENGTH}</p>
                        {/* <button className="text-gray-500 hover:text-amber-500 transition-colors">
                            <Smile className="w-5 h-5" />
                        </button> */}
                        <button
                            onClick={() => handleAddReply(parentCommentId)}
                            disabled={!replyText.trim() || isPending}
                            className={`p-1 rounded-full ${replyText.trim() ? "text-amber-500 hover:text-amber-600" : "text-gray-400"}`}
                        >
                            {!isPending ? (
                            <Send className="w-5 h-5" />
                            )
                            :(
                               <>
                            <Spinner variant='circle' className="w-5 h-5" />
                                    </> 
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}