'use client';

import { useEffect, useState } from 'react';
import { trpc } from '@/trpc/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Coins, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@clerk/nextjs';

export const WelcomeBonusModal = () => {
    const { isSignedIn } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const utils = trpc.useUtils();

    const { data: status, isLoading } = trpc.xp.getWelcomeBonusStatus.useQuery(undefined, {
        enabled: !!isSignedIn,
        refetchOnWindowFocus: false,
    });

    const { mutate: claimBonus, isPending } = trpc.xp.claimWelcomeBonus.useMutation({
        onSuccess: (data) => {
            setIsOpen(false);
            toast.success(`You claimed ${data.amount} XP!`);
            utils.xp.getXpByUserId.invalidate();
            utils.xp.getWelcomeBonusStatus.invalidate();
            
            // Fire confetti
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => {
                return Math.random() * (max - min) + min;
            }

            const interval: any = setInterval(function() {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({
                    ...defaults, 
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                });
                confetti({
                    ...defaults, 
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                });
            }, 250);
        },
        onError: (error) => {
            toast.error(error.message || "Failed to claim bonus");
        }
    });

    useEffect(() => {
        if (status?.canClaim) {
            // Small delay to not overwhelm user immediately on load
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [status?.canClaim]);

    if (!status?.canClaim) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md border-amber-500/20">
                <DialogHeader>
                    <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                        <span className="text-2xl font-black text-amber-500">XP</span>
                    </div>
                    <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                        Welcome Bonus Available!
                    </DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        You are eligible for a special early adopter bonus.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="text-center space-y-1">
                        <div className="text-4xl font-black text-amber-500 flex items-center justify-center gap-2">
                            {status.amount} XP
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Only {status.remaining} spots left for this reward!
                        </p>
                    </div>

                    {status.type === 'welcome_2000' && (
                        <div className="w-full bg-muted/50 rounded-lg p-3 text-xs text-center text-muted-foreground border border-border/50">
                            Next tier: 500 XP for the next 1000 users
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-center">
                    <Button 
                        size="lg" 
                        className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-amber-500/20"
                        onClick={() => claimBonus()}
                        disabled={isPending}
                    >
                        {isPending ? "Claiming..." : "Claim Reward"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
