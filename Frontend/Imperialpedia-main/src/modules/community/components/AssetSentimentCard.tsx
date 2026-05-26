'use client';

import React, { useState } from 'react';
import { AssetSentiment } from '@/types/community';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  Users, 
  Activity,
  CheckCircle2,
  ChevronRight,
  LineChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';

interface AssetSentimentCardProps {
  asset: AssetSentiment;
}

/**
 * Interactive Asset Sentiment Node.
 * Features Bull/Bear voting, real-time meter, and longitudinal trend visualization.
 */
export function AssetSentimentCard({ asset }: AssetSentimentCardProps) {
  const [bullish, setBullish] = useState(asset.bullish);
  const [bearish, setBearish] = useState(asset.bearish);
  const [totalVotes, setTotalVotes] = useState(asset.votes);
  const [hasVoted, setHasVoted] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const handleVote = (type: 'Bull' | 'Bear') => {
    if (hasVoted) return;
    
    setTotalVotes(prev => prev + 1);
    if (type === 'Bull') {
      setBullish(prev => Math.min(100, prev + 1));
      setBearish(prev => Math.max(0, prev - 1));
    } else {
      setBearish(prev => Math.min(100, prev + 1));
      setBullish(prev => Math.max(0, prev - 1));
    }
    
    setHasVoted(true);
    toast({
      title: "Vote Registered",
      description: `Your ${type}ish stance for ${asset.ticker} has been synchronized.`,
    });
  };

  return (
    <Card className="glass-card border-none shadow-xl overflow-hidden group hover:border-primary/20 transition-all duration-500">
      <CardHeader className="bg-card/30 border-b border-white/5 p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-background/50 border border-white/10 flex items-center justify-center font-mono font-bold text-sm text-primary group-hover:border-primary/30 transition-all shadow-inner">
              {asset.ticker}
            </div>
            <div>
              <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{asset.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[8px] font-bold border-white/10 bg-black/20 uppercase tracking-widest px-1.5 h-4">
                  {asset.trend} Trend
                </Badge>
                {asset.trend === 'Up' ? (
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                ) : asset.trend === 'Down' ? (
                  <ArrowDownRight className="h-3 w-3 text-destructive" />
                ) : null}
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-10 w-10 rounded-xl", showChart ? "text-primary bg-primary/10" : "text-muted-foreground")}
            onClick={() => setShowChart(!showChart)}
          >
            <LineChart className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        {showChart ? (
          <div className="h-48 w-full animate-in fade-in slide-in-from-top-2 duration-500">
            <Text variant="label" className="text-[9px] opacity-50 mb-4 block uppercase tracking-widest text-center">7-Day Sentiment Drift</Text>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={asset.history}>
                <defs>
                  <linearGradient id={`colorSenti-${asset.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8272F2" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8272F2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#8272F2' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="bullish" 
                  stroke="#8272F2" 
                  fillOpacity={1} 
                  fill={`url(#colorSenti-${asset.id})`} 
                  strokeWidth={3} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <>
            {/* Sentiment Meter */}
            <div className="space-y-4">
              <div className="flex justify-between items-end px-1">
                <div className="flex flex-col items-start gap-1">
                  <span className="text-2xl font-bold text-emerald-500 tracking-tighter">{bullish}%</span>
                  <Text variant="label" className="text-[8px] opacity-50 uppercase font-bold tracking-widest">Bullish</Text>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-2xl font-bold text-destructive tracking-tighter">{bearish}%</span>
                  <Text variant="label" className="text-[8px] opacity-50 uppercase font-bold tracking-widest">Bearish</Text>
                </div>
              </div>
              
              <div className="relative h-2.5 w-full bg-destructive/20 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="absolute left-0 top-0 h-full bg-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  style={{ width: `${bullish}%` }}
                />
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-background/50 z-10" />
              </div>
            </div>

            {/* Voting Controls */}
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => handleVote('Bull')}
                disabled={hasVoted}
                className={cn(
                  "h-12 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
                  hasVoted ? "bg-muted text-muted-foreground opacity-50" : "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
                )}
              >
                <TrendingUp className="mr-2 h-4 w-4" /> Bull
              </Button>
              <Button 
                onClick={() => handleVote('Bear')}
                disabled={hasVoted}
                className={cn(
                  "h-12 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
                  hasVoted ? "bg-muted text-muted-foreground opacity-50" : "bg-destructive hover:bg-red-500 shadow-lg shadow-red-900/20"
                )}
              >
                <TrendingDown className="mr-2 h-4 w-4" /> Bear
              </Button>
            </div>
          </>
        )}

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
            <Users className="h-3 w-3" /> {totalVotes.toLocaleString()} Votes
          </div>
          {hasVoted && (
            <Badge className="bg-primary/10 text-primary border-none text-[8px] font-bold gap-1.5 uppercase h-5 px-2">
              <CheckCircle2 className="h-2.5 w-2.5" /> Handshake Recorded
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
