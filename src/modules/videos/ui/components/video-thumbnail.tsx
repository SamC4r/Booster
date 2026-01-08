"use client"
import { formatDuration } from "@/lib/utils";
import Image from "next/image"
import { THUMBNAIL_FALLBACK } from "../../constants";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface VideoThumbnailProps {
    imageUrl?: string | null;
    previewUrl?: string | null;
    title: string;
    duration: number;
    aspectRatio?: "video" | "vertical" | "square";
    isAi?: boolean;
}

export const VideoThumbnail = ({ imageUrl, previewUrl, duration, title, aspectRatio = "video", isAi = false }: VideoThumbnailProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [showVideo, setShowVideo] = useState(false);

    // Use video preview for vertical videos to improve quality
    const shouldUseVideo = aspectRatio === "vertical";
    const videoSrc = shouldUseVideo && previewUrl ? previewUrl.replace("/preview.webp", "/play_360p.mp4") : null;

    const handleMouseEnter = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setShowVideo(true);
                }).catch(() => {
                    // console.error("Video play failed:");
                });
            }
        }
    };

    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            setShowVideo(false);
        }
    };

    return (
        <div
            className="relative group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* thumbnail wrapper */}
            <div className={`relative w-full rounded-2xl overflow-hidden ${aspectRatio === "vertical" ? "aspect-[9/16]" :
                    aspectRatio === "square" ? "aspect-square" : "aspect-video"
                }`}>
                {/* Layer 1: WebP Preview (Fallback) */}
                <Image
                    unoptimized={!!previewUrl}
                    src={previewUrl ?? imageUrl ?? THUMBNAIL_FALLBACK}
                    alt='thumbnail'
                    fill
                    className='size-full object-cover rounded-2xl '
                />

                {/* Layer 2: Video (High Quality) */}
                {videoSrc && (
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        muted
                        loop
                        playsInline
                        className={`absolute inset-0 size-full object-cover rounded-md transition-opacity duration-300 ${showVideo ? 'opacity-100' : 'opacity-0'}`}
                    />
                )}

                {/* Layer 3: Static Thumbnail (Foreground) */}
                <Image
                    src={imageUrl ?? THUMBNAIL_FALLBACK}
                    alt={title}
                    fill
                    className='size-full object-cover group-hover:opacity-0 rounded-2xl transition-opacity duration-300 z-10 border-red-500'
                />
            </div>

            {isAi && (
                <div className="absolute top-2 right-2 z-20">
                    <Badge variant="secondary" className="bg-purple-100/90 backdrop-blur-sm text-purple-800 border-purple-200 gap-1 whitespace-nowrap shadow-sm px-1.5 py-0.5 h-auto text-[10px]">
                        <Sparkles className="size-2.5" />
                        AI
                    </Badge>
                </div>
            )}

            {/* Duration box */}
            <div className="absolute bottom-2 right-2 px-1 py-0.5 rounded-lg bg-amber-700 text-white text-xs font-medium z-20">
                {formatDuration(duration)}
            </div>
        </div>
    )
}
