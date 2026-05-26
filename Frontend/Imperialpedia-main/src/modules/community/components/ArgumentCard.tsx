'use client';

import React from 'react';
import { DebateArgument } from '@/types/community';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageSquare, Zap, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArgumentCardProps {
  argument: DebateArgument;
  side: 'bull' | 'bear';
}

/**
 * A structured card for bull or bear arguments in a debate room.
 */
export function ArgumentCard({ argument, side }: ArgumentCardProps) {
  const isBull = side === 'bull';

  return (
    <Card className={cn(
      "border-none shadow-lg transition-all duration-300 relative group overflow-hidden",
      isBull ? "bg-emerald-500/5 hover:border-emerald-500/20" : "bg-destructive/5 hover:border-destructive/20"
    )}>
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full opacity-50",
        isBull ? "bg-emerald-500" : "bg-destructive"
      )} />
      
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 rounded-xl border border-white/10">
              <AvatarImage src={argument.avatar} />
              <AvatarFallback>{argument.user.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold group-hover:text-primary transition-colors">{argument.user}</span>
                {argument.reputation > 5000 && <ShieldCheck className="h-3.5 w-3.5 text-secondary" />}
              </div>
              <Text variant="caption" className="text-muted-foreground uppercase text-[8px] font-bold tracking-widest">{argument.role}</Text>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">
            <Zap className="h-2.5 w-2.5 text-amber-500" /> {argument.reputation}
          </div>
        </div>

        <Text variant="bodySmall" className="text-foreground/90 leading-relaxed italic border-l-2 border-white/5 pl-4 py-1">
          "{argument.content}"
        </Text>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter opacity-60">{argument.timestamp}</span>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors">
              <Heart className="h-3.5 w-3.5" /> {argument.likes}
            </button>
            <button className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors">
              <MessageSquare className="h-3.5 w-3.5" /> {argument.replies}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
