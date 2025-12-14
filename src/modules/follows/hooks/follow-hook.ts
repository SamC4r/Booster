import { trpc } from "@/trpc/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Props {
    userId: string;
    isFollowing: boolean;
    fromVideoId?: string
}

export const useFollow = ({ userId, isFollowing, fromVideoId }: Props) => {
    const [optimisticFollowing, setOptimisticFollowing] = useState(isFollowing);
    const utils = trpc.useUtils();

    useEffect(() => {
        setOptimisticFollowing(isFollowing);
    }, [isFollowing]);

    const follow = trpc.follows.create.useMutation({
        onSuccess: () =>{
            utils.follows.getFollowersByUserId.invalidate({ userId })
            if(fromVideoId) {
                utils.videos.getOne.invalidate({id:fromVideoId})
                utils.videos.getUserByVideoId.invalidate({ videoId: fromVideoId })
            }
        },
        onError: () => {
            setOptimisticFollowing(false);
            toast.error("Failed to follow");
        }
    });

    const unfollow = trpc.follows.delete.useMutation({
        onSuccess: () =>{
            utils.follows.getFollowersByUserId.invalidate({ userId })
            if(fromVideoId){
                utils.videos.getOne.invalidate({ id: fromVideoId })
                utils.videos.getUserByVideoId.invalidate({ videoId: fromVideoId })
            }
        },
        onError: () => {
            setOptimisticFollowing(true);
            toast.error("Failed to unfollow");
        }
    });

    const isPending = follow.isPending || unfollow.isPending
    const onClick = () => {
        if (isPending) return;

        const newStatus = !optimisticFollowing;
        setOptimisticFollowing(newStatus);

        if (optimisticFollowing) {
            unfollow.mutate({ userId })
        } else {
            follow.mutate({ userId })
        }
    }

    return {
        isPending,
        isFollowing: optimisticFollowing,
        onClick,
    }

}