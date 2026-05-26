'use client';

import React from 'react';
import { DebateTimelineEvent } from '@/types/community';
import { Text } from '@/design-system/typography/text';
import { Clock, Zap, MessageCircle, Target, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DebateTimelineProps {
  events: DebateTimelineEvent[];
}

/**
 * Visual timeline tracking the evolution of a financial debate.
 */
export function DebateTimeline({ events }: DebateTimelineProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'start': return <Zap className="h-3 w-3 text-primary" />;
      case 'argument': return <MessageCircle className="h-3 w-3 text-secondary" />;
      case 'vote': return <Target className="h-3 w-3 text-amber-500" />;
      case 'end': return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
      {events.map((ev, i) => (
        <div key={i} className="flex gap-6 items-start relative z-10 pl-1.5 animate-in slide-in-from-left-2 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="w-6 h-6 rounded-full bg-background border-2 border-white/5 flex items-center justify-center shrink-0 shadow-lg">
            {getIcon(ev.type)}
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-primary block uppercase tracking-widest">{ev.timestamp}</span>
            <Text variant="caption" className="text-muted-foreground font-medium leading-relaxed">{ev.event}</Text>
          </div>
        </div>
      ))}
    </div>
  );
}
