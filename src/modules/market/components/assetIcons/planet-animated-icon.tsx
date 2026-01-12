import { PlanetIcon } from "@phosphor-icons/react"
import { useState } from "react"
import { SparkleEffect } from "../background/sparkles"

interface Props{
  size: number;
  className?: string;
  showFounderBadge?: boolean;
}

export const AnimatedPlanetIcon = ({ className, size }: Props) => {
  const [isHovered, setIsHovered] = useState(false)

  const sizes = new Map<number,string>([
    [4, '!size-4'],
    [5, '!size-5'],
    [6, '!size-6'],
    [7, '!size-7'],
    [8, '!size-8'],
    [10, '!size-10'],
    [12, '!size-12'],
    [16,'!size-16']
  ])

  return (

    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Orbital Rings */}
      <div className={`absolute inset-0 rounded-full border border-amber-400/20 ${
        isHovered ? 'animate-spin-slow' : 'animate-pulse-slow'
      }`} style={{ 
        transform: 'scale(1.1)',
        animationDuration: '8s'
      }} />
      
      <div className={`absolute inset-0 rounded-full border border-orange-400/30 ${
        isHovered ? 'animate-spin-slow-reverse' : 'animate-pulse-slower'
      }`} style={{ 
        transform: 'scale(1.2)',
        animationDuration: '12s'
      }} />

      {/* Main Icon */}
      <PlanetIcon 
        className={`${sizes.get(size)} text-amber-200 bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 bg-clip-text transition-all duration-500 ${
          isHovered ? 'scale-110 rotate-12' : 'scale-100 rotate-0'
        } ${className}`}
        style={{
          filter: `drop-shadow(0 0 20px rgba(251, 191, 36, 0.8)) 
                   drop-shadow(0 0 40px rgba(251, 146, 60, 0.6))
                   drop-shadow(0 0 60px rgba(239, 68, 68, 0.4))`,
        }}
      />



      {/* Hover Sparkle Burst */}
      {isHovered && (
        <>
          <div className="absolute -inset-4 bg-gradient-to-r from-amber-400/20 to-red-500/20 rounded-full blur-xl animate-ping-once" />
          <SparkleEffect className="top-2 left-2 animate-bounce" />
          <SparkleEffect className="top-2 right-2 animate-bounce" style={{ animationDelay: '0.2s' }} />
          <SparkleEffect className="bottom-2 left-2 animate-bounce" style={{ animationDelay: '0.4s' }} />
          <SparkleEffect className="bottom-2 right-2 animate-bounce" style={{ animationDelay: '0.6s' }} />
        </>
      )}

      {/* Constant subtle sparkles */}
      <SparkleEffect className={`top-1/4 left-1/4 animate-pulse`} style={{ animationDelay: '1s' }}  />
      <SparkleEffect className={`top-3/4 right-1/4 animate-pulse}`} style={{ animationDelay: '2s' }} />
    </div>
  )
}