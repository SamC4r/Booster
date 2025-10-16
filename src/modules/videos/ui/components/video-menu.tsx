import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreVerticalIcon, MousePointerClick, Share2, Sparkle, ThumbsDown, TrashIcon } from "lucide-react";
import { toast } from "sonner";

interface VideoMenuProps {
    videoId: string;
    variant?: "ghost" | "secondary";
    onRemove?: () => void;
}

export const VideoMenu = ({
    videoId,
    variant,
    onRemove,
}: VideoMenuProps) => {
    const onShare = () => {
        //TODO: Change if deploying outside vercel
        const fullUrl = `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/explorer/videos/${videoId}`

        navigator.clipboard.writeText(fullUrl);
        toast.success("Link Copied!")
    }
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size='icon' className="rounded-full">
                    <MoreVerticalIcon />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={onShare}>
                    <Button className="flex items-center bg-emerald-200 w-full">

                        <Share2 className="mr-2 size-4" />
                        Share
                    </Button>
                </DropdownMenuItem>

                <DropdownMenuItem>
                    <Button className='flex items-center bg-red-300 w-full' >
                        <MousePointerClick className='size-4' />
                        <p>Report AI</p>
                        <Sparkle className='size-4' />
                    </Button>
                </DropdownMenuItem>

                <DropdownMenuItem>
                    <Button className='flex items-center justify-between bg-red-300 w-full'

                    >
                        <MousePointerClick className='size-4' />
                        <p>Report ClickBait!</p>
                        <ThumbsDown className='size-4' />
                    </Button>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Button className='flex items-center bg-red-300 w-full' >
                        <MousePointerClick className='size-4' />
                        <p>Report Inappropriate</p>
                        <ThumbsDown className='size-4' />
                    </Button>
                </DropdownMenuItem>
                {onRemove && (
                    <DropdownMenuItem onClick={() => { }}>
                        <TrashIcon className="mr-2 size-4" />
                        Remove
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
