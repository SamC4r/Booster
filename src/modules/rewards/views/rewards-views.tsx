'use client'

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { trpc } from "@/trpc/client";
import { Lock, Check, Trophy } from "lucide-react";

interface RewardsViewProps {
    userId?: string;
}

export const RewardsView = ({ userId }: RewardsViewProps) => {
    return (
        <Suspense fallback={<RewardsSkeleton />}>
            <ErrorBoundary fallback={<p>Failed to load rewards.</p>}>
                <RewardsViewSuspense userId={userId} />
            </ErrorBoundary>
        </Suspense>
    )
}

const RewardsSkeleton = () => {
    return (
        <div className="overflow-hidden mb-10 px-4 pt-2.5 flex flex-col gap-y-8 animate-pulse">
            <div className="h-32 bg-muted rounded-xl" />
            <div className="h-64 bg-muted rounded-xl" />
        </div>
    );
};

// Battle Pass Level Card Component
interface LevelCardProps {
    level: number;
    reward: {
        assetId: string;
        name: string;
        description: string;
        iconNumber: number;
        requiredLevel: number | null;
    } | null;
    isUnlocked: boolean;
    isClaimed: boolean;
    currentLevel: number;
}

const LevelCard = ({ level, reward, isUnlocked, isClaimed }: LevelCardProps) => {
    const utils = trpc.useUtils();
    
    const claimReward = trpc.assets.claimReward.useMutation({
        onSuccess: () => {
            utils.assets.getAssetsByUser.invalidate();
        }
    });

    const handleClaim = () => {
        if (reward && isUnlocked && !isClaimed) {
            claimReward.mutate({ assetId: reward.assetId });
        }
    };

    return (
        <div className="relative">
            {/* Connection Line */}
            {level < 10 && (
                <div className="absolute left-1/2 top-full w-0.5 h-8 bg-gradient-to-b from-amber-500/50 to-transparent -translate-x-1/2" />
            )}
            
            <div 
                className={`relative p-6 rounded-2xl border-2 transition-all ${
                    isUnlocked 
                        ? 'border-amber-500 bg-gradient-to-br from-amber-500/10 to-orange-500/10' 
                        : 'border-border bg-card'
                } ${isClaimed ? 'opacity-75' : ''}`}
            >
                {/* Level Badge */}
                <div className={`absolute -top-3 -left-3 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    isUnlocked 
                        ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white' 
                        : 'bg-muted text-muted-foreground'
                }`}>
                    {level}
                </div>

                {/* Reward Content */}
                <div className="flex flex-col items-center gap-4 pt-2">
                    {reward ? (
                        <>
                            {/* Icon Display */}
                            <div className={`relative w-20 h-20 rounded-xl flex items-center justify-center text-4xl ${
                                isUnlocked ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20' : 'bg-muted'
                            }`}>
                                {!isUnlocked && (
                                    <div className="absolute inset-0 backdrop-blur-sm bg-black/50 rounded-xl flex items-center justify-center">
                                        <Lock className="w-8 h-8 text-white" />
                                    </div>
                                )}
                                {isClaimed && (
                                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                        <Check className="w-5 h-5 text-white" />
                                    </div>
                                )}
                                <span>🎨</span>
                            </div>

                            {/* Reward Info */}
                            <div className="text-center">
                                <h3 className="font-semibold text-lg">{reward.name}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {reward.description}
                                </p>
                            </div>

                            {/* Action Button */}
                            {isUnlocked && !isClaimed && (
                                <button
                                    onClick={handleClaim}
                                    disabled={claimReward.isPending}
                                    className="w-full px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {claimReward.isPending ? 'Claiming...' : 'Claim Reward'}
                                </button>
                            )}
                            {isClaimed && (
                                <div className="text-sm text-green-500 font-medium flex items-center gap-1">
                                    <Check className="w-4 h-4" />
                                    Claimed
                                </div>
                            )}
                            {!isUnlocked && (
                                <div className="text-sm text-muted-foreground">
                                    Reach level {level} to unlock
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <Trophy className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">No reward at this level</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const RewardsViewSuspense = ({ userId }: RewardsViewProps) => {
    // Get user's boost points to calculate level
    const [boostPoints] = trpc.xp.getBoostByUserId.useSuspenseQuery({ userId: userId! });
    const channelLevel = Math.floor(Math.sqrt(boostPoints.boostPoints * 1000) / 1000);

    // Get all rewards (filtered by level requirements)
    const [allAssets] = trpc.assets.getRewardAssets.useSuspenseQuery();
    
    // Get user's claimed assets
    const [userAssets] = trpc.assets.getAssetsByUser.useSuspenseQuery();

    const rewardLevels = [1, 2, 5, 10];
    
    const rewardsByLevel = rewardLevels.map(level => ({
        level,
        reward: allAssets.find(asset => asset.requiredLevel === level) || null,
        isUnlocked: channelLevel >= level,
        isClaimed: allAssets.some(asset => 
            asset.requiredLevel === level && 
            userAssets.some(ua => ua.assetId === asset.assetId)
        )
    }));

    return (
        <div className="overflow-hidden mb-10 px-4 pt-2.5 flex flex-col gap-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center space-y-6">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                    Community Rewards
                </h1>
               
                
                {/* Current Level Display */}
                <div className="inline-flex items-center gap-3 bg-card border border-border rounded-full px-6 py-3">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <span className="font-semibold">Current Level:</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                            {channelLevel}
                        </span>
                    </div>
                </div>
            </div>

            {/* Battle Pass Track */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
                {rewardsByLevel.map(item => (
                    <LevelCard
                        key={item.level}
                        level={item.level}
                        reward={item.reward}
                        isUnlocked={item.isUnlocked}
                        isClaimed={item.isClaimed}
                        currentLevel={channelLevel}
                    />
                ))}
            </div>
        </div>
    );
};
