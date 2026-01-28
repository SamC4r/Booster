'use client';
import { useState, useEffect } from 'react';
import { ResponsiveModal } from '@/components/responsive-modal';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { StudioBunnyUploader } from './studio-bunny-uploader';
import { FormSection } from '@/modules/studio/ui/sections/form-section';
import { useSearchParams, useRouter } from 'next/navigation';

export const StudioUploadModal = () => {
    const [open, setOpen] = useState(false);
    const [videoId, setVideoId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (searchParams.get('create') === 'true') {
            setOpen(true);
            setVideoId(null);
            // Clean up the URL
            router.replace('/studio');
        }
    }, [searchParams, router]);

    const handleOpen = () => {
        setOpen(true);
        setVideoId(null); // Reset state when opening
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && isUploading) {
             toast.error("Please wait for the upload to complete");
             return;
        }
        setOpen(newOpen);
    }

    const handleUploadStarted = (id: string) => {
        setVideoId(id);
    };

    return (
        <>
            <Button variant="default" onClick={handleOpen}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create
            </Button>

            <ResponsiveModal 
                open={open} 
                title={videoId ? 'Edit Video Details' : 'Upload video'} 
                onOpenChange={handleOpenChange}
                className={videoId ? "max-w-screen-xl w-full max-h-[90vh] flex flex-col" : "max-w-lg w-full"}
            >
                <StudioBunnyUploader 
                    onUploadStarted={handleUploadStarted}
                    onSuccess={() => {}} // Optional: maybe close modal or show success message
                    onProgressChange={setIsUploading}
                >
                    {videoId && <FormSection videoId={videoId} />}
                </StudioBunnyUploader>
            </ResponsiveModal>
        </>
    );
};
