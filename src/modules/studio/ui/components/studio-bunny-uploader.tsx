"use client";

import { LockIcon, Upload, Loader2 } from "lucide-react";
import { ChangeEvent, DragEvent, useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { useRouter } from "next/navigation";

import * as tus from 'tus-js-client'

interface StudioBunnyUploaderProps {
  onSuccess?: (videoId: string) => void;
  onUploadStarted?: (videoId: string) => void;
  children?: React.ReactNode;
}

const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      reject("Invalid video file");
    }
    video.src = URL.createObjectURL(file);
  });
};

// --- Upload Service Singleton ---
type UploadCallbacks = {
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
  onSuccess?: (videoId: string) => void;
  onUploadStarted?: (videoId: string) => void;
};

class BunnyUploadService {
  private static instance: BunnyUploadService;
  private activeUpload: tus.Upload | null = null;
  private videoIdRef: string | null = null;

  static getInstance() {
    if (!BunnyUploadService.instance) {
      BunnyUploadService.instance = new BunnyUploadService();
    }
    return BunnyUploadService.instance;
  }

  async startUpload(file: File, callbacks: UploadCallbacks = {}) {
    try {
      const MAX_SIZE_BYTES = 10 * 1024 * 1024 * 1024;  // 10 GB size limit
      if (file.size > MAX_SIZE_BYTES) {
        callbacks.onError?.("Video file is larger than 10 GB. Contact the admins to upload a bigger video file.");
        return;
      }
      const duration = await getVideoDuration(file);
      if (duration > 600) {
        callbacks.onError?.("Video is longer than 10 minutes");
        return;
      }

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

      this.videoIdRef = videoId;
      callbacks.onUploadStarted?.(videoId);

      this.activeUpload = new tus.Upload(file, {
        endpoint: 'https://video.bunnycdn.com/tusupload',
        headers: {
          AuthorizationSignature: signature,
          AuthorizationExpire: expires,
          VideoId: videoId,
          LibraryId: libraryId,
        },
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
        onError: (err) => {
          callbacks.onError?.(`Upload failed: ${err.message}`);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const pct = Math.min(99, Math.round((bytesUploaded / bytesTotal) * 100));
          callbacks.onProgress?.(pct);
        },
        onSuccess: async () => {
          callbacks.onProgress?.(100);
          callbacks.onSuccess?.(videoId);
        },
      });
      this.activeUpload.findPreviousUploads().then(async (previousUploads) => {
        if (previousUploads.length) {
          this.activeUpload?.resumeFromPreviousUpload(previousUploads[0]);
        }
        this.activeUpload?.start();
      });
    } catch (err: any) {
      callbacks.onError?.("Upload failed");
    }
  }

  getVideoId() {
    return this.videoIdRef;
  }
}


export const StudioBunnyUploader = ({ onSuccess, onUploadStarted, children }: StudioBunnyUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const router = useRouter();

  // trpc mutation for after upload
  const createAfterUpload = trpc.videos.createAfterUpload.useMutation({
    onSuccess: (data) => {
      utils.studio.getMany.invalidate({ limit: DEFAULT_LIMIT });
      setVideoId(data.id);
      onUploadStarted?.(data.id);
    }
  });

  // Query for video status
  const { data: video } = trpc.studio.getOne.useQuery(
    { id: videoId ?? "" },
    {
      enabled: !!videoId && progress === 100,
      refetchInterval: (query) => {
        const status = query.state.data?.bunnyStatus;
        return !query.state.data || (status !== 'completed' && status !== 'error') ? 1000 : false;
      }
    }
  );

  // Start upload using singleton service
  const startUpload = (f: File) => {
    setFile(f);
    setProgress(0);
    setUploading(true);
    setError(null);
    BunnyUploadService.getInstance().startUpload(f, {
      onProgress: (pct) => setProgress(pct),
      onError: (msg) => { setError(msg); setUploading(false); toast.error(msg); },
      onSuccess: (vid) => {
        setProgress(100);
        setUploading(false);
        toast.success("Uploaded! Processing started.");
        setVideoId(vid);
        if (onSuccess) onSuccess(vid);
        else router.push(`/studio/videos/${vid}`);
        // After upload, call mutation
        createAfterUpload.mutateAsync({ bunnyVideoId: vid, title: f.name });
      },
      onUploadStarted: (vid) => {
        setVideoId(vid);
        onUploadStarted?.(vid);
      }
    });
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) startUpload(f);
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0]; if (f) startUpload(f);
  };

  // If modal closes, upload continues in service

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
              <p className="text-muted-foreground">Preparing your video...</p>
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
              Video duration is limited to 10 minutes!<br />
              Video file size is limited to 10 GB.<br />
              Contact the admins to upload a bigger video file.
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