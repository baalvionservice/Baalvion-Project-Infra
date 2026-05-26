"use client";

import React, { useEffect, useState } from "react";
import { Container } from "@/design-system/layout/container";
import { Text } from "@/design-system/typography/text";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  Flame,
  Sparkles,
  TrendingUp,
  Activity,
  Loader2,
  ChevronRight,
  Target
} from 'lucide-react';
import { communityService } from '@/services/data/community-service';
import { DiscussionNode, TrendingTopic } from '@/types/community';
import { DiscussionCard } from '@/modules/community/components/DiscussionCard';
import { DiscussionSidebar } from '@/modules/community/components/DiscussionSidebar';
import { NewDiscussionForm } from '@/modules/community/components/NewDiscussionForm';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

/**
 * Community Trending Discussions Dashboard.
 * Orchestrates real-time market dialogue and expert-led forums.
 */
export default function CommunityDiscussionsPage() {
  const [discussions, setDiscussions] = useState<DiscussionNode[]>([]);
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await communityService.getCommunityData();
        if (response.data) {
          setDiscussions(response.data.discussions);
          setTopics(response.data.topics);
        }
      } catch (e) {
        console.error("Handshake failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categories = [
    "All",
    "Stocks",
    "Cryptocurrency",
    "Macro",
    "Economy",
    "Trading",
  ];

  const filtered = discussions.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.author.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || d.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text
          variant="bodySmall"
          className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground"
        >
          Synchronizing Discovery Forums...
        </Text>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-12 pb-32">
      <Container>
        {/* Header & New Thread Trigger */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary mb-1">
              <MessageSquare className="h-4 w-4" />
              <Text
                variant="label"
                className="text-[10px] font-bold tracking-widest uppercase"
              >
                Expert Dialogue Nodes
              </Text>
            </div>
            <Text
              variant="h1"
              className="text-4xl lg:text-5xl font-bold tracking-tight"
            >
              Trending Discussions
            </Text>
            <Text
              variant="body"
              className="text-muted-foreground text-lg leading-relaxed max-w-2xl"
            >
              Explore the most active market audits. Participate in
              institutional-grade debates and contribute your tactical research.
            </Text>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 group scale-105 active:scale-95 transition-all"
              >
                <Plus className="mr-2 h-5 w-5" /> Start New Discussion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl p-0 border-none bg-transparent shadow-none">
              <DialogHeader className="sr-only">
                <DialogTitle>Start a New Intelligence Thread</DialogTitle>
                <DialogDescription>
                  Initiate a structured dialogue node with the community.
                </DialogDescription>
              </DialogHeader>
              <NewDiscussionForm onCancel={() => {}} />
            </DialogContent>
          </Dialog>
        </header>

        {/* Global Hub Navigation */}
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 space-y-10">
            {/* Filter Matrix */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-white/5 pb-6">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={activeCategory === cat ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "rounded-xl h-9 px-5 font-bold text-[10px] uppercase tracking-widest transition-all",
                      activeCategory === cat
                        ? "bg-primary shadow-lg shadow-primary/20"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                    )}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>

              <div className="relative group w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Filter hub by title or author..."
                  className="pl-10 h-11 bg-card/30 border-white/10 rounded-xl text-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 gap-8">
              {filtered.length > 0 ? (
                filtered.map((discussion) => (
                  <DiscussionCard key={discussion.id} discussion={discussion} />
                ))
              ) : (
                <div className="py-32 text-center bg-card/10 rounded-[3rem] border-2 border-dashed border-white/5">
                  <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Activity className="h-10 w-10 text-muted-foreground opacity-50" />
                  </div>
                  <Text variant="h3" className="mb-2">No active discussions localized</Text>
                  <Text variant="bodySmall" className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Try adjusting your taxonomy filters or search parameters to discover new intelligence nodes.
                  </Text>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              className="w-full h-16 rounded-[2.5rem] border-2 border-dashed border-white/5 text-muted-foreground hover:text-primary font-bold transition-all group"
            >
              <Activity className="mr-3 h-5 w-5 group-hover:animate-pulse" />{" "}
              Load Deeper Discovery Threads
            </Button>
          </div>

          {/* Sidebar Modules */}
          <div className="lg:w-80">
            <DiscussionSidebar topics={topics} />
          </div>
        </div>
      </Container>
    </main>
  );
}
