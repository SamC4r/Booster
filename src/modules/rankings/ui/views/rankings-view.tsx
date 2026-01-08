"use client";

import { trpc } from "@/trpc/client";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";
import { ZapIcon, Trophy, Crown,  TrendingUp, Users,  CircleStar } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const f = (x: number) => {
  return Math.floor((x * x) / 1000);
};


export const RankingsView = () => {
  const [sortBy, setSortBy] = useState<"xp" | "followers">("xp");
  const [users] = trpc.xp.getTopRanked.useSuspenseQuery({ limit: 100, sortBy });
  

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5" />;
      case 2: return <CircleStar className="w-5 h-5" />;
      case 3: return <CircleStar className="w-5 h-5" />;
      default: return null;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-300 dark:from-yellow-500 dark:via-yellow-400 dark:to-amber-400 text-yellow-900 shadow-sm";
      case 2:
        return "bg-gradient-to-br from-gray-200 via-gray-100 to-gray-50 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 text-gray-800 dark:text-gray-200 shadow-sm";
      case 3:
        return "bg-gradient-to-br from-orange-200 via-orange-100 to-amber-100 dark:from-orange-600 dark:via-orange-500 dark:to-amber-500 text-orange-900 dark:text-orange-100 shadow-sm";
      default:
        return "bg-muted/50 dark:bg-muted/10 border border-border/50";
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toLocaleString();
  };



  return (
    <div className="min-h-screen  bg-gradient-to-b from-background via-background to-muted/5 py-8 px-4">
      <div className="">
        {/* Header */}
        <div className="relative mb-12">
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="p-4 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl shadow-md">
                    <Trophy className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-500 bg-clip-text text-transparent">
                    Global Booster Rankings
                  </h1>
                  <p className="text-lg text-muted-foreground mt-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Top 100 channels by {sortBy === "xp" ? "level" : "followers"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground hidden md:block">Sort by</span>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as "xp" | "followers")}>
                  <SelectTrigger className="w-[160px] bg-background/50 backdrop-blur-sm border-border/50">
                    <SelectValue placeholder="Sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xp">Channel Level</SelectItem>
                    <SelectItem value="followers">Followers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <div className="relative">
            
            {/* Table Container */}
            <div className="relative bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 p-6 border-b border-border/50 bg-gradient-to-r from-muted/10 via-muted/5 to-transparent">
                <div className="col-span-1 lg:col-span-1 text-center font-bold text-muted-foreground uppercase tracking-wider text-sm">
                  Rank
                </div>
                <div className="col-span-5 lg:col-span-6 font-bold text-muted-foreground uppercase tracking-wider text-sm">
                  Channel
                </div>
                <div className="col-span-3 lg:col-span-2 font-bold text-muted-foreground uppercase tracking-wider text-sm text-center">
                  Followers
                </div>
                <div className="col-span-3 lg:col-span-3 font-bold text-muted-foreground uppercase tracking-wider text-sm text-right">
                  Level
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-border/30">
                  {users.map((user, index) => {
                  const rank = index + 1;
                  const isTopThree = rank <= 3;
                  const followers = user.followers || 0;

                  const channelLevel = Math.floor(
                    Math.floor(Math.sqrt((user.boostPoints ?? 0) * 1000)) / 1000
                  );

                  const xpOnCurrentLevel = f(1000 * channelLevel);
                  const xpForNextLevel = f(1000 * (channelLevel + 1));

                  const xpPercentage = Math.max(
                    0,
                    Math.min(
                      100,
                      (((user.boostPoints ?? 0) - xpOnCurrentLevel) /
                        (xpForNextLevel - xpOnCurrentLevel)) *
                      100
                    )
                  );

                  // console.log( "USUARIO" , user, xpPercentage);

                  return (
                    <div
                      key={user.id}
                      className={`group grid grid-cols-12 gap-4 p-5 items-center transition-colors duration-200 
                        ${isTopThree ? 'bg-muted/5' : 'hover:bg-muted/10'}
                        ${rank === 1 ? 'border-l-4 border-l-yellow-500' : 
                          rank === 2 ? 'border-l-4 border-l-gray-400' : 
                          rank === 3 ? 'border-l-4 border-l-orange-500' : ''}`}
                    >
                      {/* Rank Column */}
                      <div className="col-span-1 lg:col-span-1 flex justify-center">
                        <div className={`
                          relative w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-2xl font-bold lg:text-lg text-md
                          ${getRankStyle(rank)}
                        `}>
                          {getRankIcon(rank)}
                          {!isTopThree && (
                            <span className="font-bold">{rank}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Channel Column */}
                      <div className="col-span-5 lg:col-span-6 min-w-0">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <UserAvatar 
                              userId={user.id} 
                              imageUrl={user.imageUrl} 
                              name={user.name}
                              size="lg"
                              trigger="hover"
                              className={`
                                ${rank === 1 ? 'ring-2 ring-yellow-500' : 
                                  rank === 2 ? 'ring-2 ring-gray-400' : 
                                  rank === 3 ? 'ring-2 ring-orange-500' : 
                                  ''}`}
                            />
                            {rank <= 3 && (
                              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center
                                  ${rank === 1 ? 'bg-yellow-500' : 
                                    rank === 2 ? 'bg-gray-400' : 
                                    'bg-orange-500'}`}>
                                  {getRankIcon(rank)}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={`/users/${user.id}`} 
                              className="flex flex-col gap-1"
                            >
                              <div className="flex items-center gap-2 group/user">
                                <span className="font-semibold text-base lg:text-lg truncate group-hover/user:text-primary transition-colors">
                                  {user.name}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground hidden lg:inline">
                                  @{user.username}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full"
                                      style={{ width: `${xpPercentage}%` }}
                                    />


                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {xpPercentage.toFixed(1)}%
                                  </p>
                                 
                                </div>
                              </div>
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Followers Column */}
                      <div className="col-span-3 lg:col-span-2 flex items-center justify-center">
                        <div className="relative group/followers">
                          <div className="flex items-center gap-2.5  
                                       backdrop-blur-sm px-3 lg:px-4 py-2    
                                       ">
                              <div className="text-center text-xl lg:text-2xl font-bold text-secondary">
                                {formatFollowers(followers)}
                              </div>
                          </div>
                          
                        </div>
                      </div>

                      {/* Level Column */}
                      <div className="col-span-3 lg:col-span-3 flex items-center justify-end">
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden lg:block">
                            <div className="text-xs text-muted-foreground mb-1">Total Points</div>
                            <div className="font-mono font-bold text-lg">
                              {(user.boostPoints ?? 0).toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="relative">
                            <div className="flex items-center gap-2.5 bg-gradient-to-r rounded-xl backdrop-blur-sm 
                                         px-4 py-2.5 
                                          ">
                              <ZapIcon className="w-5 h-5 text-amber-500" />
                              <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                                {channelLevel}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
     
    </div>
  );
};