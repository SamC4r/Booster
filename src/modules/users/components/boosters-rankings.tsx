import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UserAvatar } from "@/components/user-avatar"
import { Crown, Award, Rocket, Trophy, Zap, Star, MedalIcon, AwardIcon, Medal } from "lucide-react"

export const BoosterRankings = () => {
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
                <div className="relative group transform hover:scale-105 transition-transform duration-300">
                    <div className="absolute -inset-1 bg-gradient-to-r from-gray-400 to-gray-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <Card className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-0 p-6 text-center">
                        <div className="relative mb-4">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center border-4 border-gray-300">
                                <span className="text-2xl font-black text-gray-600">2</span>
                            </div>
                            <AwardIcon className="w-6 h-6 text-gray-500 absolute -top-1 -right-2" />
                        </div>
                        <h3 className="font-bold text-lg mb-1">Silver Booster</h3>
                        <p className="text-muted-foreground text-sm mb-2">@silver_rank</p>
                        <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                            2,845 XP
                        </div>
                    </Card>
                </div>

                {/* 1st Place - Highlighted */}
                <div className="relative group transform hover:scale-110 transition-transform duration-300">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
                    <Card className="relative bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 border-0 p-6 text-center shadow-2xl">
                        <div className="relative mb-4">
                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-4 border-yellow-300 shadow-lg">
                                <Crown className="absolute -top-7 w-8 h-8 text-yellow-300" />
                                
                                <UserAvatar imageUrl={"/public-user.png"} name={undefined} userId={undefined} size='llg' />
                            </div>

                            <Medal className="w-6 h-6  absolute -top-1 right-8 text-yellow-300" />
                            <div className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-black">
                                #1
                            </div>
                        </div>
                        <h3 className="font-bold text-lg mb-1 text-orange-600">Gold Booster</h3>
                        <p className="text-muted-foreground text-sm mb-2">@gold_booster</p>
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                            5,247 XP
                        </div>
                    </Card>
                </div>

                {/* 3rd Place */}
                <div className="relative group transform hover:scale-105 transition-transform duration-300">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-orange-700 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <Card className="relative bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 border-0 p-6 text-center">
                        <div className="relative mb-4">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center border-4 border-amber-300">
                                <span className="text-2xl font-black text-amber-600">3</span>
                            </div>
                            <Award className="w-6 h-6 text-amber-500 absolute -top-1 -right-2" />
                        </div>
                        <h3 className="font-bold text-lg mb-1">Bronze Booster</h3>
                        <p className="text-muted-foreground text-sm mb-2">@bronze_hero</p>
                        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                            1,892 XP
                        </div>
                    </Card>
                </div>
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
                        {[
                            { id: 4, name: "Pro Gamer", username: "@pro_gamer", level: 12, xp: 1567, isCurrentUser: false },
                            { id: 5, name: "Video Creator", username: "@video_master", level: 11, xp: 1423, isCurrentUser: false },
                            { id: 6, name: "Stream Hero", username: "@stream_king", level: 11, xp: 1389, isCurrentUser: false },
                            { id: 7, name: "Your Name", username: "@yourusername", level: 10, xp: 1250, isCurrentUser: true },
                            { id: 8, name: "Community Star", username: "@community", level: 10, xp: 1187, isCurrentUser: false },
                            { id: 9, name: "Content Maker", username: "@content", level: 9, xp: 987, isCurrentUser: false },
                            { id: 10, name: "Video Fan", username: "@fan", level: 8, xp: 765, isCurrentUser: false },
                        ].map((user, index) => (
                            <div
                                key={user.id}
                                className={`p-4 hover:bg-muted/30 transition-colors group ${user.isCurrentUser ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-l-4 border-blue-500' : ''
                                    }`}
                            >
                                <div className="grid grid-cols-12 gap-4 items-center ">
                                    {/* Rank */}
                                    <div className="col-span-1">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${user.id <= 3
                                                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                                                : 'bg-muted text-muted-foreground'
                                            }`}>
                                            {user.id}
                                        </div>
                                    </div>

                                    {/* User Info */}
                                    <div className="col-span-9 flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            {user.isCurrentUser && (
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-background flex items-center justify-center">
                                                    <div className="w-1 h-1 bg-white rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium flex items-center gap-2">
                                                {user.name}
                                                {user.isCurrentUser && (
                                                    <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">{user.username}</div>
                                        </div>
                                    </div>

                                  

                                    {/* XP */}
                                    <div className="col-span-1 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Rocket className="w-4 h-4 text-primary" />
                                            <span className="font-bold">{user.xp.toLocaleString()} XP</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="flex items-center gap-2 flex-1 mt-8 justify-between">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800 flex-1">
                    <CardContent className="p-4 text-center">
                        <Trophy className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">#7</div>
                        <div className="text-sm text-muted-foreground">Your Rank</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800 flex-1">
                    <CardContent className="p-4 text-center">
                        <Zap className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">1250</div>
                        <div className="text-sm text-muted-foreground">Your XP</div>
                    </CardContent>
                </Card>


                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-200 dark:border-orange-800 flex-1">
                    <CardContent className="p-4 text-center">
                        <Award className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-orange-600">Top 15%</div>
                        <div className="text-sm text-muted-foreground">Percentile</div>
                    </CardContent>
                </Card>
            </div>

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
                <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-2 px-6 rounded-full transition-all hover:scale-105">
                    <Rocket className="w-4 h-4 mr-2" />
                    Boost to Rank Up
                </Button>
            </div>
        </div>
    )
}
