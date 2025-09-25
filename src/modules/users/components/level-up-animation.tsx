import { Star, Zap, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";


interface LevelUpAnimationProps {
  newLevel: number;
  onComplete: () => void;
}


export const LevelUpAnimation = ({ newLevel, onComplete }: LevelUpAnimationProps) => {
  const [show, setShow] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number, x: number, y: number, delay: number }>>([]);

  useEffect(() => {
    setShow(true);

    // Generate particles for the animation
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 1000
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500); // Wait for fade out
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-3xl blur-xl opacity-50 animate-pulse"></div>

        {/* Main card */}
        <div className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-600 text-white rounded-2xl p-8 text-center shadow-2xl border-4 border-white/20">
          {/* Animated stars */}
          <div className="absolute -top-4 -left-4 animate-bounce">
            <Star className="w-8 h-8 text-yellow-200 fill-current" />
          </div>
          <div className="absolute -top-4 -right-4 animate-bounce" style={{ animationDelay: '0.3s' }}>
            <Star className="w-8 h-8 text-yellow-200 fill-current" />
          </div>
          <div className="absolute -bottom-4 -left-4 animate-bounce" style={{ animationDelay: '0.6s' }}>
            <Star className="w-8 h-8 text-yellow-200 fill-current" />
          </div>
          <div className="absolute -bottom-4 -right-4 animate-bounce" style={{ animationDelay: '0.9s' }}>
            <Star className="w-8 h-8 text-yellow-200 fill-current" />
          </div>

          {/* Icon */}
          <div className="mb-4">
            <div className="relative inline-block">
              <Zap className="w-16 h-16 text-white mb-2 animate-pulse" />
              <Sparkles className="w-8 h-8 text-yellow-200 absolute -top-2 -right-2 animate-spin" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-yellow-200">
            LEVEL UP!
          </h2>

          {/* Level display */}
          <div className="my-6">
            <div className="text-6xl font-black bg-white/20 rounded-full w-32 h-32 mx-auto flex items-center justify-center border-4 border-white/30 shadow-lg animate-scale-in">
              {newLevel}
            </div>
          </div>

          {/* Message */}
          <p className="text-lg font-semibold text-white/90 mb-4">
            Congratulations! You've reached level {newLevel}
          </p>

          <p className="text-white/80 text-sm">
            Keep boosting to unlock more rewards!
          </p>
        </div>

        {/* Particles */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}ms`,
              animationDuration: '2s'
            }}
          />
        ))}
      </div>
<style jsx global>{`
        @keyframes scale-in {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-100px) rotate(180deg); opacity: 0; }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        
        .animate-float {
          animation: float 2s ease-in forwards;
        }
        
        .animate-shine {
          animation: shine 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
