import { UserAvatar } from "@/components/user-avatar";
import { MAX_COMMENT_LENGTH } from "@/constants";
import { User } from "@/modules/users/types";
import { Smile, Send } from "lucide-react";
import { useState } from "react";



interface CommentInputProps{
    viewer?: User,
    createComment: (newComment: string) => void;
}

export const CommentInput = ({viewer,createComment}:CommentInputProps) => {


    const [newComment, setNewComment] = useState("");
    //this is for root comments
    const handleAddComment = () => {
        if (newComment.trim()) {
            setNewComment("");
            createComment(newComment);
        }
    };
    return (
        //{/* Comment Input */ }
      <div className=" border-gray-200 dark:border-gray-800 p-1">
        <div className="flex gap-3 items-center">
          <UserAvatar
            size="md"
            imageUrl={viewer?.imageUrl || "/public-user.png"}
            name={viewer?.name || "Booster anonymous user"}
          />
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg  p-1 flex items-center">
            <input
              type="text"
              value={newComment}
              onChange={(e) => { setNewComment(e.target.value); }}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              maxLength={MAX_COMMENT_LENGTH}
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <div className="flex items-center gap-2">
              <p className="ml-2 text-xs text-muted-foreground">{newComment.length ?? "0"}/{MAX_COMMENT_LENGTH}</p>
              {/* <button className="text-gray-500 hover:text-amber-500 transition-colors">
                <Smile className="w-5 h-5" />
              </button> */}
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className={`p-1 rounded-full transition-colors ${newComment.trim() ? 'text-amber-500 hover:text-amber-600' : 'text-gray-400'}`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
}