'use client';

import React from 'react';
import { CommentAnalytics as AnalyticsType } from '@/types/community';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Heart, 
  Activity, 
  TrendingUp, 
  Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentAnalyticsProps {
  analytics: AnalyticsType;
}

/**
 * Advanced Comment Engagement Analytics Dashboard.
 * Visualizes the impact and sentiment of the community dialogue.
 */
export function CommentAnalytics({ analytics }: CommentAnalyticsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-700">
      <Card className="glass-card border-none bg-primary/5 group hover:border-primary/20 transition-all">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="h-4 w-4" />
            </div>
            <Badge variant="outline" className="text-[8px] font-bold border-primary/20 text-primary uppercase">Total Dialogue</Badge>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tighter">{analytics.total_comments}</div>
            <Text variant="label" className="text-[9px] opacity-50 uppercase tracking-widest">Active Nodes</Text>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-none group hover:border-secondary/20 transition-all">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary">
              <Users className="h-4 w-4" />
            </div>
            <Badge variant="outline" className="text-[8px] font-bold border-secondary/20 text-secondary uppercase">Lead Contributor</Badge>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold truncate text-foreground/90">{analytics.top_commenter}</div>
            <Text variant="label" className="text-[9px] opacity-50 uppercase tracking-widest">Top Reputation</Text>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-none group hover:border-emerald-500/20 transition-all">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Activity className="h-4 w-4" />
            </div>
            <Badge variant="outline" className="text-[8px] font-bold border-emerald-500/20 text-emerald-500 uppercase">Perception</Badge>
          </div>
          <div className="space-y-1">
            <div className={cn(
              "text-2xl font-bold tracking-tighter",
              analytics.sentiment_bias === 'Bullish' ? "text-emerald-500" : "text-destructive"
            )}>{analytics.sentiment_bias}</div>
            <Text variant="label" className="text-[9px] opacity-50 uppercase tracking-widest">Crowd Signal</Text>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-none bg-secondary/5 group hover:border-secondary/20 transition-all">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary">
              <TrendingUp className="h-4 w-4" />
            </div>
            <Badge variant="outline" className="text-[8px] font-bold border-secondary/20 text-secondary uppercase">Intensity</Badge>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tighter">{analytics.avg_engagement}</div>
            <Text variant="label" className="text-[9px] opacity-50 uppercase tracking-widest">Avg. Interaction</Text>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
