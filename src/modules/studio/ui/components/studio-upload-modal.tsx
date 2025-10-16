'use client';
import { useState } from 'react';
import { ResponsiveModal } from '@/components/responsive-modal';
import { Button } from '@/components/ui/button';
import { Loader2Icon, PlusIcon } from 'lucide-react';
import { StudioUploader } from './studio-uploader';

export const StudioUploadModal = () => {


    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);




    //TODO: solve orphaned asset 
    //If webhook arrives first, it only does an UPDATE → 0 rows affected (row doesn’t exist yet).
    // //  You’ll only get a DB row if the client later calls resolveUpload. 
    // // If the tab closes/crashes, you end up with an orphaned asset (no DB row, no thumbnail).
    // const resolveUpload = trpc.videos.resolveUpload.useMutation({
    //   onSuccess: (data) => {
    //     toast.success('Video uploaded!');
    //     utils.studio.getMany.invalidate();
    //     setOpen(false);
    //     setEndpoint(null);
    //     setUploadId(null);
    //   },
    //   onError: (err) => {
    //     toast.error(err.message || 'Upload finished, but asset is not ready yet');
    //   },
    // });

    const handleOpen = () => {
        setOpen(true);
        setPending(true);
    };



    return (
        <>
            {/* <ResponsiveModal open={open} onOpenChange={setOpen} title="">
        {!endpoint ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <StudioUploader endpoint={endpoint} uploadId={uploadId} onSuccess={function (e: CustomEvent): void {
              throw new Error(`Function not implemented.${e}`);
            } } />
        )}
      </ResponsiveModal> */}

            <Button variant="secondary" onClick={handleOpen}>
                {pending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
                Create
            </Button>

            <ResponsiveModal open={open} title='Upload video' onOpenChange={setOpen} >
                <StudioUploader />
            </ResponsiveModal>
        </>
    );
};
