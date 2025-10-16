'use client';

import { Boxes, CircleDollarSignIcon, Copyright, Headset, Megaphone, UsersRound } from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';

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
            <div className="h-5 bg-gray-700 rounded-full overflow-hidden mt-2">
                <div
                    className="h-full bg-gradient-to-r from-[#ffca55] to-[#ffa100] rounded-full"
                    style={{ width: '65%' }}
                />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-400">
                <span>Level 7</span>
                <span>65% to next level</span>
            </div>
        </div>
    );

    const StepNumber = ({ number }: { number: number }) => (
        <span className="inline-block bg-gradient-to-br from-[#ffca55] to-[#ffa100] text-[#212121] w-7 h-7 rounded-full text-center leading-7 font-bold mr-2">
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
        <div className={`card bg-gray-800 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ease-in-out flex flex-col h-full border border-gray-700 hover:-translate-y-2.5 hover:shadow-xl ${wide ? 'w-full max-w-4xl' : ''
            }`}>
            <div className="h-30 flex items-center justify-center bg-gradient-to-br from-[#ffca55] to-[#ffa100] text-[#212121] text-5.5xl p-2">
                {icon}
            </div>
            <div className="p-8 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold mb-4 text-[#ffca55]">
                    <StepNumber number={step} />
                    {title}
                </h3>
                <p className="text-gray-300 mb-6 flex-grow">{description}</p>
                {children}
                <a
                    href="#"
                    className="inline-block bg-gradient-to-br from-[#ffca55] to-[#ffa100] text-[#212121] px-6 py-3 rounded-full font-semibold mt-4 transition-all duration-300 ease-in-out shadow-lg shadow-amber-500/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/40"
                >
                    {buttonText}
                </a>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-gray-100 py-8 px-4">
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
                </div>

                <footer className="flex text-center gap-2 justify-center items-center mt-16 py-8 border-t border-gray-700">
                    <Copyright className='size-4' />
                    <p className="text-gray-400"> 2025 Booster. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};
