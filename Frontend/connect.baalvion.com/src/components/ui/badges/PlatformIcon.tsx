'use client';

import React from 'react';
import { 
  Instagram, 
  Youtube, 
  Music2, 
  Twitter, 
  Linkedin, 
  Globe,
  Twitch
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatformIconProps {
  platform: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'color' | 'mono';
}

export function PlatformIcon({ platform, size = 'md', className, variant = 'color' }: PlatformIconProps) {
  const p = platform.toLowerCase();
  
  const sizeMap = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6'
  };

  const getIcon = () => {
    if (p.includes('instagram')) return { icon: Instagram, color: 'text-pink-600' };
    if (p.includes('youtube')) return { icon: Youtube, color: 'text-red-600' };
    if (p.includes('tiktok')) return { icon: Music2, color: 'text-slate-900' };
    if (p.includes('twitter') || p.includes(' x')) return { icon: Twitter, color: 'text-blue-400' };
    if (p.includes('linkedin')) return { icon: Linkedin, color: 'text-blue-700' };
    if (p.includes('twitch')) return { icon: Twitch, color: 'text-purple-600' };
    return { icon: Globe, color: 'text-slate-400' };
  };

  const { icon: Icon, color } = getIcon();

  return (
    <Icon 
      className={cn(
        sizeMap[size],
        variant === 'color' ? color : 'text-current',
        className
      )} 
    />
  );
}
