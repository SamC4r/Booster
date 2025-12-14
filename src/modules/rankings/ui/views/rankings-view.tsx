"use client";

import { trpc } from "@/trpc/client";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";
import { ZapIcon, Trophy } from "lucide-react";

export const RankingsView = () => {
    const [users] = trpc.xp.getTopRanked.useSuspenseQuery({ limit: 100 });

    return (
        <div className="max-w-4xl mx-auto p-4 pt-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-full">
                    <Trophy className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Channel Rankings</h1>
                    <p className="text-muted-foreground">Top 100 channels by level</p>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/40 text-sm font-medium text-muted-foreground">
                    <div className="col-span-2 md:col-span-1 text-center">Rank</div>
                    <div className="col-span-7 md:col-span-8">Channel</div>
                    <div className="col-span-3 text-right">Level</div>
                </div>

                <div className="divide-y divide-border">
                    {users.map((user, index) => {
                        const boostPoints = user.boostPoints ?? 0;
                        const level = Math.floor(Math.floor(Math.sqrt(boostPoints * 1000)) / 1000);
                        const rank = index + 1;

                        return (
                            <div 
                                key={user.id} 
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors"
                            >
                                <div className="col-span-2 md:col-span-1 flex justify-center">
                                    <div className={`
                                        w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm
                                        ${rank === 1 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500' : 
                                          rank === 2 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' : 
                                          rank === 3 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-500' : 
                                          'text-muted-foreground'}
                                    `}>
                                        {rank}
                                    </div>
                                </div>
                                
                                <div className="col-span-7 md:col-span-8 min-w-0">
                                    <Link href={`/users/${user.id}`} className="flex items-center gap-3 group">
                                        <UserAvatar 
                                            userId={user.id} 
                                            imageUrl={user.imageUrl} 
                                            name={user.name}
                                            size="sm"
                                        />
                                        <span className="font-medium truncate group-hover:text-primary transition-colors">
                                            {user.name}
                                        </span>
                                    </Link>
                                </div>

                                <div className="col-span-3 flex items-center justify-end gap-2">
                                    <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
                                        <ZapIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                                        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                                            {level}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
