import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

const DEFAULT_SIZE = 32;

export const Logo = ({ className, size = DEFAULT_SIZE, showText = true }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Crown - Neon Green */}
        <path 
          d="M4 10L10 16L16 4L22 16L28 10V22H4V10Z" 
          fill="#39FF14" 
          className="drop-shadow-[0_0_8px_rgba(57,255,20,0.4)]"
        />
        {/* Industrial Chains */}
        <path 
          d="M6 22V28H10V22M22 22V28H26V22" 
          stroke="#A0A0A0" 
          strokeWidth="2" 
          strokeLinecap="square"
        />
        <rect x="5" y="27" width="6" height="3" fill="#A0A0A0" />
        <rect x="21" y="27" width="6" height="3" fill="#A0A0A0" />
      </svg>
      
      {showText && (
        <div className="flex items-center text-[15px] tracking-tight leading-none">
          <span className="text-white font-normal">Market</span>
          <span className="text-brand-green font-bold ml-1">Underworld</span>
        </div>
      )}
    </div>
  );
};
