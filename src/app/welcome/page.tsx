import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { DiveInButton } from "./dive-in-button";
import { Play, Upload, Zap, Users, TrendingUp, Shield, Boxes, Sparkles } from "lucide-react";
import Image from "next/image";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar / Header */}
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
            <Image src="/BoosterLongLogo.tmp.png" alt="Booster Logo" width={150} height={40} className="h-10 w-auto object-contain" />
        </div>
        <div className="flex gap-4">
            <SignInButton mode="modal">
                <Button variant="ghost" className="font-semibold">Sign in</Button>
            </SignInButton>
            <SignUpButton mode="modal">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Sign up</Button>
            </SignUpButton>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full py-20 px-6 flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Boost Your Creativity
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
                The next-generation video platform where creators thrive and viewers decide what's next.
            </p>
            <div className="pt-8 flex flex-col items-center">
                <DiveInButton />
                <p className="mt-4 text-sm text-muted-foreground">No account required to explore</p>
            </div>
        </section>

        {/* How it works */}
        <section className="w-full py-20 bg-muted/30">
            <div className="max-w-[1600px] mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">How Booster Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FeatureCard 
                        icon={<Upload className="w-10 h-10 text-primary" />}
                        title="Upload & Share"
                        description="Share your videos with a community that values quality and originality."
                    />
                    <FeatureCard 
                        icon={<Boxes className="w-10 h-10 text-secondary" />}
                        title="Boost Content"
                        description="Use XP to boost the videos you love and help them reach more viewers."
                    />
                    <FeatureCard 
                        icon={<Users className="w-10 h-10 text-blue-500" />}
                        title="Join the Community"
                        description="Engage with creators, build your network, and grow together."
                    />
                    <FeatureCard 
                        icon={<Sparkles className="w-10 h-10 text-purple-500" />}
                        title="Search with AI"
                        description="Change your algorithm and discover recommended videos tailored by AI."
                    />
                </div>
            </div>
        </section>

        {/* What you can do */}
        <section className="w-full py-20 px-6">
             <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">What You Can Do</h2>
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <BenefitItem icon={<Play />} text="Earn XP by watching advertisements" />
                    <BenefitItem icon={<TrendingUp />} text="Discover rising stars before they go viral" />
                    <BenefitItem icon={<Shield />} text="Enjoy a free and moderated environment" />
                    <BenefitItem icon={<Zap />} text="Earn rewards for being an active member" />
                </div>
             </div>
        </section>
        
        {/* CTA Footer */}
        <section className="w-full py-20 bg-gradient-to-b from-background to-muted/50 text-center px-6">
            <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <SignUpButton mode="modal">
                    <Button size="lg" className="text-lg px-8">Create an Account</Button>
                </SignUpButton>
                <span className="text-muted-foreground">or</span>
                <DiveInButton />
            </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} Booster. All rights reserved.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="bg-card p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow flex flex-col items-center text-center">
            <div className="mb-6 p-4 bg-background rounded-full shadow-sm border">{icon}</div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    )
}

function BenefitItem({ icon, text }: { icon: React.ReactNode, text: string }) {
    return (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
            <div className="text-primary">{icon}</div>
            <span className="font-medium">{text}</span>
        </div>
    )
}
