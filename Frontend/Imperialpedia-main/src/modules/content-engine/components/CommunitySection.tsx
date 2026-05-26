"use client";

import React, { useEffect, useState } from "react";
import { getCommunityData } from "@/services/mock-api/community";
import { CommunityData } from "@/types/community";
import { Text } from "@/design-system/typography/text";
import { CommentCard } from "./CommentCard";
import { PollCard } from "./PollCard";
import { TrendingDiscussions } from "./TrendingDiscussions";
import {
  Loader2,
  MessageSquare,
  Plus,
  TrendingUp,
  TrendingDown,
  Target,
  Trophy,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * Enhanced Community Engagement Section.
 * Aligned with Prompt 37 for threading, sentiment voting, and leaderboard mocks.
 */
export function CommunitySection() {
  const [data, setData] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sentiment, setSentiment] = useState<"Bull" | "Bear" | "Neutral">(
    "Neutral"
  );

  useEffect(() => {
    async function loadCommunity() {
      try {
        const response = await getCommunityData();
        setData(response.data);
      } catch (e) {
        console.error("Community sync failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadCommunity();
  }, []);

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <Text
          variant="bodySmall"
          className="text-muted-foreground animate-pulse font-bold tracking-widest uppercase text-[10px]"
        >
          Synchronizing Community Matrix...
        </Text>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mt-24 space-y-16 border-t border-white/5 pt-20">
      {/* Community Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Sparkles className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Expert Dialogue
            </Text>
          </div>
          <Text variant="h2" className="text-4xl font-bold tracking-tight">
            Intelligence Dialogue
          </Text>
          <Text
            variant="bodySmall"
            className="text-muted-foreground text-base max-w-xl"
          >
            Debate current trajectories and share tactical signals with the
            Imperialpedia network.
          </Text>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-card/30 border border-white/5 shadow-inner">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <Avatar
                key={i}
                className="h-9 w-9 border-2 border-background ring-1 ring-white/5"
              >
                <AvatarImage
                  src={`https://picsum.photos/seed/user${i}/100/100`}
                />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold">1,240 Participants</span>
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">
              Live sentiment active
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Discussion Hub */}
        <div className="lg:col-span-8 space-y-12">
          {/* Post Analysis Input */}
          <Card className="glass-card border-none shadow-2xl bg-primary/5 overflow-hidden">
            <CardHeader className="bg-primary/10 border-b border-primary/10 px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">
                    Post New Insight
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Your Sentiment:
                  </span>
                  <Badge
                    className={cn(
                      "border-none text-[9px] font-bold px-2 h-5",
                      sentiment === "Bull"
                        ? "bg-emerald-500 text-white"
                        : sentiment === "Bear"
                        ? "bg-destructive text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {sentiment}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <Textarea
                placeholder="Share your technical or fundamental analysis on this node..."
                className="bg-background/50 border-white/10 min-h-[120px] resize-none focus:ring-primary/20 text-lg leading-relaxed italic"
              />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSentiment("Bull")}
                    className={cn(
                      "h-10 px-5 rounded-xl font-bold border-white/10 transition-all",
                      sentiment === "Bull"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                        : "bg-background/30 hover:bg-emerald-500/5 hover:text-emerald-500"
                    )}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" /> Bullish
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSentiment("Bear")}
                    className={cn(
                      "h-10 px-5 rounded-xl font-bold border-white/10 transition-all",
                      sentiment === "Bear"
                        ? "bg-destructive/10 text-destructive border-destructive/30"
                        : "bg-background/30 hover:bg-destructive/5 hover:text-destructive"
                    )}
                  >
                    <TrendingDown className="h-4 w-4 mr-2" /> Bearish
                  </Button>
                </div>
                <Button className="w-full sm:w-auto h-12 px-10 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all scale-105 active:scale-95">
                  Submit to Matrix
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments List */}
          <div className="space-y-10">
            {data.comments.map((comment) => (
              <CommentCard
                key={comment.id || comment.comment_id}
                comment={comment}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            className="w-full h-16 rounded-[2rem] border-2 border-dashed border-white/5 text-muted-foreground hover:text-primary font-bold transition-all hover:bg-primary/5 group"
          >
            <Plus className="mr-2 h-5 w-5 group-hover:scale-125 transition-transform" />{" "}
            Load deeper intelligence threads
          </Button>
        </div>

        {/* Community Sidebar */}
        <div className="lg:col-span-4 space-y-10">
          {/* Reputation Node Card */}
          <Card className="glass-card border-none bg-secondary/5 border-secondary/20 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Trophy className="h-32 w-32 text-secondary" />
            </div>
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-2 text-secondary mb-2">
                <Target className="h-4 w-4" />
                <Text
                  variant="label"
                  className="text-[10px] font-bold uppercase tracking-widest"
                >
                  My Authority
                </Text>
              </div>
              <CardTitle className="text-2xl font-bold">
                Node Reputation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary text-xl font-bold border border-secondary/30">
                  {data.userReputation.level}
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold">
                      {data.userReputation.reputationScore.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Next: 1,500
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="bg-secondary h-full transition-all duration-1000"
                      style={{
                        width: `${data.userReputation.nextLevelProgress}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-xl border-secondary/20 text-secondary h-10 font-bold text-xs"
              >
                Review My Badges
              </Button>
            </CardContent>
          </Card>

          {/* Mini Leaderboard Mock */}
          <Card className="glass-card border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-6">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Top Contributors
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {data.leaderboard.map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground w-4">
                        #{idx + 1}
                      </span>
                      <Avatar className="h-8 w-8 rounded-lg border border-white/5">
                        <AvatarImage src={entry.avatar} />
                        <AvatarFallback>
                          {entry.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold group-hover:text-primary transition-colors">
                        {entry.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-secondary">
                      <Zap className="h-3 w-3" /> {entry.reputation}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                className="w-full h-10 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary rounded-none border-t border-white/5"
              >
                Full Rankings Suite
              </Button>
            </CardContent>
          </Card>

          <PollCard poll={data.polls[0]} />

          <TrendingDiscussions topics={data.trendingDiscussions} />
        </div>
      </div>
    </div>
  );
}
