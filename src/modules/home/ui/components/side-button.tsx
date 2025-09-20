'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

type SideNavButtonProps = {
  dir: 'prev' | 'next';
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function SideNavButton({
  dir,
  onClick,
  disabled,
  className,
  ariaLabel,
}: SideNavButtonProps) {
  const Icon = dir === 'prev' ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      aria-label={ariaLabel ?? (dir === 'prev' ? 'Previous' : 'Next')}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        // layout & size
        'group relative inline-flex h-[72px] w-14 items-center justify-center rounded-2xl',
        // gradient border
        'p-[1px] bg-gradient-to-b from-amber-200 to-orange-300',
        // inner “glass” layer
        'before:absolute before:inset-[1px] before:rounded-2xl before:bg-white/80 before:backdrop-blur-md before:content-[""] dark:before:bg-zinc-900/70',
        // border/shadow
        'shadow-[0_10px_20px_-10px_rgba(251,146,60,0.45)]',
        // text color
        'text-amber-700 dark:text-amber-300',
        // hover/active
        'hover:shadow-[0_16px_32px_-12px_rgba(251,146,60,0.55)] active:scale-95 transition',
        // focus ring (accessible)
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-50 dark:focus-visible:ring-offset-zinc-950',
        // disabled
        disabled && 'opacity-40 pointer-events-none',
        className
      )}
    >
      {/* soft glow on hover */}
      <span className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 blur-md transition bg-amber-300/40" />
      {/* icon with directional nudge */}
      <Icon
        className={clsx(
          'relative z-10 h-7 w-7 transition-transform',
          dir === 'prev' ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'
        )}
        strokeWidth={2.25}
      />
    </button>
  );
}
