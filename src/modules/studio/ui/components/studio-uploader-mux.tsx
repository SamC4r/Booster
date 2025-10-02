// StudioUploader.tsx
import { Button } from '@/components/ui/button';
import { trpc } from '@/trpc/client';
import MuxUploader, { MuxUploaderDrop, MuxUploaderFileSelect, MuxUploaderProgress, MuxUploaderStatus } from '@mux/mux-uploader-react';
import { UploadIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface StudioUploaderProps {
    endpoint?: string | null;
    uploadId?: string | null;
    onSuccess: (e: CustomEvent) => void; // pass event so we can read asset/playback ids
}
const UPLOADER_ID = 'video-uploader';

export const StudioUploader = ({ endpoint, onSuccess,uploadId }: StudioUploaderProps) => {

    const utils = trpc.useUtils();

 
    const router = useRouter();

    const createRow = trpc.videos.create.useMutation({
        onSuccess: (data) => {
            utils.studio.getMany.invalidate();
            if(data?.video.id) router.push(`/studio/videos/${data.video.id}`)
        }
    })
  
    useEffect(() => {
        const uploaderEl = document.getElementById(UPLOADER_ID);

        if (!uploaderEl) return;

        const handleAdd = (e: Event) => {
            console.log(e)
        };

        const handleStart = (e: Event) => {
            createRow.mutate({uploadUrl:endpoint, uploadId});
            console.log(e)
        };

        uploaderEl.addEventListener("uploadstart", handleStart);
        uploaderEl.addEventListener("fileadded", handleAdd);

        return () => {
            uploaderEl.removeEventListener("uploadstart", handleStart);
            uploaderEl.removeEventListener("fileadded", handleAdd);
        };
    }, []);

    return (
        <div>
            <MuxUploader
                endpoint={endpoint ?? undefined}
                id={UPLOADER_ID}
                className="hidden group/uploader"
                onSuccess={onSuccess}
            />
            <MuxUploaderDrop muxUploader={UPLOADER_ID} className="group/drop" >
                <div slot="heading" className="flex flex-col items-center gap-6">
                    <div className="flex items-center justify-center gap-2 rounded-full bg-muted h-32 w-32">
                        <UploadIcon className="size-10 text-muted-foreground group/drop-[&[active]]:animate-bounce transition-all duration-300" />
                    </div>
                    <div className="flex flex-col gap-2 text-center">
                        <p className="text-sm">Drag and drop video files</p>
                        <p className="text-xs text-muted-foreground">Videos will be private until you publish them</p>
                        <MuxUploaderFileSelect muxUploader={UPLOADER_ID}>
                            <Button type="button" className="rounded-full">Select files</Button>
                        </MuxUploaderFileSelect>
                    </div>
                </div>
                <span slot="separator" className="hidden" />
                <p className='text-xs text-muted-foreground mb-5 '>You can close this and edit the video metadata</p>
                <MuxUploaderStatus muxUploader={UPLOADER_ID} className="text-sm" />
                <MuxUploaderProgress muxUploader={UPLOADER_ID} className="text-sm" type="percentage" />
                <MuxUploaderProgress muxUploader={UPLOADER_ID} type="bar" />
            </MuxUploaderDrop>
        </div>
    );
};
