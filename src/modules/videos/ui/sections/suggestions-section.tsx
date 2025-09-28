'use client'
import { motion } from "framer-motion";
import { Play, Eye,  Star, TrendingUp, Sparkles } from "lucide-react";
import Image from "next/image";

interface Video {
    id: string;
    title: string;
    thumbnailUrl: string;
    duration: string;
    views: number;
    rating: number;
    user: {
        name: string;
        imageUrl: string;
    };
    category: string;
}

interface SuggestionsSectionProps {
    videos?: Video[];
    title?: string;
    videoId: string;
}

export const SuggestionsSection = ({
    videos = mockVideos,
    title = "Watch next",
    videoId,
}: SuggestionsSectionProps) => {
    return (
        <div className="relative py-8">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/30" />

            <div className="relative z-10">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative flex items-center w-full mb-8 px-4"
                >
                    {/* Centered title */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3">
                        <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
                        <h2 className="text-2xl font-bold text-gray-900 text-center dark:text-white">{title}</h2>
                    </div>

                    {/* End-aligned trending */}
                    <div className="ml-auto flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-sm font-medium">Trending</span>
                    </div>
                </motion.div>

                {/* Video grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
                    {videos.map((video, index) => (
                        <motion.div
                            key={video.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group cursor-pointer"
                        >
                            <div className="relative  rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                                {/* Thumbnail container */}
                                <div className="relative aspect-video ">
                                    {/* Thumbnail */}
                                    <Image
                                        src={video.thumbnailUrl}
                                        alt={video.title}
                                        width={240}
                                        height={240}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />

                                    {/* Overlay gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                    {/* Duration badge */}
                                    <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm">
                                        {video.duration}
                                    </div>

                                    {/* Play button overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                                                <Play className="h-5 w-5 text-black ml-1 fill-black" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category badge */}
                                    <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                                        {video.category}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    {/* Title */}
                                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                        {video.title}
                                    </h3>

                                    {/* User info */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <Image
                                            src={video.user.imageUrl}
                                            alt={video.user.name}
                                            width={24}
                                            height={24}
                                            className="w-6 h-6 rounded-full object-cover"
                                        />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {video.user.name}
                                        </span>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                <span>{formatCompactNumber(video.views)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3" />
                                                <span>{video.rating.toFixed(1)}</span>
                                            </div>
                                        </div>

                                        {/* Trending indicator */}
                                        {index < 2 && (
                                            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                                <Sparkles className="w-3 h-3" />
                                                <span className="text-xs font-medium">Trending</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Hover effect border */}
                                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-amber-300 dark:group-hover:border-amber-600 transition-all duration-300 pointer-events-none" />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* View all button */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex justify-center mt-8"
                >
                    <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 transform hover:-translate-y-0.5">
                        View All Suggestions
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

// Helper function to format numbers
const formatCompactNumber = (number: number): string => {
    return Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1
    }).format(number);
};

// Mock data for demonstration
const mockVideos: Video[] = [
    {
        id: "1",
        title: "Amazing Mountain Landscape Timelapse",
        thumbnailUrl: "/placeholder.webp",//"https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",

        duration: "4:32",
        views: 1250000,
        rating: 4.8,
        user: {
            name: "NatureLover",
            imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"
        },
        category: "Nature"
    },
    {
        id: "2",
        title: "Urban City Life - Street Photography",
        thumbnailUrl:  "/placeholder.webp",//"https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
        duration: "7:15",
        views: 890000,
        rating: 4.6,
        user: {
            name: "CityExplorer",
            imageUrl:  "/placeholder.webp",// "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"
        },
        category: "Urban"
    },
    {
        id: "3",
        title: "Cooking Masterclass: Italian Cuisine",
        thumbnailUrl:  "/placeholder.webp",//"https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
        duration: "12:45",
        views: 2300000,
        rating: 4.9,
        user: {
            name: "ChefMarco",
            imageUrl:  "/placeholder.webp", //"https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"
        },
        category: "Cooking"
    },
    {
        id: "4",
        title: "Sunset Beach Meditation Guide",
        thumbnailUrl:  "/placeholder.webp",//"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
        duration: "18:20",
        views: 560000,
        rating: 4.7,
        user: {
            name: "ZenMaster",
            imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"
        },
        category: "Wellness"
    }
];
