/**
 * @fileOverview Visual gauge for content quality scores.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Text } from '@/design-system/typography/text';

interface QualityScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function QualityScoreGauge({ score, size = 'md', showLabel = true }: QualityScoreGaugeProps) {
  const getQualityColor = (s: number) => {
    if (s >= 90) return 'text-emerald-500 stroke-emerald-500';
    if (s >= 70) return 'text-primary stroke-primary';
    if (s >= 50) return 'text-amber-500 stroke-amber-500';
    return 'text-destructive stroke-destructive';
  };

  const getTierLabel = (s: number) => {
    if (s >= 90) return 'Excellent';
    if (s >= 70) return 'High Quality';
    if (s >= 50) return 'Moderate';
    return 'Needs Improvement';
  };

  const dimensions = {
    sm: { size: 40, stroke: 3, fontSize: 'text-[10px]' },
    md: { size: 64, stroke: 4, fontSize: 'text-sm' },
    lg: { size: 120, stroke: 6, fontSize: 'text-3xl' }
  };

  const { size: dim, stroke, fontSize } = dimensions[size];
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
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
            className={cn("transition-all duration-1000 ease-out", getQualityColor(score))}
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
        <span className={cn("absolute font-bold font-mono tracking-tighter", fontSize, getQualityColor(score))}>
          {score}
        </span>
      </div>
      {showLabel && (
        <div className="text-center">
          <Text variant="label" className={cn("text-[8px] font-bold uppercase", getQualityColor(score))}>
            {getTierLabel(score)}
          </Text>
        </div>
      )}
    </div>
  );
}
