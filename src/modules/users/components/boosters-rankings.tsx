'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UserAvatar } from "@/components/user-avatar"
import { trpc } from "@/trpc/client"
import { useAuth, useClerk } from "@clerk/nextjs"
import { Crown, Award, Rocket, Trophy, Zap, Star, MedalIcon, AwardIcon, Medal } from "lucide-react"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"

interface Props {
    userId: string;
}

export const BoosterRankings = ({ userId }: Props) => {
    return (
        <Suspense fallback={<p>Loading...</p>}>
            <ErrorBoundary fallback={<p>Error</p>}>
                <BoosterRankingsSuspense userId={userId} />
            </ErrorBoundary>
        </Suspense>
    )
}

export const BoosterRankingsSuspense = ({ userId }: Props) => {

    const [rankings] = trpc.xp.getBoostersByCreatorId.useSuspenseQuery({ creatorId: userId })


    const { userId: clerkUserId } = useAuth();
    const clerk = useClerk();
    const { data: userLogged } = trpc.users.getByClerkId.useQuery({
        clerkId: clerkUserId,
    });
    const loggedUserId = userLogged?.id; //logged user id

    let userIndex = -1;
    for(let i = 0; i < rankings.length && loggedUserId; i++){
        if(rankings.at(i)?.user.id === loggedUserId){
            userIndex=i;
            break;
        }
    }

    return (
        <div className="space-y-6">
            {/* Ranking Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent mb-2">
                    Community Rankings
                </h2>
                <p className="text-muted-foreground">Top boosters in the community</p>
            </div>

            {/* Time Filter Tabs */}
            {/* <div className="flex justify-center mb-6">
                <div className="bg-muted/50 p-1 rounded-2xl border border-border">
                    {["All Time", "This Month", "This Week"].map((period) => (
                        <button
                            key={period}
                            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${period === "This Month"
                                    ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg"
                                    : "text-muted-foreground hover:bg-muted/30"
                                }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            </div> */}

            {/* Top 3 Ranking Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* 2nd Place */}

                {rankings.length >= 2 && (
                    <div className="relative group transform  transition-transform duration-300">
                        <div className="absolute -inset-1 bg-gradient-to-r from-gray-400 to-gray-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                         {(loggedUserId && loggedUserId === rankings.at(1)?.user.id) && (
                            <span className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-bold z-10">
                                You
                            </span>
                        )}
                        <Card className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-0 p-6 text-center">
                            <div className="relative mb-4">
                                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center border-4 border-gray-300">
                                    <UserAvatar imageUrl={rankings.at(1)?.user.imageUrl} name={rankings.at(1)?.user.name} size='llg' userId={rankings.at(1)?.user.id} />
                                </div>
                                <AwardIcon className="w-6 h-6 text-gray-500 absolute -top-1 right-8" />
                                 <div className="absolute -top-2 -right-2 bg-slate-400 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-black">
                                    #2
                                </div>
                            </div>
                            <h3 className="font-bold text-lg mb-1 truncate">{rankings.at(1)?.user.name}</h3>
                            <p className="text-muted-foreground text-sm mb-2">Silver Booster</p>
                            <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                {rankings.at(1)?.user.totalXpAdded} XP
                            </div>
                        </Card>
                    </div>
                )}
                {/* 1st Place - Highlighted */}

                {rankings.length >= 1 && (
                    <div className="relative group transform hover:scale-105 transition-transform duration-300">
                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
                         {(loggedUserId && loggedUserId === rankings.at(0)?.user.id) && (
                            <span className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-bold z-10">
                                You
                            </span>
                        )}
                        <Card className="relative bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 border-0 p-6 text-center shadow-2xl">
                            <div className="relative mb-4">
                                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-4 border-yellow-300 shadow-lg">
                                    <Crown className="absolute -top-7 w-8 h-8 text-yellow-300" />

                                    <UserAvatar imageUrl={rankings.at(0)?.user.imageUrl} name={rankings.at(0)?.user.name} size='llg' userId={rankings.at(0)?.user.id} />
                                </div>

                                <Medal className="w-6 h-6  absolute -top-1 right-8 text-yellow-300" />
                                <div className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-black">
                                    #1
                                </div>
                            </div>
                            <h3 className="font-bold text-xl mb-1 text-orange-500 truncate">{rankings.at(0)?.user.name}</h3>
                            <p className="text-muted-foreground text-sm mb-2">Golden Booster</p>
                            <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                                {rankings.at(0)?.user.totalXpAdded} XP
                            </div>
                        </Card>
                    </div>
                )}

                {/* 3rd Place */}
                {rankings.length >= 3 && (
                    <div className="relative group transform transition-transform duration-300">
                       
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-950 to-orange-900 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                        {(loggedUserId && loggedUserId === rankings.at(2)?.user.id) && (
                            <span className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-bold z-10">
                                You
                            </span>
                        )}
                        <Card className="relative bg-gradient-to-br from-amber-900/20 to-orange-900/20 dark:from-amber-900/20 dark:to-orange-900/20 border-0 p-6 text-center">
                           
                            <div className="relative mb-4">
                                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center border-4 ">
                                    <UserAvatar imageUrl={rankings.at(2)?.user.imageUrl} name={rankings.at(2)?.user.name} size='llg' userId={rankings.at(2)?.user.id} />
                                    
                                </div>
                               
                                <Award className="w-6 h-6 text-amber-500 absolute -top-1 right-8" />
                                <div className="absolute -top-2 -right-2 bg-orange-950 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-black">
                                    #3
                                </div>
                            </div>

                            <h3 className="font-bold text-lg mb-1 truncate">{rankings.at(2)?.user.name}</h3>
                           
                            <p className="text-muted-foreground text-sm mb-2">Bronze Booster</p>
                            <div className="bg-gradient-to-r from-stone-500 to-orange-800 text-white px-3 py-1 rounded-full text-sm font-bold">
                                {rankings.at(2)?.user.totalXpAdded} XP
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* Ranking List */}
            <Card className="border-border overflow-hidden">
                <CardContent className="p-0">
                    {/* Table Header */}
                    <div className="bg-gradient-to-r from-muted/50 to-muted/30 border-b border-border p-4">
                        <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-muted-foreground">
                            <div className="col-span-1">Rank</div>
                            <div className="col-span-9">User</div>
                            <div className="col-span-1 text-center">XP</div>
                        </div>
                    </div>

                    {/* Ranking Items */}
                    <div className="divide-y divide-border">
                        {rankings.slice(3).map(({ user }, index) => (
                            <div
                                key={user.id}
                                className={`p-4 hover:bg-muted/30 transition-colors group ${(loggedUserId && loggedUserId === user.id) ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-l-4 border-blue-500' : ''
                                    }`}
                            >
                                <div className="grid grid-cols-12 gap-4 items-center ">
                                    {/* Rank */}
                                    <div className="col-span-1">
                                        <div className='w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-muted text-muted-foreground'>
                                            
                                            {index + 4}
                                        </div>
                                    </div>

                                    {/* User Info */}
                                    <div className="col-span-9 flex items-center gap-3">
                                        <div className="relative">
                                            {/* <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
                                                {user.name.charAt(0)}
                                            </div> */}
                                            <UserAvatar imageUrl={user.imageUrl} name={user.name} userId={user.id} />
                                            {(loggedUserId && loggedUserId === user.id) && (
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-background flex items-center justify-center">
                                                    <div className="w-1 h-1 bg-white rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium flex items-center gap-2">
                                                {user.name}
                                                {(loggedUserId && loggedUserId === user.id) && (
                                                    <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                            {/* <div className="text-sm text-muted-foreground">{user.name}</div> */}
                                        </div>
                                    </div>



                                    {/* XP */}
                                    <div className="col-span-1 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Rocket className="w-4 h-4 text-primary" />
                                            <span className="font-bold">{user.totalXpAdded?.toLocaleString()} XP</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Stats Overview */}
            {userIndex != -1 && (
            <div className="flex items-center gap-2 flex-1 mt-8 justify-between">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800 flex-1">
                    <CardContent className="p-4 text-center">
                        <Trophy className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">#{userIndex + 1}</div>
                        <div className="text-sm text-muted-foreground">Your Rank</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800 flex-1">
                    <CardContent className="p-4 text-center">
                        <Zap className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">{rankings.at(userIndex)?.user.totalXpAdded}</div>
                        <div className="text-sm text-muted-foreground">Total XP added</div>
                    </CardContent>
                </Card>


                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-200 dark:border-orange-800 flex-1">
                    <CardContent className="p-4 text-center">
                        <Award className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-orange-600">Top {Math.max(1,100* userIndex / rankings.length).toFixed(0)} % </div>
                        <div className="text-sm text-muted-foreground">Percentile</div>
                    </CardContent>
                </Card>
            </div>
            )}

            {/* Achievement Progress */}
            {/* <Card className="mt-8">
                <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-500" />
                        Next Rank Milestone
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span>Progress to Top 5</span>
                                <span>250 XP needed</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-1000"
                                    style={{ width: '65%' }}
                                ></div>
                            </div>
                        </div>

                        <div className="flex justify-center mt-6">
                            <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-2 px-6 rounded-full transition-all hover:scale-105">
                                <Rocket className="w-4 h-4 mr-2" />
                                Boost to Rank Up
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card> */}
            <div className="flex justify-center mt-6">
                <div className="flex items-center gap-2 bg-gradient-to-t from-[#ffa100] to-[#ffca55]   text-white font-bold py-2 px-6 rounded-full transition-all">
                    <Rocket className="w-4 h-4 mr-2" />
                    Boost to Rank Up
                </div>
            </div>
        </div>
    )
}
