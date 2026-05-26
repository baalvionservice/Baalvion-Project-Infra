'use client';

import React from 'react';
import { DebateNode } from '@/types/community';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  Eye, 
  Users, 
  ArrowRight,
  Zap,
  Layers,
  Scale
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DebateCardProps {
  debate: DebateNode;
}

/**
 * A high-fidelity card component for the financial debate dashboard.
 */
export function DebateCard({ debate }: DebateCardProps) {
  const isCompleted = debate.status === 'Completed';

  return (
    <Card className="glass-card border-none shadow-xl hover:border-primary/30 transition-all duration-500 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
        <Scale className="h-20 w-20 text-primary" />
      </div>

      <CardHeader className="p-6 pb-2">
        <div className="flex justify-between items-start mb-4">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-bold uppercase tracking-widest px-2 h-5">
            {debate.category}
          </Badge>
          <Badge className={cn(
            "border-none text-[8px] font-bold uppercase px-2 h-5",
            debate.status === 'Active' ? "bg-emerald-500 text-white animate-pulse" : 
            debate.status === 'Upcoming' ? "bg-amber-500/10 text-amber-500" : 
            "bg-muted text-muted-foreground"
          )}>
            {debate.status}
          </Badge>
        </div>
        <Link href={`/community/debates/${debate.id}`}>
          <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors cursor-pointer">
            {debate.topic}
          </CardTitle>
        </Link>
      </CardHeader>

      <CardContent className="p-6 pt-2 space-y-6">
        <Text variant="caption" className="text-muted-foreground line-clamp-2 leading-relaxed">
          {debate.summary || "A balanced audit of the current market trajectory."}
        </Text>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center text-center">
            <TrendingUp className="h-4 w-4 text-emerald-500 mb-1" />
            <span className="text-sm font-bold">{debate.bull_participants}</span>
            <Text variant="label" className="text-[7px] opacity-50 font-bold uppercase">Bulls</Text>
          </div>
          <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/10 flex flex-col items-center text-center">
            <TrendingDown className="h-4 w-4 text-destructive mb-1" />
            <span className="text-sm font-bold">{debate.bear_participants}</span>
            <Text variant="label" className="text-[7px] opacity-50 font-bold uppercase">Bears</Text>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 border-t border-white/5 mt-auto bg-muted/10">
        <div className="flex items-center justify-between w-full pt-4">
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold font-mono">{(debate.views / 1000).toFixed(1)}k</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold font-mono">{debate.comments}</span>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" className="h-8 px-2 text-primary font-bold text-xs group/btn" asChild>
            <Link href={`/community/debates/${debate.id}`}>
              Join Debate <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
