import { formatDuration } from "@/lib/utils";
import Image from "next/image"
import { THUMBNAIL_FALLBACK } from "../../constants";

interface VideoThumbnailProps {
    imageUrl?: string | null;
    previewUrl?: string | null;
    title: string;
    duration: number;
}

export const VideoThumbnail = ({imageUrl,title,previewUrl, duration}: VideoThumbnailProps) => {
    return (
        <div className="relative group">
            {/* thumbnail wrapper */}
            <div className="relative w-full  rounded-2xl aspect-video ">
                <Image 
                src={imageUrl ?? THUMBNAIL_FALLBACK} 
                alt={title} 
                fill 
                className='size-full object-cover group-hover:opacity-0'
                />
                <Image 
                unoptimized={!!previewUrl}
                src={previewUrl ?? imageUrl ?? THUMBNAIL_FALLBACK} 
                alt='thumbnail' 
                fill 
                className='size-full object-cover opacity-0 group-hover:opacity-100'
                />
            </div>

                
            {/* Duration box */}
            <div className="absolute bottom-2 right-2 px-1 py-0.5 rounded bg-amber-700 text-white text-xs font-medium">
                {formatDuration(duration)}
            </div>
        </div>
    )
}

// What fill does:
// The fill attribute comes from Next.js’s next/image component. It is not standard HTML. Here's what it does:
// Makes the image fill its parent container
// Instead of specifying width and height on the <Image> component, fill makes the image stretch to cover the entire size of its parent element.

// Requires the parent to have a position
// The parent container must have position: relative (or absolute/fixed), otherwise the image won’t know what to fill.

// Responsive
// The image automatically adjusts to the size of the parent, keeping its aspect ratio depending on the object-fit property (cover, contain, etc.).
