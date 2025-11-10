'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Coins } from 'lucide-react';

export const dynamic = 'force-dynamic';

const Page = () => {
    const router = useRouter();

    useEffect(() => {
        // Redirect to home after 3 seconds
        const timer = setTimeout(() => {
            router.push('/');
        }, 3000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#121212] to-[#1a1a1a] text-white flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center max-w-md"
            >
                {/* Animated Icon */}
                <motion.div
                    animate={{
                        rotate: 360,
                        scale: [1, 1.2, 1]
                    }}
                    transition={{
                        rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center"
                >
                    <Coins className="h-10 w-10 text-gray-900" />
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-4"
                >
                    Rewards Moved!
                </motion.h1>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-gray-300 mb-6 leading-relaxed"
                >
                    Reward videos are now integrated into your home feed! Look for videos with the{' '}
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 px-2 py-1 rounded-full text-xs font-semibold">
                        <Coins className="h-3 w-3" />
                        +20 XP
                    </span>{' '}
                    badge and watch them to the end to earn rewards.
                </motion.p>

                {/* Redirect Button */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 mx-auto bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-semibold px-6 py-3 rounded-full hover:opacity-90 hover:scale-105 transition-all duration-200 shadow-lg shadow-amber-500/30"
                >
                    <Home className="h-5 w-5" />
                    Go to Home Feed
                </motion.button>

                {/* Auto redirect notice */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.6 }}
                    className="text-gray-500 text-sm mt-4"
                >
                    Automatically redirecting in 3 seconds...
                </motion.p>
            </motion.div>
        </div>
    );
};

export default Page;
