'use client';

import React from 'react';
import { CredibilityMilestone } from '@/types/trust';
import { Text } from '@/design-system/typography/text';
import { 
  CheckCircle2, 
  Zap, 
  Trophy, 
  UserPlus, 
  BookOpen, 
  Clock,
  ShieldCheck,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CredibilityTimelineProps {
  milestones: CredibilityMilestone[];
}

/**
 * Visual chronological timeline for contributor credibility milestones.
 */
export function CredibilityTimeline({ milestones }: CredibilityTimelineProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'joined': return <UserPlus className="h-3 w-3 text-muted-foreground" />;
      case 'published': return <BookOpen className="h-3 w-3 text-primary" />;
      case 'verified': return <ShieldCheck className="h-3 w-3 text-secondary" />;
      case 'award': return <Trophy className="h-3 w-3 text-amber-500" />;
      case 'milestone': return <Star className="h-3 w-3 text-emerald-500" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-8 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
      {milestones.map((ms, i) => (
        <div key={i} className="flex gap-6 items-start relative z-10 animate-in slide-in-from-left-2 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="w-7 h-7 rounded-full bg-background border-2 border-white/5 flex items-center justify-center shrink-0 shadow-lg group hover:border-primary/30 transition-colors">
            {getIcon(ms.type)}
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-primary block uppercase tracking-widest">{ms.date}</span>
            <Text variant="bodySmall" weight="bold" className="text-foreground/90">{ms.event}</Text>
          </div>
        </div>
      ))}
    </div>
  );
}
