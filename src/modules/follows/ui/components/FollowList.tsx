'use client'
import { UserAvatar } from "@/components/user-avatar";
import { UserInfo } from "@/modules/users/ui/components/user-info";
import { trpc } from "@/trpc/client"
import { Users, MoreHorizontal, Plus, Search, Globe } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export const FollowList = () => {
    const [followList] = trpc.follows.getMany.useSuspenseQuery();
    const [searchQuery, setSearchQuery] = useState("");

    //TODO: consider changing this to all channels in the platform?

    // Filter users based on search query
    const filteredUsers = followList.filter(user => 
        user.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen  p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-2">Communities you follow</h1>
                </div>

                {/* Search and Stats Bar */}
                <div className="bg-amber-400 dark:bg-[#333333] rounded-xl p-4 shadow-lg mb-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative w-full md:w-64">
                            {/* TODO: implement. Not for MVP */}
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Search people..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-white rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                        
                        <div className="flex items-center text-amber-800 dark:text-amber-200">
                            <Globe className="h-5 w-5 mr-2" />
                            <span className="font-medium">{followList.length} following</span>
                        </div>
                        
                    </div>
                </div>

                {/* User Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredUsers.map((e) => (
                        <div key={e.user?.id} className="bg-white dark:bg-[#333333] rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-100 dark:border-amber-800 hover:border-amber-200 dark:hover:border-amber-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <UserAvatar
                                        imageUrl={e.user?.imageUrl}
                                        name={e.user?.name}
                                        onClick={() => {}}
                                        size='lg'
                                        className="ring-2 ring-amber-400"
                                        userId={e.user?.id}
                                    />
                                    <div>
                                        <h3 className="font-semibold text-amber-900 dark:text-amber-100">{e.user?.name}</h3>
                                        <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm mt-1">
                                            <Users className="h-4 w-4 mr-1" />
                                            <span>{e.user?.followsCount || 0} followers</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <button className="text-amber-500 hover:text-amber-700 p-1 rounded-full hover:bg-amber-100 transition-colors">
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-4 pt-3 border-t border-amber-500">
                                <button className="flex-1 bg-gradient-to-t from-amber-500 to-yellow-500 text-black py-2 rounded-lg text-sm font-medium transition-colors">
                                    View Profile
                                </button>
                               
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredUsers.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-[#333333] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                            <Users className="h-8 w-8 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-medium text-amber-900 dark:text-amber-100 mb-2">
                            {searchQuery ? "No matches found" : "You are not following any community yet"}
                        </h3>
                        <p className="text-amber-600 dark:text-amber-400 max-w-md mx-auto mb-4">
                            {searchQuery 
                                ? `No users found for "${searchQuery}". Try a different search term.`
                                : "Start following people and see them here."
                            }
                        </p>
                        <Link className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors" href="/explorer">
                            <Plus className="h-4 w-4 mr-1" />
                            Discover People
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}