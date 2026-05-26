'use client';

import React, { useEffect, useState } from 'react';
import { getCommentIntelligence } from '@/services/mock-api/comments';
import { CommentIntelligenceData } from '@/types/community';
import { Text } from '@/design-system/typography/text';
import { CommentAnalytics } from './CommentAnalytics';
import { CommentHighlights } from './CommentHighlights';
import { CommentCard } from '../CommentCard';
import { 
  Loader2, 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Activity, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  SortAsc
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CommentIntelligenceHubProps {
  articleId: string;
}

/**
 * Intelligent Comment Orchestration Hub.
 * Features smart highlights, engagement analytics, and sophisticated triage tools.
 */
export function CommentIntelligenceHub({ articleId }: CommentIntelligenceHubProps) {
  const [data, setData] = useState<CommentIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('relevant');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getCommentIntelligence(articleId);
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Comment sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [articleId]);

  if (loading || !data) {
    return (
      <div className="py-32 flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <Text variant="bodySmall" className="text-muted-foreground animate-pulse font-bold tracking-widest uppercase text-[10px]">Establishing Dialogue Handshake...</Text>
      </div>
    );
  }

  const filteredComments = data.comments.filter(c => 
    c.username.toLowerCase().includes(search.toLowerCase()) ||
    c.text?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mt-24 space-y-16 border-t border-white/5 pt-20">
      
      {/* SECTION: INTELLIGENCE HIGHLIGHTS */}
      <CommentHighlights 
        editorsPick={data.highlights.editors_pick} 
        topCommunity={data.highlights.top_community} 
      />

      {/* SECTION: COMMENT ANALYTICS */}
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-2">
          <Activity className="h-5 w-5 text-primary" />
          <Text variant="h3" className="font-bold">Dialogue Telemetry</Text>
        </div>
        <CommentAnalytics analytics={data.analytics} />
      </div>

      {/* SECTION: MAIN THREAD */}
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <Text variant="h3" className="font-bold">Discussion Matrix</Text>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search dialogue..." 
                className="pl-10 h-10 bg-card/30 border-white/5 rounded-xl text-xs" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] h-10 bg-card/30 border-white/5 rounded-xl font-bold text-[10px] uppercase">
                <SortAsc className="h-3.5 w-3.5 mr-2 text-primary" />
                <SelectValue placeholder="Sort Nodes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevant">Most Relevant</SelectItem>
                <SelectItem value="liked">Most Liked</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Post Input Hub */}
        <Card className="glass-card border-none bg-primary/5 shadow-2xl overflow-hidden group">
          <CardContent className="p-8 space-y-6">
            <div className="flex gap-5">
              <div className="shrink-0 pt-1">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                  <Plus className="h-5 w-5" />
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <Textarea 
                  placeholder="Contribute your tactical research to this node..." 
                  className="bg-background/50 border-white/10 min-h-[100px] resize-none focus:ring-primary/20 text-lg leading-relaxed italic rounded-2xl"
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-white/5 bg-background/50 text-[8px] font-bold uppercase hover:bg-emerald-500/10 cursor-pointer transition-colors">Bullish</Badge>
                    <Badge variant="outline" className="border-white/5 bg-background/50 text-[8px] font-bold uppercase hover:bg-destructive/10 cursor-pointer transition-colors">Bearish</Badge>
                  </div>
                  <Button className="rounded-xl h-10 px-8 font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all scale-105 active:scale-95">
                    Dispatch Node
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Threaded List */}
        <div className="space-y-10">
          {filteredComments.length > 0 ? (
            filteredComments.map(comment => (
              <div key={comment.id} id={`comment-${comment.id}`}>
                <CommentCard comment={comment as any} />
              </div>
            ))
          ) : (
            <div className="py-20 text-center bg-card/10 rounded-[3rem] border-2 border-dashed border-white/5">
              <Text variant="bodySmall" className="text-muted-foreground italic">No dialogue nodes matching your current filter.</Text>
            </div>
          )}
        </div>

        <div className="flex justify-center pt-8">
          <Button variant="ghost" className="h-14 px-10 rounded-2xl border-2 border-dashed border-white/5 text-muted-foreground hover:text-primary font-bold transition-all hover:bg-primary/5 group">
            <TrendingUp className="mr-3 h-5 w-5 group-hover:animate-bounce" /> Load Deeper Discovery Cycles
          </Button>
        </div>
      </div>
    </div>
  );
}
