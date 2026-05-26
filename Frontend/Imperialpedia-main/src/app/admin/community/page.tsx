'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  ShieldAlert,
  Flame,
  Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

/**
 * Community Moderation Hub.
 * Specialized terminal for managing crowdsourced intelligence and network dialogue.
 */
export default function CommunityModerationHub() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [comments, setComments] = useState([
    { id: 'c-1', user: "TraderMike", text: "The yield curve inversion is a classic signal. NVDA is looking top-heavy here.", status: "Flagged", reason: "Possible Spam", date: "10m ago" },
    { id: 'c-2', user: "CryptoLina", text: "Bullish on the next BTC halving. Institutional absorption is real.", status: "Pending", reason: "New User", date: "42m ago" },
    { id: 'c-3', user: "MarketAggressor", text: "Anyone buying here is an idiot. Total market collapse incoming.", status: "Flagged", reason: "Toxicity", date: "1h ago" },
  ]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  const handleAction = (id: string, action: 'Approve' | 'Remove') => {
    setComments(prev => prev.filter(c => c.id !== id));
    toast({ 
      title: action === 'Approve' ? "Comment Cleared" : "Node Purged", 
      description: `Action committed to the community consensus index.`,
      variant: action === 'Remove' ? 'destructive' : 'default'
    });
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <MessageSquare className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Crowdsourced Integrity</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">Community Gate</Text>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-amber-500/20 bg-amber-500/5 text-amber-500 text-[10px] font-bold px-3 h-11 uppercase">
            {comments.length} Pending Triage
          </Badge>
          <Button className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8 transition-all scale-105 active:scale-95">
            Audit AI Moderation
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-card/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search dialogue nodes..." 
                className="pl-12 bg-background/50 h-12 border-white/10 rounded-xl text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <div className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 border-b border-white/5">
                    <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">User / Sentiment</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Reason</TableHead>
                    <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Administrative Verdict</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-64 text-center">
                        <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                        <Text variant="caption" className="mt-4 block animate-pulse font-bold tracking-widest uppercase">Indexing Sentiment Buffer...</Text>
                      </TableCell>
                    </TableRow>
                  ) : comments.map((comment) => (
                    <TableRow key={comment.id} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                      <TableCell className="py-6 pl-8">
                        <div className="flex gap-4">
                          <Avatar className="h-9 w-9 rounded-xl">
                            <AvatarFallback className="bg-background/50 text-[10px] font-bold">{comment.user.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1 max-w-[400px]">
                            <Text variant="bodySmall" weight="bold">{comment.user}</Text>
                            <Text variant="caption" className="text-muted-foreground leading-relaxed block italic">"{comment.text}"</Text>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "text-[8px] font-bold uppercase border-none px-2 h-5",
                          comment.status === 'Flagged' ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-500"
                        )}>{comment.reason}</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 rounded-xl text-[10px] font-bold uppercase text-emerald-500 hover:bg-emerald-500/10" onClick={() => handleAction(comment.id, 'Approve')}><CheckCircle2 className="h-3 w-3 mr-1" /> Approve</Button>
                          <Button variant="ghost" size="sm" className="h-8 rounded-xl text-[10px] font-bold uppercase text-destructive hover:bg-destructive/10" onClick={() => handleAction(comment.id, 'Remove')}><XCircle className="h-3 w-3 mr-1" /> Purge</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <aside className="lg:col-span-4 space-y-8">
          <Card className="glass-card border-none shadow-xl bg-card/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Flame className="h-4 w-4" /> Trending Dialogue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {[
                  { topic: "Bitcoin ETFs", engagement: "8.2k", trend: "up" },
                  { topic: "AI Valuations", engagement: "5.4k", trend: "up" },
                  { topic: "Yield Curve Strategy", engagement: "3.1k", trend: "down" }
                ].map((topic, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                    <Text variant="bodySmall" weight="bold" className="group-hover:text-primary transition-colors">{topic.topic}</Text>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-muted-foreground">{topic.engagement}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-none bg-primary/5 p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <ShieldAlert className="h-24 w-24 text-primary rotate-12" />
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-4">
              <Plus className="h-4 w-4" /> Community Rep
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed italic block">
              "Users with an average precision score below 40% are automatically throttled in high-velocity debate rooms to maintain index integrity."
            </Text>
          </Card>
        </aside>
      </div>
    </div>
  );
}