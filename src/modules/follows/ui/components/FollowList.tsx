'use client'
import { UserAvatar } from "@/components/user-avatar";
import { trpc } from "@/trpc/client"
import { Users, Crown, Search, UserPlus, Zap, ArrowRight, Globe2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const FollowList = () => {
    const [followList] = trpc.follows.getMany.useSuspenseQuery();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredUsers = followList.filter(user =>
        user.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );


    return (
        <div className="min-h-screen bg-background ml-4 md:ml-16 lg:ml-20 mr-4 md:mr-6">
            <div className="max-w-6xl mx-auto p-4 md:p-6">
                {/* Enhanced Header */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.03 }}
                    className="text-center mb-12 relative"
                >


                    <div className="relative z-10">


                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="text-4xl md:text-6xl mt-8 font-bold"
                        >
                            Following
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.2 }}
                            className="text-xl text-muted-foreground max-w-2xl mt-6 mx-auto leading-relaxed"
                        >
                            See who you follow!
                        </motion.p>
                    </div>
                </motion.div>

                {/* Enhanced Search and Stats Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0, duration: 0.2 }}
                    className="relative mb-8"
                >
                    <div className="absolute inset-0 rounded-2xl blur-xl transform scale-105" />

                    <div className="relative bg-card backdrop-blur-md rounded-2xl p-6 shadow-xl border border-border">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                            {/* Enhanced Search */}
                            <div className="relative w-full lg:w-96">
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl blur-sm" />
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 z-10 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search profiles..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-background/50 text-foreground rounded-xl backdrop-blur-sm placeholder-muted-foreground relative border border-border focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                    />
                                </div>
                            </div>

                            {/* Enhanced Stats */}
                            <div className="flex flex-wrap gap-6">
                                <div
                                    className="flex items-center gap-3 bg-muted/50 px-4 py-3 rounded-xl backdrop-blur-sm border border-border"
                                >
                                        <div className="text-sm text-muted-foreground">Following</div>
                                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                            {followList.length}
                                        </div>
                                </div>




                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Enhanced User Cards Grid */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={searchQuery}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
                    >
                        {filteredUsers.map((user) => (
                            <motion.div
                                key={user.user?.id}
                                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="relative group cursor-pointer"
                            >
                                {/* Hover Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-105 -z-10" />

                                <div className="relative bg-card rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-border group-hover:border-amber-300 dark:group-hover:border-amber-600 transition-all duration-300 overflow-hidden">
                                    {/* Premium Badge for Top Creators */}
                                    {(user.user?.followsCount || 0) >= 5 && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="absolute top-4 right-4"
                                        >
                                            <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                                <Crown className="h-3 w-3" />
                                                <span>Top</span>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* User Header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <motion.div
                                                whileHover={{ scale: 1.1 }}
                                                className="relative"
                                            >
                                                <UserAvatar
                                                    imageUrl={user.user?.imageUrl}
                                                    name={user.user?.name}
                                                    size='lg'
                                                    className="transition-all duration-300 shadow-lg"
                                                    userId={user.user?.id}
                                                />
                                                {/* Online Indicator */}
                                                {/* <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" /> */}
                                            </motion.div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-foreground text-lg truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                                    {user.user?.name}
                                                </h3>
                                                <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm mt-1">
                                                    <Users className="h-4 w-4 mr-1" />
                                                    <span>{formatCompactNumber(user.user?.followsCount || 0)} followers</span>
                                                </div>
                                            </div>
                                        </div>


                                    </div>



                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4 border-t border-border">
                                        <Link
                                            href={`/users/${user.user?.id}`}
                                            className="flex-1"
                                        >
                                            <motion.button
                                                whileHover={{ scale: 1.05, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="w-full bg-black text-white hover:bg-black/80 py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-[#ffca55] transition-all duration-300 flex items-center justify-center gap-2 border border-white/20"
                                            >
                                                <UserPlus className="h-4 w-4" />
                                                View Profile
                                            </motion.button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* Enhanced Empty State */}
                {filteredUsers.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="text-center py-16  rounded-2xl shadow-xl border relative overflow-hidden bg-gradient-to-b dark:from-black-500/10 dark:to-orange-500/10"
                    >
                      
                        <div className="relative z-10">
                            <motion.h3
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-3"
                            >
                                {searchQuery ? "No matches found" : "You are not following anyone yet"}
                            </motion.h3>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-amber-600 dark:text-amber-400 max-w-md mx-auto mb-6 text-lg leading-relaxed"
                            >
                                {searchQuery
                                    ? `No users found for "${searchQuery}". Go to the explorer!.`
                                    : "When you follow creators, they will appear here."
                                }
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500   text-white px-8 py-4 rounded-2xl font-semibold shadow-lg "
                                >
                                    Discover Creators
                                    <Globe2Icon className="h-5 w-5 transition-transform" />
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

// Helper function for compact number formatting
const formatCompactNumber = (number: number): string => {
    return Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1
    }).format(number);
};

// Add the ArrowRight icon import at the top with other icons
// Add: ArrowRight to the import from lucide-react