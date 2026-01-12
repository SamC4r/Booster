"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { Suspense, useState, KeyboardEvent } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { z } from "zod";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Form,
  FormControl,
  FormMessage,
  FormItem,
  FormLabel,
  FormField,
} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  CopyCheckIcon,
  CopyIcon,
  Globe2Icon,
  LockIcon,
  MoreVerticalIcon,
  TrashIcon,
  Loader2,
  Eye,
  Calendar,
  Clock,
  XIcon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { videoUpdateSchema } from "@/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";
import { formatDuration, snakeCaseToTitle } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { BunnyEmbed } from "@/modules/videos/ui/sections/BunnyEmbed";
import { useTheme } from "next-themes";
// import { VTTGenerator } from "../components/chapters";
// import { Checkbox } from "@radix-ui/react-checkbox";

interface PageProps {
  videoId: string;
}

export const FormSection = ({ videoId }: PageProps) => {
  return (
    <div className=" p-6">
      <div className=" mx-auto">
        <Suspense fallback={<FormSectionSkeleton />}>
          <ErrorBoundary fallback={<FormErrorFallback />}>
            <FormSectionSuspense videoId={videoId} />
          </ErrorBoundary>
        </Suspense>
      </div>
    </div>
  );
};

const FormSectionSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 bg-gray-200 rounded w-20"></div>
          <div className="h-10 bg-gray-200 rounded w-10"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="space-y-6 lg:col-span-3">
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-16"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-24"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-20"></div>
            <div className="h-24 bg-gray-200 rounded w-40"></div>
          </div>
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-20"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl p-1 h-fit shadow-sm">
            <div className="aspect-video bg-gray-200 rounded-xl"></div>
            <div className="p-4 space-y-5">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-28"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-20"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FormErrorFallback = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-3 bg-red-100 rounded-full mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
        Something went wrong
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        We couldn&apos;t load the video details. Please try again.
      </p>
      <Button
        onClick={() => window.location.reload()}
        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
      >
        Try Again
      </Button>
    </div>
  );
};



const FormSectionSuspense = ({ videoId }: PageProps) => {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { theme } = useTheme();

  const [video] = trpc.studio.getOne.useSuspenseQuery(
    { id: videoId },
    {
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        return status === "processing" || status === "waiting" || !status ? 1000 : false;
      },
    }
  );
  const [categories] = trpc.categories.getMany.useSuspenseQuery();
  const [communities] = trpc.community.getMany.useSuspenseQuery({ limit: 100 });



  const update = trpc.videos.update.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      utils.studio.getOne.invalidate({ id: videoId });
      toast.success("Video details updated successfully!");

    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong while updating.");
    },
  });

  const remove = trpc.videos.remove.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      toast.success("Video deleted successfully!");
      router.push("/studio");
    },
    onError: () => {
      toast.error("Something went wrong while deleting.");
    },
  });

  const form = useForm<z.infer<typeof videoUpdateSchema>>({
    defaultValues: video,
    resolver: zodResolver(videoUpdateSchema),
  });

  const [tagInput, setTagInput] = useState("");

  const handleAddTag = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = tagInput.trim();
      if (value) {
        const currentTags = form.getValues("tags") || [];
        if (!currentTags.includes(value)) {
          form.setValue("tags", [...currentTags, value]);
        }
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };

  const onSubmit = async (data: z.infer<typeof videoUpdateSchema>) => {
    console.log("DATA", data);

    update.mutateAsync(data);
  };

  const fullUrl = `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"
    }/videos/${videoId}`;
  const [isCopied, setIsCopied] = useState(false);

  const onCopy = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Video Details
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage and update your video information
              </p>
            </div>
            <div className="flex items-center gap-x-3">
              <Button
                type="submit"
                disabled={update.isPending}
                className="bg-gradient-to-r from-primary to-orange-400 hover:from-amber-700 hover:to-amber-600 transition-all duration-200 shadow-md hover:shadow-lg text-white px-6 py-3 rounded-xl"
              >
                {update.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-200 hover:bg-gray-50 rounded-xl h-11 w-11"
                  >
                    <MoreVerticalIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-xl shadow-lg border border-gray-200 bg-card p-2"
                >
                  <DropdownMenuItem
                    onClick={() => remove.mutate({ id: videoId })}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer px-4 py-3 flex items-center rounded-lg"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete Video
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 justify-between">
            <div className="space-y-6 lg:col-span-3 mr-44">
              {/* Title Field */}
              <div className="bg-card p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-800 dark:text-white flex items-center justify-between">
                        Title

                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Add an engaging title for your video"
                          maxLength={200}
                          className="h-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm mt-1" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description Field */}
              <div className="bg-card p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-800 dark:text-white flex items-center justify-between">
                        Description

                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          rows={8}
                          maxLength={5000}
                          className="resize-none rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
                          placeholder="Describe your video to help viewers understand what it's about"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm mt-1" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Category Field */}
              <div className="bg-card p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-800 dark:text-white">
                        Category
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={
                          field.value !== undefined
                            ? String(field.value)
                            : undefined
                        }
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border border-gray-200 shadow-lg bg-card">
                          {categories.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id}
                              className="rounded-lg px-4 py-3 focus:bg-blue-50 dark:focus:bg-slate-700 transition-colors duration-200"
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500 text-sm mt-1" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Community Field */}
              <div className="bg-card p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <FormField
                  control={form.control}
                  name="communityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-800 dark:text-white">
                        Community
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={
                          field.value !== undefined && field.value !== null
                            ? String(field.value)
                            : undefined
                        }
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200">
                            <SelectValue placeholder="Select a community" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border border-gray-200 shadow-lg bg-card">
                          {communities.items.map((community) => (
                            <SelectItem
                              key={community.communityId}
                              value={community.communityId}
                              className="rounded-lg px-4 py-3 focus:bg-blue-50 dark:focus:bg-slate-700 transition-colors duration-200"
                            >
                              {community.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500 text-sm mt-1" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Video Settings Section (Including AI) */}
              <div className="bg-card p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Video Settings - (Future Implementation)
                </h3>

                {/* AI Field */}
                <div className="bg-card p-2 rounded-2xl border shadow-sm w-full">
                  <FormField
                    control={form.control}
                    name="isAi"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-base font-medium text-gray-800 dark:text-white">
                          AI Content
                        </FormLabel>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <FormControl>
                            <Checkbox
                              id="is_ai"
                              checked={!!field.value}
                              onCheckedChange={field.onChange}
                              ref={field.ref}
                            />
                          </FormControl>
                          <div>
                            <label className="text-sm font-medium text-gray-800 dark:text-white cursor-pointer">
                              Made with AI
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              This video was mostly created using AI
                            </p>
                          </div>
                        </div>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-800 dark:text-white">
                    Tags
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tags can be useful if content in your video is commonly misspelled. Otherwise, tags play a minimal role in helping viewers find your video.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.watch("tags")?.map((tag: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1 px-3 py-1 text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-full transition-colors"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-blue-900 focus:outline-none"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Add a tag and press Enter (e.g: tutorial, education,...)"
                    className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Video Language */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800 dark:text-white">
                      Video Language
                    </label>
                    <Select defaultValue="en">
                      <SelectTrigger className="h-12 rounded-xl border-gray-200">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-gray-200 shadow-lg bg-card">
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Caption Certification */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800 dark:text-white">
                      Caption Certification
                    </label>
                    <Select defaultValue="none">
                      <SelectTrigger className="h-12 rounded-xl border-gray-200">
                        <SelectValue placeholder="Select certification" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-gray-200 shadow-lg bg-card">
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="us_tv">This content has never aired on television in the U.S.</SelectItem>
                        <SelectItem value="us_tv_no_captions">This content has only aired on television in the U.S. without captions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Distribution */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800 dark:text-white">
                      Distribution
                    </label>
                    <Select defaultValue="everywhere">
                      <SelectTrigger className="h-12 rounded-xl border-gray-200">
                        <SelectValue placeholder="Select distribution" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-gray-200 shadow-lg bg-card">
                        <SelectItem value="everywhere">Everywhere</SelectItem>
                        <SelectItem value="monetized">Make this video available only on monetized platforms</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Comments */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800 dark:text-white">
                      Comments
                    </label>
                    <Select defaultValue="on">
                      <SelectTrigger className="h-12 rounded-xl border-gray-200">
                        <SelectValue placeholder="Select setting" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-gray-200 shadow-lg bg-card">
                        <SelectItem value="on">On</SelectItem>
                        <SelectItem value="off">Off</SelectItem>
                        <SelectItem value="hold">Hold for review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort by */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800 dark:text-white">
                      Sort by
                    </label>
                    <Select defaultValue="top">
                      <SelectTrigger className="h-12 rounded-xl border-gray-200">
                        <SelectValue placeholder="Select sort order" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-gray-200 shadow-lg bg-card">
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Shorts Remixing */}
                <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <Checkbox id="remixing" defaultChecked />
                  <div className="space-y-1">
                    <label
                      htmlFor="remixing"
                      className="text-sm font-medium text-gray-800 dark:text-white cursor-pointer"
                    >
                      Allow Shorts remixing
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Let others create Shorts using content from this video
                    </p>
                  </div>
                </div>

                {/* Show how many viewers like this video */}
                <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <Checkbox id="show_likes" defaultChecked />
                  <div className="space-y-1">
                    <label
                      htmlFor="show_likes"
                      className="text-sm font-medium text-gray-800 dark:text-white cursor-pointer"
                    >
                      Show how many viewers like this video
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-y-6 lg:col-span-2 -pl-24">
              {/* Video Preview Card */}
              <div className="flex flex-col gap-4 bg-card rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm h-fit">
                <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
                  Video Preview
                </h3>
                <div className="aspect-video relative rounded-xl overflow-hidden shadow-md min-w-0 w-full">
                  {/* <VideoPlayer
                                        playbackId={video.muxPlaybackId}
                                        thumbnailUrl={video.thumbnailUrl}
                                    /> */}
                  <BunnyEmbed
                    key={video.bunnyStatus}
                    // libraryId={process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID!}
                    videoId={video.bunnyVideoId}
                    theme={theme}
                  />
                  {/* Overlay for processing state */}
                  {(video.bunnyStatus === 'processing' || video.bunnyStatus === 'encoding' || video.bunnyStatus === 'queued') && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                      <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
                      <p className="text-white text-sm font-medium">Processing Preview...</p>
                    </div>
                  )}
                  {/* <Player src={video.playbackUrl} thumbnailUrl={video.thumbnailUrl ?? THUMBNAIL_FALLBACK} /> */}
                </div>

                {/* Video Stats */}
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex items-center">
                    <Eye className="h-4 w-4 text-gray-500 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Views
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {video.views || 0}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex items-center">
                    <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Uploaded
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {video.createdAt
                          ? format(new Date(video.createdAt), "MMM d, yyyy")
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex items-center">
                    <Clock className="h-4 w-4 text-gray-500 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Duration
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDuration(video?.duration)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2 flex flex-col gap-y-5">
                  <div className="flex justify-between items-center gap-x-2">
                    <div className="flex flex-col gap-y-1 flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Video URL
                      </p>
                      <div className="flex items-center gap-x-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg max-w-lg">
                        <Link
                          href={`/videos/${video.id}`}
                          className="line-clamp-1 text-sm text-blue-600 hover:text-blue-700 flex-1"
                        >
                          {fullUrl}
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8 rounded-lg hover:bg-blue-50"
                          onClick={onCopy}
                          disabled={isCopied}
                        >
                          {isCopied ? (
                            <CopyCheckIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <CopyIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                        Video Status
                      </p>
                      <div className="flex items-center">
                        <div
                          className={`h-2 w-2 rounded-full mr-2 ${video.status === "completed"
                            ? "bg-green-500"
                            : video.status === "processing"
                              ? "bg-yellow-500"
                              : "bg-gray-500"
                            }`}
                        ></div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {snakeCaseToTitle(video.status || "Preparing")}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                        Subtitles Status
                      </p>
                      <div className="flex items-center">
                        <div
                          className={`h-2 w-2 rounded-full mr-2 ${video.status === "completed"
                            ? "bg-green-500"
                            : video.status === "processing"
                              ? "bg-yellow-500"
                              : "bg-gray-500"
                            }`}
                        ></div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {"No Subtitles"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visibility Field */}
              <div className="bg-card p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-800 dark:text-white">
                        Visibility
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={
                          field.value !== undefined
                            ? String(field.value)
                            : undefined
                        }
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 dark:focus:bg-slate-700 transition-colors duration-200">
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border border-gray-200 shadow-lg bg-card dark:focus:bg-slate-700">
                          <SelectItem
                            value="public"
                            className="rounded-lg px-4 py-3 focus:bg-blue-50 dark:focus:bg-slate-700 transition-colors duration-200"
                          >
                            <div className="flex items-center">
                              <Globe2Icon className="h-4 w-4 mr-2 text-blue-600" />
                              <span>Public</span>
                              <span className="ml-5 text-sm text-gray-500 dark:text-white">
                                Anyone can view
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem
                            value="private"
                            className="rounded-lg px-4 py-3 focus:bg-blue-50 dark:focus:bg-slate-700 transition-colors duration-200"
                          >
                            <div className="flex items-center">
                              <LockIcon className="h-4 w-4 mr-2 text-gray-600" />
                              <span>Private</span>
                              <span className="ml-4 text-sm text-gray-500 dark:text-white">
                                Only you can view
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500 text-sm mt-1" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Chapters 
                            <div>
                                <VTTGenerator />
                            </div>
                            */}
            </div>
          </div>
        </form>
      </Form>
    </>
  );
};
