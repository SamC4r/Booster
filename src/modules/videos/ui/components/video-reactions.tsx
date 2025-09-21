import { useState, useMemo } from "react";
import { Rating, RatingButton } from "@/components/ui/shadcn-io/rating";
import { Star, StarIcon, Heart, Users, HeartCrack } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useClerk } from "@clerk/nextjs";

interface Props {
    avgRating: number;
    videoRatings: number;
    onRate: (rating: number) => boolean;
    viewerRating: number;
}

export const VideoReactions = ({ avgRating, onRate, videoRatings, viewerRating }: Props) => {
    const [userRating, setUserRating] = useState(viewerRating || 0);
    const [isChoosing, setChoose] = useState(false);
    const [isRated, setIsRated] = useState(false);
    const [showThanks, setShowThanks] = useState(false);
    const [popRating, setPopRating] = useState(false);

    const { openSignIn } = useClerk();
    const handleRatingChange = (value: number) => {
        if (!value) return;
        const numericValue = Number(value)
        if (isNaN(numericValue)) return;
        if (!onRate(numericValue)) {
            openSignIn({});
            return;
        }
        setUserRating(value);
        setIsRated(true);

        if (value >= 4)
            setShowThanks(true);
    };

    const compactRatings = useMemo(() => {
        return Intl.NumberFormat("en", {
            notation: "compact"
        }).format(videoRatings)
    }, [videoRatings])

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-[#333333] border border-amber-200 dark:border-amber-600 rounded-2xl shadow-[0_5px_25px_rgba(255,161,0,0.1)] gap-2 max-w-sm mx-auto">
            {/* Header */}
            <div className="text-center">
                <p className="font-bold text-lg text-amber-900 dark:text-amber-100">Rate this video</p>
            </div>

            {/* User Rating Interaction */}
            <div className="flex items-center gap-1 rounded-xl">
                <Rating
                    value={userRating}
                    onValueChange={handleRatingChange}
                    className="flex gap-1"
                >
                    {Array.from({ length: 5 }).map((_, index) => (
                        <RatingButton
                            key={index}
                            className="w-5 h-5 text-amber-300 hover:text-amber-400 
                       hover:scale-110 transition-all duration-200 
                       data-[active]:text-amber-500 data-[active]:scale-105
                       data-[active]:animate-pulse"
                        />
                    ))}
                </Rating>
            </div>

            {/* Rating Stats */}
            <div className="flex items-center justify-between gap-6 mt-1 w-full">
                {/* Average Rating */}
                <div className="flex flex-col items-center w-full">
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-current" />
                        <p className="font-bold text-lg text-amber-800 dark:text-amber-200">{Number(avgRating).toFixed(1)}</p>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Average</p>
                </div>

                {/* Total Ratings */}
                <div className="flex flex-col items-center w-full">
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-amber-500" />
                        <p className="font-bold text-lg text-amber-800 dark:text-amber-200">{compactRatings}</p>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Ratings</p>
                </div>
            </div>

            {/* User Rating Status
            <AnimatePresence>
                {isRated && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-2 text-center"
                    >
                        <div className="flex items-center justify-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                            {userRating < 3 ? (
                                <HeartCrack className="w-4 h-4 text-amber-600" />
                            ) : (
                                <Heart className="w-4 h-4 text-amber-600 fill-current" />
                            )}
                            <span className="text-sm font-medium text-amber-800">
                                You rated {userRating}/5
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence> */}
           
        </div>
    );
}