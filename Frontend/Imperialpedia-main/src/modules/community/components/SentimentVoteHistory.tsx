'use client';

import React from 'react';
import { UserSentimentVote } from '@/types/community';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ChevronRight,
  ArrowRight,
  Zap,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SentimentVoteHistoryProps {
  history: UserSentimentVote[];
}

/**
 * User Sentiment Ledger.
 * Displays historical votes cross-referenced with aggregate community stance.
 */
export function SentimentVoteHistory({ history }: SentimentVoteHistoryProps) {
  return (
    <Card className="glass-card border-none shadow-xl bg-card/30">
      <CardHeader className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <History className="h-5 w-5" />
          </div>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">My Sentiment History</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {history.length > 0 ? (
          <div className="divide-y divide-white/5">
            {history.map((vote) => (
              <div key={vote.id} className="p-5 hover:bg-white/5 transition-colors group cursor-default">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1">
                    <Text variant="bodySmall" weight="bold" className="block group-hover:text-primary transition-colors">{vote.asset}</Text>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono uppercase font-bold">
                      {vote.ticker} • {format(new Date(vote.date), 'MMM d')}
                    </div>
                  </div>
                  <Badge className={cn(
                    "border-none text-[9px] font-bold uppercase h-5 px-2",
                    vote.vote === 'Bull' ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                  )}>
                    {vote.vote}
                  </Badge>
                </div>
                
                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="space-y-1">
                    <Text variant="label" className="text-[8px] opacity-50 uppercase font-bold tracking-widest">Market Stance</Text>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-primary">{vote.currentBullish}% Bullish</span>
                      <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${vote.currentBullish}%` }} />
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center space-y-2 opacity-50">
            <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <Text variant="caption" className="italic">No historical sentiment nodes localized.</Text>
          </div>
        )}
        <div className="p-4 bg-muted/10 border-t border-white/5">
          <button className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors py-2">
            View All Handshakes
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
