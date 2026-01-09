'use client'
import { trpc } from "@/trpc/client"
import { VideoOwner } from "./video-owner"

interface Props{
    videoId: string;
}

export const VideoCreator = ({videoId}:Props) => {

    const [user] = trpc.videos.getUserByVideoId.useSuspenseQuery({videoId});
    const [boostPoints] = trpc.xp.getBoostByVideoId.useSuspenseQuery({videoId})

    // console.log(user)

    return (
        <VideoOwner videoId={videoId} user={user} boostPoints={Number(boostPoints.boostPoints)} className="w-full" />
    )
}