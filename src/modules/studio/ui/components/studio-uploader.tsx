"use client";

import { LockIcon, Upload } from "lucide-react";
import { ChangeEvent, DragEvent, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export const StudioUploader = () => {
    const [state, setState] = useState<{ file: File | null; progress: number; uploading: boolean }>({
        file: null, progress: 0, uploading: false
    });
    const utils = trpc.useUtils();
    const router = useRouter();

    let videoId: string;

    const createAfterUpload = trpc.videos.createAfterUpload.useMutation({
        onSuccess: async (data) => {

            videoId = data.id;
            utils.studio.getMany.invalidate({ limit: DEFAULT_LIMIT })
            router.push(`/studio/videos/${videoId}`)


            const { uploadUrl, fileUrl, thumbnailUrl } = await getPresignedUrl({
                videoId,
                fileName: data.s3Name,
            });
            updateVideoUrl.mutate({ fileUrl, videoId, thumbnailUrl })

            await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": "video/mp4",
                },
                body: file,
            });


            setState({ file, progress: 100, uploading: true });
            toast.success(`Uploadede to the server. Processing video `);

        }
    });

    const updateVideoUrl = trpc.videos.updateVideoUrl.useMutation();

    const { mutateAsync: getPresignedUrl } = trpc.upload.getPresignedUrl.useMutation();

    const handleUpload = async (file: File) => {

        const video = document.createElement("video");
        video.preload= "metadata";
        video.src = URL.createObjectURL(file);

        if(file.type !== "video/mp4"){
            toast.error("Please upload an mp4 file :)")
            return; 
        }

        video.onloadedmetadata = async () => {
            URL.revokeObjectURL(video.src);
            const duration = video.duration;
            if(duration > 300){
                toast.error('Video must be under 5 minutes');
                return;
            }

            setState({ file, progress: 0, uploading: true });

            createAfterUpload.mutate({ title: file.name })

            setState({ file, progress: 50, uploading: true });
        }
    };

    const onPick = (e: ChangeEvent<HTMLInputElement>) => {
        console.log('pick')
        const f = e.target.files?.[0]; if (f) void handleUpload(f);
    };
    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0]; if (f) void handleUpload(f);
    };

    const { file, progress } = state;

    return (
        <div className="flex items-center justify-center p-3 w-full max-w-lg h-full z-50">
            <form className="w-full" onSubmit={(e) => e.preventDefault()}>
                <div
                    className="flex justify-center rounded-md border mt-2 border-dashed border-input px-6 py-12"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                >
                    <div className="flex flex-col items-center">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
                        <div className="flex text-sm leading-6 text-muted-foreground mt-2">
                            <p>Drag and drop or</p>
                            <label
                                htmlFor="file-upload-03"
                                className="relative cursor-pointer rounded-sm pl-1 font-medium text-primary hover:underline hover:underline-offset-4"
                            >
                                <span>choose file</span>
                                <input
                                    id="file-upload-03"
                                    type="file"
                                    className="sr-only"
                                    accept="video/mp4"
                                    onChange={onPick}
                                />
                            </label>
                            <p className="pl-1">to upload</p>
                        </div>
                        <p className="text-sm pt-4 font-bold">Select a .mp4 file</p>
                        <p className='text-red-300 text-xs pt-4'>Video should be under 5 minutes</p>
                    </div>
                </div>

                <p className="mt-2 text-xs leading-5 text-muted-foreground sm:flex sm:items-center sm:justify-between">
                    <span className="flex items-center gap-2">
                        By default, videos will be private <LockIcon className="size-4" />
                    </span>
                </p>

                {file && (
                    <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="truncate min-w-0">{file.name}</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="flex flex-col gap-2 text-center">

                            {progress < 100 && (<Spinner variant="circle" />)}

                            <span className="text-muted-foreground text-xs">You can close this and edit the data while the video is processing</span>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};
