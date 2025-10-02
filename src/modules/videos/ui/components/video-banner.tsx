import { AlertTriangleIcon } from "lucide-react";
import { VideoGetOneOutput } from "../../types";

interface Props{
    status: string;
}

export const VideoBanner = ({status}:Props) => {
    if(status === "finished" || status == "resolution_finished") return null;
    return (
        <div className="bg-yellow-100 -mt-1.5 pt-4 pb-3 px-4 rounded-b-xl flex items-center gap-2">
            <AlertTriangleIcon className="size-4 text-black shrink-0" />
            <p className="text-xs md:text-sm font-medium line-clamp-1">
                This video is still being processed
            </p>
        </div>
    )
}
