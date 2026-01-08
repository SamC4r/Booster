"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PollProps {
    videoId: string;
    className?: string;
    compact?: boolean;
}

export const Poll = ({ videoId, className, compact = false }: PollProps) => {
    const { data: polls, refetch } = trpc.reports.getPolls.useQuery({ videoId });
    const [dismissedPolls, setDismissedPolls] = useState<string[]>([]);
    const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

    const voteMutation = trpc.reports.vote.useMutation({
        onSuccess: () => {
            toast.success("Vote submitted");
            refetch();
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    const visiblePolls = polls?.filter(p => !dismissedPolls.includes(p.id)) || [];

    if (visiblePolls.length === 0) return null;

    const handleVote = (reportId: string, voteType: 'agree' | 'disagree') => {
        voteMutation.mutate({ reportId, voteType });
    };

    if (compact) {
        // In compact mode, maybe just show the first one or a summary? 
        // For now, let's just show the first one to avoid breaking layout
        const poll = visiblePolls[0];
        const totalVotes = poll.agreeCount + poll.disagreeCount;
        const agreePercentage = totalVotes > 0 ? (poll.agreeCount / totalVotes) * 100 : 0;
        const disagreePercentage = totalVotes > 0 ? (poll.disagreeCount / totalVotes) * 100 : 0;

        return (
            <div className={cn("bg-background/90 backdrop-blur-md p-2 rounded-lg border shadow-sm absolute top-2 right-2 z-20 max-w-[150px]", className)}>
                <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Reported: {poll.reason}</span>
                </div>
                <div className="flex gap-0.5 h-1.5 w-full rounded-full overflow-hidden bg-muted/50">
                    <div className="bg-green-500" style={{ width: `${agreePercentage}%` }} />
                    <div className="bg-red-500" style={{ width: `${disagreePercentage}%` }} />
                </div>
            </div>
        );
    }

    return (
        <div className={cn("space-y-4 mt-4", className)}>
            <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="text-red-500">Community Review</span>
            </h3>

            {visiblePolls.map((poll) => {
                const totalVotes = poll.agreeCount + poll.disagreeCount;
                const agreePercentage = totalVotes > 0 ? (poll.agreeCount / totalVotes) * 100 : 0;
                const disagreePercentage = totalVotes > 0 ? (poll.disagreeCount / totalVotes) * 100 : 0;

                return (
                    <div key={poll.id} className="bg-card p-4 rounded-xl border shadow-sm relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => setDismissedPolls(prev => [...prev, poll.id])}
                        >
                            <X className="size-4" />
                        </Button>
                        <p className="text-sm text-muted-foreground mb-4 pr-6">
                            This video was reported for <strong>{poll.reason}</strong>. Do you agree?
                            {poll.details && (
                                <Button
                                    variant="link"
                                    className="text-xs p-0 h-auto ml-2 text-primary"
                                    onClick={() => setExpandedDetails(prev => ({ ...prev, [poll.id]: !prev[poll.id] }))}
                                >
                                    {expandedDetails[poll.id] ? "Hide details" : "Show details"}
                                </Button>
                            )}
                        </p>

                        {expandedDetails[poll.id] && poll.details && (
                            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md mb-4 border border-border/50">
                                <p className="font-medium mb-1 text-foreground">The user who reported says:</p>
                                "{poll.details}"
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <Button
                                    variant={poll.userVote === 'agree' ? "default" : "outline"}
                                    className={cn("flex-1", poll.userVote === 'agree' && "bg-green-600 hover:bg-green-700")}
                                    onClick={() => handleVote(poll.id, 'agree')}
                                    disabled={voteMutation.isPending}
                                >
                                    <Check className="mr-2 size-4" />
                                    Yes, it is
                                </Button>
                                <Button
                                    variant={poll.userVote === 'disagree' ? "default" : "outline"}
                                    className={cn("flex-1", poll.userVote === 'disagree' && "bg-red-600 hover:bg-red-700")}
                                    onClick={() => handleVote(poll.id, 'disagree')}
                                    disabled={voteMutation.isPending}
                                >
                                    <X className="mr-2 size-4" />
                                    No, it&apos;s safe
                                </Button>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Agree ({agreePercentage.toFixed(0)}%)</span>
                                    <span>Disagree ({disagreePercentage.toFixed(0)}%)</span>
                                </div>
                                <div className="flex gap-1 h-2 w-full rounded-full overflow-hidden bg-muted">
                                    <div className="bg-green-500 transition-all duration-500" style={{ width: `${agreePercentage}%` }} />
                                    <div className="bg-red-500 transition-all duration-500" style={{ width: `${disagreePercentage}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
