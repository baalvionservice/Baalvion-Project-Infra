'use client';

import React from 'react';
import { EditMilestone } from '@/types/version-control';
import { Text } from '@/design-system/typography/text';
import { 
  CheckCircle2, 
  Zap, 
  History, 
  FileEdit, 
  User, 
  Clock,
  ShieldCheck,
  Send,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditTimelineProps {
  milestones: EditMilestone[];
}

/**
 * Visual timeline tracking the evolution of an intelligence node.
 */
export function EditTimeline({ milestones }: EditTimelineProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'creation': return <Plus className="h-3 w-3 text-primary" />;
      case 'edit': return <FileEdit className="h-3 w-3 text-secondary" />;
      case 'review': return <ShieldCheck className="h-3 w-3 text-amber-500" />;
      case 'publication': return <Send className="h-3 w-3 text-emerald-500" />;
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
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">{ms.date}</span>
              <div className="flex items-center gap-1.5 opacity-50">
                <User className="h-2.5 w-2.5" />
                <span className="text-[9px] font-bold uppercase">{ms.editor}</span>
              </div>
            </div>
            <Text variant="bodySmall" weight="bold" className="text-foreground/90">{ms.event}</Text>
            <Text variant="caption" className="text-muted-foreground italic line-clamp-2">"{ms.summary}"</Text>
          </div>
        </div>
      ))}
    </div>
  );
}
