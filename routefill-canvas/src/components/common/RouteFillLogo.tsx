import React from 'react';

interface RouteFillLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showBadge?: boolean;
  className?: string;
  badgeText?: string;
}

export const RouteFillLogo: React.FC<RouteFillLogoProps> = ({
  size = 'md',
  showText = true,
  showBadge = true,
  className = '',
  badgeText = 'AI',
}) => {
  const iconDimensions = {
    xs: 'h-6 w-6',
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
    xl: 'h-14 w-14',
  }[size];

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  }[size];

  const badgeSizes = {
    xs: 'text-[8px] px-1 py-0.2',
    sm: 'text-[9px] px-1.5 py-0.5',
    md: 'text-[10px] px-1.5 py-0.5',
    lg: 'text-xs px-2 py-0.5',
    xl: 'text-xs px-2.5 py-1',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Dynamic Animated Vector Logo Mark */}
      <div className={`relative shrink-0 ${iconDimensions} group`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_12px_rgba(16,185,129,0.35)] transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="rf-logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="rf-loop-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <linearGradient id="rf-accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="rf-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Rounded Squircle Container */}
          <rect
            width="48"
            height="48"
            rx="13"
            fill="url(#rf-logo-bg)"
            stroke="#1e293b"
            strokeWidth="1.5"
          />

          {/* Connected Continuous Loop representing Zero Dead-Mileage Return-Trips */}
          <path
            d="M13 29 C10 21, 18 13, 26 13 C35 13, 38 19, 37 24 C36 30, 28 34, 21 34 C15 34, 12 30, 15 26"
            stroke="url(#rf-loop-grad)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#rf-glow)"
          />

          {/* Precision Forward Vector Arrow */}
          <path
            d="M34 20 L38 25 L32 26.5"
            stroke="#34d399"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Central AI Engine Micro-Chip Core */}
          <rect
            x="19"
            y="20"
            width="10"
            height="8"
            rx="2.5"
            fill="#090d16"
            stroke="url(#rf-accent-grad)"
            strokeWidth="1.4"
          />
          <circle cx="24" cy="24" r="1.5" fill="#10b981" filter="url(#rf-glow)" />

          {/* Active Network AI Node Signals */}
          <circle cx="36" cy="13" r="2" fill="#38bdf8" filter="url(#rf-glow)" />
          <circle cx="13" cy="33" r="1.5" fill="#34d399" />
        </svg>

        {/* Subtle Live Glow Ping */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </div>

      {/* Typography Brand Name */}
      {showText && (
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`font-display font-bold tracking-tight text-foreground ${textSizes}`}>
            Route<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Fill</span>
          </span>

          {showBadge && (
            <span
              className={`rounded-md bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold uppercase tracking-wider ${badgeSizes}`}
            >
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
