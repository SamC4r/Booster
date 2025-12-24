"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { Loader2, Youtube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export const SyncYouTubeButton = () => {
  const router = useRouter();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  const { mutate: sync, isPending } = trpc.studio.syncYouTube.useMutation({
    onMutate: () => {
        toast({
            title: "Sync Started",
            description: "Fetching videos from YouTube... This may take a minute.",
        });
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Complete",
        description: `Synced ${data.synced} videos from YouTube`,
      });
      utils.studio.invalidate(); 
      router.refresh();
    },
    onError: (error) => {
      if (error.message === "YouTube not connected") {
         window.location.href = "/api/youtube/auth";
      } else {
        toast({
            title: "Sync Failed",
            description: error.message,
            variant: "destructive"
        });
      }
    }
  });

  return (
    <Button 
      variant="outline" 
      onClick={() => sync()} 
      disabled={isPending}
      className={isPending ? "animate-pulse" : ""}
    >
      {isPending ? (
        <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Syncing Videos...
        </>
      ) : (
        <>
            <Youtube className="mr-2 h-4 w-4 text-red-600" />
            Sync YouTube
        </>
      )}
    </Button>
  );
};
