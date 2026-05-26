'use client';

import React, { useState } from 'react';
import { CommunityData, LeaderboardItem, ReputationEntry } from '@/types/community';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Award, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ShieldCheck, 
  Zap, 
  Star, 
  Medal,
  ChevronRight,
  Info,
  Users,
  MessageSquare,
  Activity,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface LeaderboardClientProps {
  data: CommunityData;
}

/**
 * Enhanced Community Reputation & Leaderboard Interface.
 * Orchestrates authority visualization and meritocracy rankings.
 */
export function LeaderboardClient({ data }: LeaderboardClientProps) {
  const { userReputation, leaderboards_full, reputation_list } = data;
  const [activeTab, setActiveTab] = useState('monthly');

  // Find personal entry if available
  const personalReputation = reputation_list.find(r => r.username === userReputation.username);

  const topThree = leaderboards_full.slice(0, 3);
  const remaining = leaderboards_full.slice(3);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Header & Sub-Nav */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Trophy className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Platform Meritocracy</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">Community Leaderboard</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Recognizing the world's leading financial contributors and intelligence nodes.
          </Text>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="bg-card/30 border border-white/5 p-1 h-11 rounded-xl">
            <TabsTrigger value="weekly" className="px-6 rounded-lg font-bold text-xs data-[state=active]:bg-primary">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="px-6 rounded-lg font-bold text-xs data-[state=active]:bg-primary">Monthly</TabsTrigger>
            <TabsTrigger value="all-time" className="px-6 rounded-lg font-bold text-xs data-[state=active]:bg-primary">All-time</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Personal Stats & Contribution Audit */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="glass-card border-none bg-primary/5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Zap className="h-32 w-32" />
            </div>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Award className="h-4 w-4" /> My Authority Node
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary border border-primary/20">
                    {userReputation.level}
                  </div>
                  <Badge className="absolute -bottom-2 -right-2 bg-primary text-white text-[8px] font-bold h-5 px-1.5 shadow-lg">LVL</Badge>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-end">
                    <Text variant="body" weight="bold">{userReputation.reputationScore.toLocaleString()}</Text>
                    <Text variant="caption" className="text-muted-foreground text-[10px]">Next: 1,500</Text>
                  </div>
                  <Progress value={userReputation.nextLevelProgress} className="h-1.5 bg-white/5" />
                </div>
              </div>

              {/* Contribution Matrix */}
              <div className="space-y-4">
                <Text variant="label" className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-1">Engagement Audit</Text>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-background/40 border border-white/5 text-center space-y-1 group hover:border-primary/30 transition-all">
                    <Text variant="body" weight="bold" className="text-primary">{personalReputation?.contributions.posts || 0}</Text>
                    <Text variant="label" className="text-[7px] opacity-50 uppercase font-bold block">Posts</Text>
                  </div>
                  <div className="p-3 rounded-xl bg-background/40 border border-white/5 text-center space-y-1 group hover:border-secondary/30 transition-all">
                    <Text variant="body" weight="bold" className="text-secondary">{personalReputation?.contributions.comments || 0}</Text>
                    <Text variant="label" className="text-[7px] opacity-50 uppercase font-bold block">Comments</Text>
                  </div>
                  <div className="p-3 rounded-xl bg-background/40 border border-white/5 text-center space-y-1 group hover:border-emerald-500/30 transition-all">
                    <Text variant="body" weight="bold" className="text-emerald-500">{personalReputation?.contributions.polls || 0}</Text>
                    <Text variant="label" className="text-[7px] opacity-50 uppercase font-bold block">Polls</Text>
                  </div>
                </div>
              </div>

              {/* Badges Hub */}
              <div className="space-y-4">
                <Text variant="label" className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-1">Active Badges</Text>
                <div className="space-y-3">
                  {userReputation.badges.map((badge) => (
                    <div key={badge.id} className="flex items-center gap-3 p-3 rounded-xl bg-background/20 border border-white/5 group hover:border-primary/30 transition-colors">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <Text variant="caption" weight="bold" className="block text-xs">{badge.name}</Text>
                        <Text variant="caption" className="text-[9px] text-muted-foreground line-clamp-1 italic">"{badge.description}"</Text>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 rounded-xl">
                  Full Achievement Gallery <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Strategic Insight */}
          <div className="p-8 rounded-[2.5rem] border border-secondary/20 bg-secondary/5 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Star className="h-16 w-16 text-secondary" />
            </div>
            <Text variant="label" className="text-secondary font-bold uppercase">Reputation Loop</Text>
            <Text variant="h3" className="font-bold">Next Milestone</Text>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <Text variant="bodySmall" weight="bold">Precision Oracle</Text>
                <Text variant="caption" className="text-muted-foreground text-[11px]">Win 3 more prediction contests.</Text>
              </div>
            </div>
            <Progress value={42} className="h-1 bg-white/5" />
            <Text variant="caption" className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Current Progress: 2/5 Forecasts Won</Text>
          </div>
        </div>

        {/* Right Column: Podium & Detailed Rankings */}
        <div className="lg:col-span-8 space-y-12">
          {/* Meritocracy Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {topThree.map((entry, idx) => (
              <Card 
                key={entry.username} 
                className={cn(
                  "glass-card border-none relative overflow-hidden transition-all duration-500 hover:translate-y-[-8px]",
                  idx === 0 ? "md:scale-110 z-10 ring-2 ring-primary/40 shadow-2xl bg-primary/5" : "opacity-90"
                )}
              >
                {idx === 0 && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
                )}
                <CardContent className="p-8 text-center space-y-5">
                  <div className="relative mx-auto w-24 h-24">
                    <Avatar className={cn(
                      "w-24 h-24 border-4 p-1 rounded-[2rem]",
                      idx === 0 ? "border-primary ring-4 ring-primary/10" : 
                      idx === 1 ? "border-zinc-400" : "border-amber-700"
                    )}>
                      <AvatarImage src={entry.avatar} className="rounded-[1.8rem]" />
                      <AvatarFallback>{entry.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "absolute -bottom-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-2xl border-2 border-background",
                      idx === 0 ? "bg-primary text-white" : 
                      idx === 1 ? "bg-zinc-400 text-zinc-900" : "bg-amber-700 text-white"
                    )}>
                      {idx === 0 ? <Trophy className="h-5 w-5" /> : <Medal className="h-5 w-5" />}
                    </div>
                  </div>
                  
                  <div>
                    <Text variant="body" weight="bold" className="group-hover:text-primary transition-colors text-lg">{entry.username}</Text>
                    <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                      {entry.badges?.slice(0, 2).map(b => (
                        <Badge key={b} variant="secondary" className="bg-background/50 text-foreground border-white/5 text-[8px] font-bold uppercase h-5 px-2">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 space-y-1">
                    <div className="text-3xl font-bold tracking-tighter text-foreground">{entry.total_points.toLocaleString()}</div>
                    <Text variant="label" className="text-[8px] opacity-50 uppercase font-bold tracking-widest">Reputation Nodes</Text>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Master Ranking Matrix */}
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Network Rankings</CardTitle>
                <CardDescription>Comprehensive audit of contributors by authority score.</CardDescription>
              </div>
              <Badge variant="outline" className="border-white/10 bg-background/30 text-[10px] font-bold tracking-widest h-7 px-4">TOP 100 INDEXED</Badge>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                    <TableHead className="w-20 text-center font-bold text-[10px] uppercase tracking-widest py-6">Rank</TableHead>
                    <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">Contributor Node</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Achievements</TableHead>
                    <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest">Authority Score</TableHead>
                    <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Trajectory</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboards_full.map((entry) => (
                    <TableRow key={entry.username} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                      <TableCell className="text-center font-mono font-bold text-muted-foreground">
                        #{entry.rank}
                      </TableCell>
                      <TableCell className="py-5 pl-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 rounded-2xl border-2 border-white/5 group-hover:border-primary/30 transition-colors">
                            <AvatarImage src={entry.avatar} />
                            <AvatarFallback>{entry.username.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-bold group-hover:text-primary transition-colors">{entry.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.badges?.map(badge => (
                            <Badge key={badge} variant="outline" className="bg-background/50 border-white/10 text-[8px] font-bold uppercase h-5 px-2">
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground">
                        {entry.total_points.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end">
                          <div className={cn(
                            "p-2 rounded-xl bg-background/50 border border-white/5",
                            entry.trend === 'up' ? "text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]" : 
                            entry.trend === 'down' ? "text-destructive" : "text-muted-foreground"
                          )}>
                            {entry.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : 
                             entry.trend === 'down' ? <TrendingDown className="h-4 w-4" /> : 
                             <Minus className="h-4 w-4" />}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Strategic Context Footer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="glass-card border-none bg-primary/5 p-8 flex items-start gap-6 group hover:border-primary/30 transition-all">
              <div className="p-4 rounded-3xl bg-primary/10 text-primary shrink-0 group-hover:scale-110 transition-transform">
                <Target className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <Text variant="bodySmall" weight="bold">Precision Signal Score</Text>
                <Text variant="caption" className="text-muted-foreground leading-relaxed">
                  Reputation nodes are weighted by your **Forecast Precision**. Contributors who consistently identify market catalysts receive a 2.4x discovery reach multiplier.
                </Text>
              </div>
            </Card>
            
            <Card className="glass-card border-none bg-secondary/5 p-8 flex items-start gap-6 group hover:border-secondary/30 transition-all">
              <div className="p-4 rounded-3xl bg-secondary/10 text-secondary shrink-0 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <Text variant="bodySmall" weight="bold">Verified Vetting Cycle</Text>
                <Text variant="caption" className="text-muted-foreground leading-relaxed">
                  Top contributors are automatically fast-tracked for **Expert Verification**. This unlocks monetization gateways and institutional-grade analyst tools.
                </Text>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
