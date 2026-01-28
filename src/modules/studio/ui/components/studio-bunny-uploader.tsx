"use client";

import { LockIcon, Upload, Loader2 } from "lucide-react";
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { useRouter } from "next/navigation";

import * as tus from 'tus-js-client'

interface StudioBunnyUploaderProps {
  onSuccess?: (videoId: string) => void;
  onUploadStarted?: (videoId: string) => void;
  onUploadError?: () => void;
  onProgressChange?: (isUploading: boolean) => void;
  children?: React.ReactNode;
}

const getVideoMetadata = (file: File): Promise<{ duration: number; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight
      });
    };
    video.onerror = () => {
      reject("Invalid video file");
    }
    video.src = URL.createObjectURL(file);
  });
};

export const StudioBunnyUploader = ({ onSuccess, onUploadStarted, onProgressChange, children }: StudioBunnyUploaderProps) => {
  const [state, setState] = useState<{ file: File | null; progress: number; uploading: boolean }>({
    file: null, progress: 0, uploading: false
  });
  const utils = trpc.useUtils();
  const router = useRouter();
  const videoIdRef = useRef<string | null>(null);

  const createAfterUpload = trpc.videos.createAfterUpload.useMutation({
    onSuccess: (data) => {
      utils.studio.getMany.invalidate({ limit: DEFAULT_LIMIT })
      videoIdRef.current = data.id;
      onUploadStarted?.(data.id);
    }
  });

  const { data: video } = trpc.studio.getOne.useQuery(
    { id: videoIdRef.current ?? "" },
    {
      enabled: !!videoIdRef.current && state.progress === 100,
      refetchInterval: (query) => {
        const status = query.state.data?.bunnyStatus;
        return !query.state.data || (status !== 'completed' && status !== 'error') ? 1000 : false;
      }
    }
  );


  const tusUploader = async (file: File) => {
    try {
      const { duration, width, height } = await getVideoMetadata(file);
      if (duration > 600) {
        toast.error("Video is longer than 10 minutes");
        return;
      }

      setState({ file, progress: 0, uploading: true });
      onProgressChange?.(true);
      const createRes = await fetch("/api/bunny/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: file.name }),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json();
        throw new Error(errorData.error || "Failed to create video");
      }
      const { guid } = await createRes.json() as { guid: string };

      const signRes = await fetch("/api/bunny/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ videoId: guid }),
      });

      if (!signRes.ok) throw new Error(await signRes.text());
      const { libraryId, videoId, expires, signature } = await signRes.json();


      const upload = new tus.Upload(file, {
        // Endpoint is the upload creation URL from your tus server
        endpoint: 'https://video.bunnycdn.com/tusupload',
        headers: {
          AuthorizationSignature: signature,
          AuthorizationExpire: expires,
          VideoId: videoId,
          LibraryId: libraryId,
        },

        // Retry delays will enable tus-js-client to automatically retry on errors
        retryDelays: [0, 3000, 5000, 10000, 20000],
        // Attach additional meta data about the file for the server
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
        // Callback for errors which cannot be fixed using retries
        onError: (err) => {
          setState((s) => ({ ...s, uploading: false }));
          onProgressChange?.(false);
          toast.error(`Upload failed: ${err.message}`);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const pct = Math.min(99, Math.round((bytesUploaded / bytesTotal) * 100));
          setState((s) => ({ ...s, progress: pct,}));
        },
        onSuccess: async () => {
          setState((s) => ({ ...s, progress: 100, uploading: false }));
          onProgressChange?.(false);
          toast.success("Uploaded the video! Processing started.");
          if (onSuccess && videoIdRef.current) {
            onSuccess(videoIdRef.current);
          } else if (!onSuccess && videoIdRef.current) {
            router.push(`/studio/videos/${videoIdRef.current}`)
          }
        },
      })
      upload.findPreviousUploads().then(async function (previousUploads) {
        // Found previous uploads so we select the first one. 
        // if (previousUploads.length) {
        //   upload.resumeFromPreviousUpload(previousUploads[0])
        // }

        // Start the upload
        upload.start()

        await createAfterUpload.mutateAsync({
          bunnyVideoId: videoId,
          title: file.name,
          width,
          height,
        });
      })
    } catch(error:any) {
      setState((s) => ({ ...s, uploading: false }));
      onProgressChange?.(false);
      toast.error("Upload failed" + error.message)
    }
  }

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) void tusUploader(f);
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0]; if (f) void tusUploader(f);
  };

  const { file, progress } = state;

  if (file) {
    return (
      <div className="flex flex-col h-full w-full min-h-0">
        {progress < 100 && (
            <div className="flex flex-col items-center justify-center gap-2 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
                <div className="relative h-12 w-12 flex items-center justify-center bg-primary/5 rounded-full">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <Upload className="h-5 w-5 text-primary animate-bounce" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {progress}% Uploading...
                    </p>
                </div>
            </div>
        )}
        {progress === 100 && (!video || (video?.bunnyStatus !== 'completed' && video?.bunnyStatus !== 'error')) && (
            <div className="flex flex-col items-center justify-center gap-2 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="relative h-12 w-12 flex items-center justify-center bg-primary/5 rounded-full">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium truncate max-w-xs">
                        {(() => {
                            switch (video?.bunnyStatus) {
                                case 'queued': return 'Video queued...';
                                case 'processing': return 'Processing video...';
                                case 'encoding': return 'Transcoding video...';
                                case 'resolution_finished': return 'Optimizing quality...';
                                case 'failed': return 'Processing failed';
                                default: return 'Processing video...';
                            }
                        })()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {(() => {
                            switch (video?.bunnyStatus) {
                                case 'queued': return 'Waiting in line to be processed';
                                case 'processing': return 'Analyzing video file';
                                case 'encoding': return 'Converting formats';
                                case 'resolution_finished': return 'You can preview it now in lower quality';
                                case 'failed': return 'Something went wrong';
                                default: return 'This might take a moment';
                            }
                        })()}
                    </p>
                </div>
            </div>
        )}
        <div className="flex-1 overflow-y-auto p-4">
          {children || (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Preparing your video... (Don't close this dialog)</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-3 w-full max-w-lg h-full z-50 mx-auto">
      <form className="w-full" onSubmit={(e) => e.preventDefault()}>
        <div
          className="flex justify-center rounded-md border mt-2 border-dashed border-input px-6 py-12"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <div>
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
                  accept="video/*"
                  onChange={onPick}
                />
              </label>
              <p className="pl-1">to upload</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Video duration is limited to 10 minutes!
            </p>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Daily upload limit: 5 videos
            </p>
          </div>
        </div>

        <p className="mt-2 text-xs leading-5 text-muted-foreground sm:flex sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            By default, videos will be private <LockIcon className="size-4" />
          </span>
        </p>

      </form>
    </div>
  );
};