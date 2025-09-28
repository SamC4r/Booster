import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";
import { useClerk } from "@clerk/nextjs";
import { OldPlugin } from "postcss";
import { toast } from "sonner";

interface Props {
    userId: string;
    isFollowing: boolean;
    fromVideoId?: string
}

export const useFollow = ({ userId, isFollowing, fromVideoId }: Props) => {
    const clerk = useClerk();
    const utils = trpc.useUtils();
    const follow = trpc.follows.create.useMutation({
        onMutate: async ({ userId }) => {
            if(fromVideoId){ 
                await utils.videos.getOne.cancel({ id: fromVideoId });
                const previous = utils.videos.getOne.getData({ id: fromVideoId });
                utils.videos.getOne.setData({ id: fromVideoId }, (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        user: {
                            ...old.user,
                            viewerIsFollowing: true,
                            followsCount: (old.user.followsCount ?? 0) + (old.user.viewerIsFollowing ? 0 : 1),
                        },
                    };
                });
                return { previous };
            }else{
                await utils.follows.getFollowersByUserId.cancel({userId})
                const previous = utils.follows.getFollowersByUserId.getData({userId})
                utils.follows.getFollowersByUserId.setData({userId}, (old) => {
                    if(!old) return old
                    return {
                        ...old,
                        followsCount: (old.followsCount ?? 0) + (old.viewerIsFollowing ? 0 : 1),
                        viewerIsFollowing: true,
                    }
                })
                return {previous}
            }

        },
        onError: (_err, _vars, ctx) => {
            if(fromVideoId){
                if (ctx?.previous) utils.videos.getOne.setData({ id: fromVideoId }, ctx.previous);
            }
            clerk.openSignIn();
        },
        onSettled: () => {
             utils.follows.getFollowersByUserId.invalidate({userId})
             utils.videos.getOne.invalidate({id:fromVideoId})
        },
        onSuccess: () =>{
        }
    });

    const unfollow = trpc.follows.delete.useMutation({
        onMutate: async ({ userId }) => {
            if (fromVideoId) {
                await utils.videos.getOne.cancel({ id: fromVideoId });
                const previous =  utils.videos.getOne.getData({ id: fromVideoId });
                utils.videos.getOne.setData({ id: fromVideoId }, (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        user: {
                            ...old.user,
                            viewerIsFollowing: false,
                            followsCount: (old.user.followsCount ?? 0) - (old.user.viewerIsFollowing ? 1 : 0),
                        },
                    };
                });
                return { previous };
            }else{
                console.log("ACA DEBERIA")
                await utils.follows.getFollowersByUserId.cancel({userId})
                const previous = utils.follows.getFollowersByUserId.getData({userId})
                utils.follows.getFollowersByUserId.setData({userId}, (old) => {
                    if(!old) return old
                    return {
                        ...old,
                        followsCount: (old.followsCount ?? 0) - (old.viewerIsFollowing ? 1 : 0),
                        viewerIsFollowing:false,
                    }
                })

                return {previous}
            } 

        },
        onError: (_err, _vars, ctx) => {
            if(fromVideoId){
                if (ctx?.previous) utils.videos.getOne.setData({ id: fromVideoId }, ctx.previous);
            }
            //TODO: add error rollback on follow/unfollow from channel page
            toast.error("something went wrong");
            clerk.openSignIn();
        },
        onSettled: () => {
            utils.follows.getFollowersByUserId.invalidate({ userId })
            utils.videos.getOne.invalidate({ id: fromVideoId })
        },
        onSuccess: () =>{
            
        }
    });

    const isPending = follow.isPending || unfollow.isPending
    const onClick = () => {
        console.log("isFollowing", isFollowing)
        if (isFollowing) {
            unfollow.mutate({
                userId
            })
        } else {
            follow.mutate({
                userId
            })
        }

    }

    return {
        isPending,
        isFollowing,
        onClick,
    }

}