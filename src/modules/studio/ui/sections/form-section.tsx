'use client';

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { z } from "zod"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

import {
    Form,
    FormControl,
    FormMessage,
    FormItem,
    FormLabel,
    FormField,
} from "@/components/ui/form"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

import { CopyCheckIcon, CopyIcon, Globe2Icon, ImagePlusIcon, LockIcon, MoreVerticalIcon, RotateCcwIcon, SparklesIcon, TrashIcon, Loader2, Eye, Calendar, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { videoUpdateSchema } from "@/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";
import { formatDuration, snakeCaseToTitle } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { THUMBNAIL_FALLBACK } from "@/modules/videos/constants";
import { ThumbnailUploadModal } from "../components/thumbnail-upload-modal";
import { format } from "date-fns";
import Player from "@/modules/videos/ui/sections/Player";

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
    )
}

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
    )
}

const FormErrorFallback = () => {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#333333] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-3 bg-red-100 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Something went wrong</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">We couldn&apost load the video details. Please try again.</p>
            <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
                Try Again
            </Button>
        </div>
    );
}

const FormSectionSuspense = ({ videoId }: PageProps) => {
    const router = useRouter();
    const utils = trpc.useUtils();

    const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);
    const [video] = trpc.studio.getOne.useSuspenseQuery({ id: videoId });
    const [categories] = trpc.categories.getMany.useSuspenseQuery();

    const update = trpc.videos.update.useMutation({
        onSuccess: () => {
            utils.studio.getMany.invalidate();
            utils.studio.getOne.invalidate({ id: videoId });
            toast.success("Video details updated successfully!");
        },
        onError: () => {
            toast.error("Something went wrong while updating.");
        }
    });

    const remove = trpc.videos.remove.useMutation({
        onSuccess: () => {
            utils.studio.getMany.invalidate();
            toast.success("Video deleted successfully!");
            router.push('/studio');
        },
        onError: () => {
            toast.error("Something went wrong while deleting.");
        }
    });

    const restoreThumbnail = trpc.videos.restoreThumbnail.useMutation({
        onSuccess: () => {
            utils.studio.getMany.invalidate();
            utils.studio.getOne.invalidate({ id: videoId });
            toast.success("Thumbnail restored to original");
        },
        onError: () => {
            toast.error("Something went wrong while restoring thumbnail.");
        }
    });

    const form = useForm<z.infer<typeof videoUpdateSchema>>({
        defaultValues: video,
        resolver: zodResolver(videoUpdateSchema),
    });

    const onSubmit = async (data: z.infer<typeof videoUpdateSchema>) => {
        update.mutateAsync(data);
    }

    const fullUrl = `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/explorer/videos/${videoId}`
    const [isCopied, setIsCopied] = useState(false);

    const onCopy = async () => {
        await navigator.clipboard.writeText(fullUrl)
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false)
        }, 2000)
    }

    return (
        <>
            <ThumbnailUploadModal
                open={thumbnailModalOpen}
                onOpenChange={setThumbnailModalOpen}
                videoId={videoId}
            />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Video Details</h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage and update your video information</p>
                        </div>
                        <div className="flex items-center gap-x-3">
                            <Button
                                type='submit'
                                disabled={update.isPending}
                                className="bg-gradient-to-r from-primary to-orange-400 hover:from-amber-700 hover:to-amber-600 transition-all duration-200 shadow-md hover:shadow-lg text-white px-6 py-3 rounded-xl"
                            >
                                {update.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : "Save Changes"}
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant='outline'
                                        size='icon'
                                        className="border-gray-200 hover:bg-gray-50 rounded-xl h-11 w-11"
                                    >
                                        <MoreVerticalIcon className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end' className="w-48 rounded-xl shadow-lg border border-gray-200 bg-white p-2">
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
                            <div className="bg-white dark:bg-[#333333] p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <FormField
                                    control={form.control}
                                    name='title'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base font-medium text-gray-800 dark:text-white flex items-center justify-between">
                                                Title
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                                                >
                                                    <SparklesIcon className="h-3.5 w-3.5 mr-1" />
                                                    AI Generate
                                                </Button>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Add an engaging title for your video"
                                                    className="h-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-red-500 text-sm mt-1" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Description Field */}
                            <div className="bg-white dark:bg-[#333333] p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <FormField
                                    control={form.control}
                                    name='description'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base font-medium text-gray-800 dark:text-white flex items-center justify-between">
                                                Description
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                                                >
                                                    <SparklesIcon className="h-3.5 w-3.5 mr-1" />
                                                    AI Generate
                                                </Button>
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    rows={8}
                                                    className="resize-none rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
                                                    placeholder="Describe your video to help viewers understand what it's about"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-red-500 text-sm mt-1" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Thumbnail Field */}
                            <div className="bg-white dark:bg-[#333333] p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <FormLabel className="text-base font-medium text-gray-800 dark:text-white">Thumbnail</FormLabel>
                                <div className="mt-4">
                                    <div className="relative h-[180px] w-full max-w-[320px] group rounded-xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-blue-400 transition-all duration-300">
                                        <Image
                                            src={video.thumbnailUrl ?? THUMBNAIL_FALLBACK}
                                            className="object-cover"
                                            fill
                                            alt="Video thumbnail"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        type='button'
                                                        className="bg-white text-gray-800 hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md rounded-full h-11 w-11 absolute top-3 right-3"
                                                    >
                                                        <MoreVerticalIcon className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align='start' side='right' className="rounded-xl shadow-lg border border-gray-200 w-44 bg-white dark:bg-[#333333]">
                                                    <DropdownMenuItem
                                                        onClick={() => setThumbnailModalOpen(true)}
                                                        className="cursor-pointer px-4 py-3 flex items-center rounded-lg dark:hover:bg-blue-900"
                                                    >
                                                        <ImagePlusIcon className="h-4 w-4 mr-2 " />
                                                        Change
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="cursor-pointer px-4 py-3 flex items-center rounded-lg dark:hover:bg-blue-900">
                                                        <SparklesIcon className="h-4 w-4 mr-2" />
                                                        AI-generated
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => restoreThumbnail.mutate({ id: videoId })}
                                                        className="cursor-pointer px-4 py-3 flex items-center rounded-lg dark:hover:bg-blue-900"
                                                    >
                                                        <RotateCcwIcon className="h-4 w-4 mr-2" />
                                                        Restore
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Recommended: 1280×720 pixels (16:9 ratio)</p>
                                </div>
                            </div>

                            {/* Category Field */}
                            <div className="bg-white dark:bg-[#333333] p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <FormField
                                    control={form.control}
                                    name='categoryId'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base font-medium text-gray-800 dark:text-white">Category</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value !== undefined ? String(field.value) : undefined}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200">
                                                        <SelectValue placeholder='Select a category' />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border border-gray-200 shadow-lg bg-whitea dark:bg-[#333333]">
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
                        </div>

                        <div className="flex flex-col gap-y-6 lg:col-span-2 -pl-24">
                            {/* Video Preview Card */}
                            <div className="flex flex-col gap-4 bg-white dark:bg-[#333333] rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm h-fit">
                                <h3 className="font-semibold text-gray-800 dark:text-white text-lg">Video Preview</h3>
                                <div className="aspect-video relative rounded-xl overflow-hidden shadow-md min-w-0 w-full">
                                    {/* <VideoPlayer
                                        playbackId={video.muxPlaybackId}
                                        thumbnailUrl={video.thumbnailUrl}
                                    /> */}
                                    {/* <BunnyEmbed libraryId={video.bunnyLibraryId} videoId={video.bunnyVideoId} /> */}
                                    <Player src={video.playbackUrl} thumbnailUrl={video.thumbnailUrl ?? THUMBNAIL_FALLBACK} />
                                </div>

                                {/* Video Stats */}
                                <div className="grid grid-cols-3 gap-3 mt-2">
                                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex items-center">
                                        <Eye className="h-4 w-4 text-gray-500 mr-2" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Views</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{(video).views || 0}</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex items-center">
                                        <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Uploaded</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {video.createdAt ? format(new Date(video.createdAt), 'MMM d, yyyy') : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex items-center">
                                        <Clock className="h-4 w-4 text-gray-500 mr-2" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDuration(video?.duration)}</p>
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
                                                    href={`/explorer/videos/${video.id}`}
                                                    className="line-clamp-1 text-sm text-blue-600 hover:text-blue-700 flex-1"
                                                >
                                                    {fullUrl}
                                                </Link>
                                                <Button
                                                    type='button'
                                                    variant='ghost'
                                                    size='icon'
                                                    className="shrink-0 h-8 w-8 rounded-lg hover:bg-blue-50"
                                                    onClick={onCopy}
                                                    disabled={isCopied}
                                                >
                                                    {isCopied ?
                                                        <CopyCheckIcon className="h-4 w-4 text-green-600" /> :
                                                        <CopyIcon className="h-4 w-4" />
                                                    }
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Video Status</p>
                                            <div className="flex items-center">
                                                <div className={`h-2 w-2 rounded-full mr-2 ${video.status === 'completed' ? 'bg-green-500' :
                                                    video.status === 'processing' ? 'bg-yellow-500' : 'bg-gray-500'
                                                    }`}></div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{snakeCaseToTitle(video.status || "Preparing")}</p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Subtitles Status</p>
                                            <div className="flex items-center">
                                                <div className={`h-2 w-2 rounded-full mr-2 ${video.status === 'completed' ? 'bg-green-500' :
                                                    video.status === 'processing' ? 'bg-yellow-500' : 'bg-gray-500'
                                                    }`}></div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{"No Subtitles"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Visibility Field */}
                            <div className="bg-white dark:bg-[#333333] p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <FormField
                                    control={form.control}
                                    name='visibility'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base font-medium text-gray-800 dark:text-white">Visibility</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value !== undefined ? String(field.value) : undefined}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 dark:focus:bg-slate-700 transition-colors duration-200">
                                                        <SelectValue placeholder='Select visibility' />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border border-gray-200 shadow-lg bg-white dark:focus:bg-slate-700 dark:bg-[#333333]">
                                                    <SelectItem value="public" className="rounded-lg px-4 py-3 focus:bg-blue-50 dark:focus:bg-slate-700 transition-colors duration-200">
                                                        <div className="flex items-center">
                                                            <Globe2Icon className="h-4 w-4 mr-2 text-blue-600" />
                                                            <span>Public</span>
                                                            <span className="ml-5 text-sm text-gray-500 dark:text-white">Anyone can view</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="private" className="rounded-lg px-4 py-3 focus:bg-blue-50 dark:focus:bg-slate-700 transition-colors duration-200">
                                                        <div className="flex items-center">
                                                            <LockIcon className="h-4 w-4 mr-2 text-gray-600" />
                                                            <span>Private</span>
                                                            <span className="ml-4 text-sm text-gray-500 dark:text-white">Only you can view</span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-red-500 text-sm mt-1" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </Form>
        </>
    )
}
