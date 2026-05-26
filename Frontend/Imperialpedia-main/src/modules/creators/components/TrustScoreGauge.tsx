'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Text } from '@/design-system/typography/text';
import { TrustLevel } from '@/types/trust';

interface TrustScoreGaugeProps {
  score: number;
  level: TrustLevel;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Visual circular gauge for representing contributor trust scores.
 */
export function TrustScoreGauge({ score, level, size = 'md' }: TrustScoreGaugeProps) {
  const getTrustColor = (s: number) => {
    if (s >= 90) return 'text-emerald-500 stroke-emerald-500';
    if (s >= 75) return 'text-primary stroke-primary';
    if (s >= 50) return 'text-amber-500 stroke-amber-500';
    return 'text-destructive stroke-destructive';
  };

  const dimensions = {
    sm: { size: 60, stroke: 4, fontSize: 'text-xs' },
    md: { size: 100, stroke: 6, fontSize: 'text-2xl' },
    lg: { size: 160, stroke: 8, fontSize: 'text-4xl' }
  };

  const { size: dim, stroke, fontSize } = dimensions[size];
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative inline-flex items-center justify-center" style={{ width: dim, height: dim }}>
        <svg className="transform -rotate-90" width={dim} height={dim}>
          <circle
            className="text-muted/20"
            strokeWidth={stroke}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={dim / 2}
            cy={dim / 2}
          />
          <circle
            className={cn("transition-all duration-1000 ease-out", getTrustColor(score))}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            style={{ strokeDashoffset: offset }}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={dim / 2}
            cy={dim / 2}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={cn("font-bold font-mono tracking-tighter", fontSize)}>
            {score}
          </span>
          <span className="text-[8px] font-bold uppercase opacity-50">Trust Score</span>
        </div>
      </div>
      <Badge variant="outline" className={cn("font-bold uppercase text-[9px] border-none", getTrustColor(score).replace('stroke-', 'bg-').replace('text-', 'text-'))}>
        {level}
      </Badge>
    </div>
  );
}

import { Badge } from '@/components/ui/badge';
