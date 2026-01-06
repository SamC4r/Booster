'use client';

import { Boxes, CircleDollarSignIcon, Code, Copyright, CpuIcon, Github, Headset, Megaphone, Sparkles, UsersRound } from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';

import 'katex/dist/katex.min.css';
import { BlockMath } from "react-katex";
import { motion } from 'framer-motion';


export const About = () => {
    useEffect(() => {
        // Add subtle animation to cards when they come into view
        const cards = document.querySelectorAll('.card');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                    entry.target.classList.remove('opacity-0', 'translate-y-5');
                }
            });
        }, { threshold: 0.1 });

        cards.forEach(card => {
            card.classList.add('opacity-0', 'translate-y-5', 'transition-all', 'duration-500', 'ease-out');
            observer.observe(card);
        });

        return () => {
            cards.forEach(card => observer.unobserve(card));
        };
    }, []);

    const XpBar = () => (
        <div className="mt-4">
            <div className="h-5 bg-muted rounded-full overflow-hidden mt-2">
                <div
                    className="h-full bg-gradient-to-r from-[#ffca55] to-[#ffa100] rounded-full"
                    style={{ width: '65%' }}
                />
            </div>
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>Level 7</span>
                <span>65% to next level</span>
            </div>
        </div>
    );

    const StepNumber = ({ number }: { number: number }) => (
        <span className="inline-block bg-gradient-to-br from-[#ffca55] to-[#ffa100] text-gray-900 w-7 h-7 rounded-full text-center leading-7 font-bold mr-2">
            {number}
        </span>
    );

    const Card = ({
        children,
        icon,
        step,
        title,
        description,
        buttonText,
        wide = false
    }: {
        children?: React.ReactNode;
        icon: React.ReactNode;
        step: number;
        title: string;
        description: string;
        buttonText: string;
        wide?: boolean;
    }) => (
        <div className={`card bg-card rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ease-in-out flex flex-col h-full border border-border hover:-translate-y-2.5 hover:shadow-xl ${wide ? 'w-full max-w-4xl' : ''
            }`}>
            <div className="h-30 flex items-center justify-center bg-gradient-to-br from-[#ffca55] to-[#ffa100] text-gray-900 text-5.5xl p-2">
                {icon}
            </div>
            <div className="p-8 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold mb-4 text-[#ffca55]">
                    <StepNumber number={step} />
                    {title}
                </h3>
                <p className="text-muted-foreground mb-6 flex-grow">{description}</p>
                {children}
                <a
                    href="#"
                    className="inline-block bg-gradient-to-br from-[#ffca55] to-[#ffa100] text-gray-900 px-6 py-3 rounded-full font-semibold mt-4 transition-all duration-300 ease-in-out shadow-lg shadow-amber-500/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/40"
                >
                    {buttonText}
                </a>
            </div>
        </div>
    );

    const formula = String.raw`

\begin{aligned}
score(x) &= \ln\Bigg(
  \Big(\frac{\sqrt{1000 \cdot x.creator.boostPoints}}{1000} + 1\Big)^{2}
  + x.views \\
&\quad + \tanh(x.averageRating - 3.5) \cdot \ln(\max(x.ratings, 1)) \\
&\quad + \ln(\max(x.ratings, 1))
  + \ln(\max(x.comments, 1))
  + \frac{\sqrt{1000 \cdot x.creator.boostPoints}}{1000}
\Bigg) \\
&\quad + \frac{100}{\ln(\text{hoursSinceUpload}(x.createdAt) + 2)} \\
&\quad - 100 \cdot \mathbb{I}(x.watched) \\
&\quad + 50 \cdot \mathbb{I}(\text{following} \  x.creator) \\
&\quad + 20 \cdot \ln(\textstyle \sum (categoryViews \  \text{    where view }\  = x.category) + 1) \\
&\quad \Big(  + 50 \cdot \mathbb{I}(\text{sameCategory as current video being watched}) \Big) \rightarrow \text{Only in the /videos page, not in explorer}
\end{aligned}

`.trim();




    return (
        <div className="min-h-screen bg-background text-foreground py-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex items-center justify-center mb-12 py-8">
                    <h1 className="flex items-center gap-5 text-5xl font-bold bg-gradient-to-r from-[#ffca55] to-[#ffa100] bg-clip-text text-transparent mb-4">
                        How
                        <Image src={'/BoosterLongLogo.webp'} alt={'Booster'} width={256} height={128}          >

                        </Image>
                        Works
                    </h1>
                </header>

                <div className="flex flex-col gap-8 mt-8">
                    {/* Top Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card
                            icon={<Megaphone className='size-10' />}
                            step={1}
                            title="Limited Advertisement"

                            description=" 
                            
                            We know that too many ads can be tiring and frustrating, which can make the experience less enjoyable. 
                            That's why at Booster, we use a limited-ads system that lets you decide: watch ads to earn rewards, 
                            or disable them if you prefer.
                        
                        "

                            buttonText="Activate Rewarded Voluntary Ads"
                        />

                        <Card
                            icon={<Boxes className='size-10' />}
                            step={2}
                            title="XP System"

                            description=" 
                            
                            XP is our platform's coin. You can use it to unlock rewards, personalize your experience, and support 
                            the communities you follow. XP can be obtained through interactions within the platform, or either 
                            through optional purchases.
                            
                        "

                            buttonText="Explore Modules"
                        />
                    </div>

                    {/* Middle Row */}
                    <div className="flex justify-center">
                        <Card
                            wide={true}
                            icon={<UsersRound className='size-10' />}
                            step={3}
                            title="Communities Boosters"

                            description=" 
                            This is the Booster Bar. You can fill it with Booster Points earned through your XP to level it up.
                            When you give XP to a community, you become a Supporter. As the community's level increases, its
                            videos gain more visibility and are recommended more widely across the platform.
                        
                        "

                            buttonText="Boost Your Community"
                        >
                            <XpBar />
                        </Card>
                    </div>

                    {/* Bottom Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card
                            icon={<CircleDollarSignIcon className='size-10' />}
                            step={4}
                            title="How to Earn?"
                            description="
                           Booster offers a fair and unbiased way to monetize your videos. Any channel can qualify for monetization 
                           by meeting a few straightforward requirements in their videos, after which it can start earning ad revenue.
                           
                        "
                            buttonText="Start Earning"
                        />

                        <Card
                            icon={<Headset className='size-10' />}
                            step={5}
                            title="Got any Question?"
                            description="
                           If you have any questions, please don't hesitate to contact our support team. We'll be happy to answer 
                           your questions and hear any feedback you'd like to share: booster@boostervideos.net

                        "
                            buttonText="Get Support"
                        />
                    </div>

                    {/*Algorithm explanation*/}
                    <span id='recommendation_algorithm'></span>

                    <div className='border-t border-gradient-to-r from-transparent via-primary/20 to-transparent pt-12 pb-8 px-4 md:px-6 relative overflow-hidden' >

                        {/* Animated background elements */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary/5 rounded-full blur-3xl"></div>

                        {/* Title Section */}
                        <div className='flex flex-col md:flex-row items-start md:items-center gap-4 mb-10 relative z-10'>
                            <div className='flex items-center gap-3'>
                                <div className="w-2 h-10 bg-gradient-to-b from-primary to-secondary rounded-full"></div>
                                <p className='text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 via-gray-900 to-black dark:from-gray-100 dark:via-gray-200 dark:to-white bg-clip-text text-transparent'>
                                    The Recommendation
                                </p>
                            </div>

                            <div className="relative group">
                                <span className="absolute -inset-2 bg-gradient-to-r from-primary to-secondary rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-all duration-300 "></span>
                                <span className="relative bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text font-bold text-5xl md:text-6xl select-none tracking-tight">
                                    Algorithm
                                </span>
                                <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                            </div>

                            {/* Algorithm Icon */}
                            <div className="absolute right-0 -top-2 opacity-10 md:opacity-20">
                                <CpuIcon className='size-20' />
                            </div>
                        </div>

                        {/* Explanation Section */}
                        <div className="relative z-10">
                            <div className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl shadow-primary/5">

                                <div className="flex items-start gap-4 mb-6">
                                    <div className="hidden md:block mt-1">
                                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className='relative'>
                                        <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                            How Videos Get Recommended
                                        </h3>
                                        <h2 className='text-xl absolute top-0 right-0 font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'>(version v.0-beta)</h2>
                                        <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-6">
                                            Booster implements a video recommendation algorithm that mathematically evaluates multiple factors to get the best content. Here are the key metrics that influence video scores:
                                        </p>
                                    </div>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                    {[
                                        { title: 'Channel Boost Level', desc: 'Primary influence on video scoring' },
                                        { title: 'Channel Followers', desc: 'Audience size and engagement' },
                                        { title: 'Video Views', desc: 'Popularity and reach metric' },
                                        { title: 'Average Rating', desc: 'Community quality assessment' },
                                        { title: 'Comments', desc: 'Engagement and discussion level' },
                                    ].map((metric, index) => (
                                        <div key={index} className="group p-4 rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 hover:border-primary/30 transition-all duration-300 ">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-bold text-gray-900 dark:text-white">{metric.title}</h4>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{metric.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Formula Section */}
                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-6 h-0.5 bg-gradient-to-r from-primary to-secondary"></div>
                                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">The Scoring Formula</h4>
                                        <div className="w-6 h-0.5 bg-gradient-to-r from-primary to-secondary"></div>
                                    </div>

                                    <div className="bg-gradient-to-r from-gray-900/5 to-gray-900/10 dark:from-white/5 dark:to-white/10 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                                        <div className="text-xl md:text-2xl font-mono text-center p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <BlockMath math={formula} />

                                        </div>
                                    </div>
                                </div>

                                {/* Call to Action */}
                                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-l-4 border-primary rounded-r-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="hidden md:block">
                                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                                Boost Your Favorites!
                                            </h4>
                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                                Videos are sorted by descending score. As a creator or viewer, you can influence rankings by:
                                                <ul className="list-disc pl-5 mt-3 space-y-2">
                                                    <li className="text-gray-700 dark:text-gray-300">Boosting channels with XP to increase their level</li>
                                                    <li className="text-gray-700 dark:text-gray-300">Commenting on videos you enjoy</li>
                                                    <li className="text-gray-700 dark:text-gray-300">Rating videos to provide quality feedback</li>
                                                    <li className="text-gray-700 dark:text-gray-300">Following channels you want to support</li>
                                                </ul>

                                            </p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>

                {/* Community Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative mb-12"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ffca55]/5 via-transparent to-[#ffa100]/5 rounded-3xl" />

                    <div className="relative p-8 rounded-3xl bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm ">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex-1">
                                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#ffca55] to-[#ffa100] bg-clip-text text-transparent">
                                    Join Our Open Source Community
                                </h3>
                                <p className="text-muted-foreground mb-6">
                                    We're building the future of video sharing together. Contribute to our GitHub repository or join our Discord community to help shape Booster.
                                </p>
                                <div className="flex items-center gap-4">
                                    <motion.a
                                        whileTap={{ scale: 0.75 }}
                                        href="https://github.com/SamC4r/Booster"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 px-6 py-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-300 cursor-pointer"
                                    >
                                        <Github className="size-5" />
                                        <span className="font-semibold">Star on GitHub</span>
                                    </motion.a>

                                    <motion.a
                                        whileTap={{ scale: 0.75 }}
                                        href="https://discord.com/invite/5KaSRdxFXw"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 px-6 py-3 rounded-full bg-[#5865F2]/50 hover:bg-[#5865F2]/70 text-white transition-all duration-300 cursor-pointer"
                                    >
                                        <svg className="size-5" fill="currentColor" viewBox="0 0 127.14 96.36">
                                            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                                        </svg>
                                        <span className="font-semibold">Join Discord</span>
                                    </motion.a>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#ffca55] to-[#ffa100] blur-2xl opacity-20 rounded-full" />
                                <Code className="size-24 text-[#ffca55] relative z-10" />
                            </div>
                        </div>
                    </div>
                </motion.div>
                <footer className="flex text-center gap-2 justify-center items-center mt-16 py-8 border-t border-gray-700">
                    <Copyright className='size-4' />
                    <p className="text-gray-400"> {new Date().getFullYear()} Booster. Samuel Caraballo Chichiraldi & Maximo Caraballo Chichiraldi.</p>
                </footer>
            </div>
        </div >
    );
};
