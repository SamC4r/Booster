import { Sparkles, Star, RocketIcon } from "lucide-react";
import { useState } from "react";

interface LevelUpBadgeProps {
  newLevel: number;
  onComplete?: () => void;
}

export const LevelUpBadge = ({ newLevel, onComplete }: LevelUpBadgeProps) => {
  const [show, setShow] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

 

  if (!show) return null;

  return (
    <div className={`relative transform transition-all duration-500 ${
      isExiting ? 'scale-0 opacity-0 -translate-y-4' : 'scale-100 opacity-100 translate-y-0'
    }`}>
      {/* Floating particles */}
      <div className="absolute -top-2 -left-2 animate-float-slow">
        <Sparkles className="w-4 h-4 text-yellow-400" />
      </div>
      <div className="absolute -top-1 -right-2 animate-float-medium">
        <Star className="w-3 h-3 text-orange-400 fill-current" />
      </div>
      <div className="absolute -bottom-2 -left-1 animate-float-fast">
        <div className="w-2 h-2 bg-purple-400 rounded-full" />
      </div>

      {/* Main badge */}
      <div className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-orange-500 text-white p-4 rounded-2xl shadow-2xl border-2 border-white/30 backdrop-blur-sm">
        {/* Animated border glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-500 opacity-75 blur-sm -z-10 animate-pulse-slow"></div>
        
        {/* Inner glow */}
        <div className="absolute inset-2 rounded-xl bg-gradient-to-r from-white/20 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3">
          {/* Icon section */}
          <div className="relative">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/40">
              <RocketIcon className="w-6 h-6 text-white" />
            </div>
            <Sparkles className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1 animate-spin-slow" />
          </div>

          {/* Text section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm uppercase tracking-wider bg-white/20 px-2 py-1 rounded-full">
                Level Up!
              </span>
              <div className="w-1 h-1 bg-white/60 rounded-full"></div>
              <span className="text-xs opacity-90">Recently</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black leading-none">
                Reached Level {newLevel}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs opacity-80">New rewards unlocked!</span>
            </div>
          </div>

          {/* Level number */}
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-white/30 to-white/10 rounded-full flex items-center justify-center border-2 border-white/40 shadow-lg">
              <span className="text-2xl font-black drop-shadow-md">{newLevel}</span>
            </div>
            {/* Floating crown */}
            {/* <Crown className="w-5 h-5 text-yellow-300 absolute -top-2 -right-2 animate-bounce" /> */}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 bg-white/20 rounded-full h-1 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-white to-yellow-200 rounded-full transition-all duration-1000 ease-out"
            style={{ width: '100%' }}
          />
        </div>

        {/* Close button */}
     
      </div>
    </div>
  );
};