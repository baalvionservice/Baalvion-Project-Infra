"use client";

import React, { useEffect, useState, use } from "react";
import { Container } from "@/design-system/layout/container";
import { Text } from "@/design-system/typography/text";
import { communityService } from "@/services/data/community-service";
import { DiscussionNode, Comment } from "@/types/community";
import { CommentCard } from "@/modules/content-engine/components/CommentCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Eye,
  Bookmark,
  Share2,
  Clock,
  Zap,
  TrendingUp,
  Target,
  ShieldCheck,
  Loader2,
  ChevronRight,
  MoreVertical,
  Flag,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface DiscussionDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Individual Discussion Thread Hub.
 * Orchestrates high-fidelity dialogue and community engagement.
 */
export default function DiscussionDetailPage({
  params,
}: DiscussionDetailPageProps) {
  const { id } = use(params);
  const [discussion, setDiscussion] = useState<DiscussionNode | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await communityService.getCommunityData();
        if (response.data) {
          const found = response.data.discussions.find((d) => d.id === id);
          if (found) {
            setDiscussion(found);
            setComments(response.data.comments);
          }
        }
      } catch (e) {
        console.error("Handshake failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleEngagement = (type: "Like" | "Bookmark" | "Share") => {
    if (type === "Like") setHasLiked(!hasLiked);
    if (type === "Bookmark") setIsBookmarked(!isBookmarked);

    toast({
      title: `${type} Registered`,
      description: `Interaction node synchronized with ${discussion?.id}.`,
    });
  };

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text
          variant="bodySmall"
          className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground"
        >
          Retrieving Dialogue Node...
        </Text>
      </div>
    );
  }

  if (!discussion) {
    return (
      <Container className="py-40 text-center">
        <Text variant="h2">Discussion Node Not Found</Text>
        <Button variant="link" asChild className="mt-4">
          <Link href="/community/discussions">Back to Hub</Link>
        </Button>
      </Container>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-12 pb-32">
      <Container isNarrow>
        <Button
          variant="ghost"
          size="sm"
          className="mb-8 p-0 hover:bg-transparent text-muted-foreground hover:text-primary group"
          asChild
        >
          <Link href="/community/discussions">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Discussions
          </Link>
        </Button>

        {/* Thread Identity Section */}
        <div className="space-y-10 mb-16 animate-in fade-in duration-700">
          <header className="space-y-6">
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="text-primary border-primary/30 uppercase tracking-widest text-[10px] font-bold px-3 py-1"
              >
                {discussion.category} Archive
              </Badge>
              {discussion.asset_tag && (
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-none text-[10px] font-mono font-bold h-6 px-2"
                >
                  <Zap className="h-3 w-3 mr-1" /> {discussion.asset_tag}
                </Badge>
              )}
            </div>

            <Text
              variant="h1"
              className="text-4xl lg:text-6xl font-bold tracking-tight leading-tight"
            >
              {discussion.title}
            </Text>

            <div className="flex items-center justify-between border-y border-white/5 py-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 rounded-2xl border-2 border-background ring-1 ring-white/10 shadow-xl">
                  <AvatarImage src={discussion.authorAvatar} />
                  <AvatarFallback>{discussion.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <Text
                    variant="bodySmall"
                    weight="bold"
                    className="block text-foreground group-hover:text-primary transition-colors"
                  >
                    {discussion.author}
                  </Text>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                    <Clock className="h-3 w-3" /> {discussion.timestamp} • 8m
                    Read Depth
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-xl border-white/10 transition-colors",
                    hasLiked
                      ? "text-primary bg-primary/5 border-primary/30"
                      : "text-muted-foreground"
                  )}
                  onClick={() => handleEngagement("Like")}
                >
                  <Heart
                    className={cn("h-5 w-5", hasLiked && "fill-current")}
                  />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-xl border-white/10 transition-colors",
                    isBookmarked
                      ? "text-secondary bg-secondary/5 border-secondary/30"
                      : "text-muted-foreground"
                  )}
                  onClick={() => handleEngagement("Bookmark")}
                >
                  <Bookmark
                    className={cn("h-5 w-5", isBookmarked && "fill-current")}
                  />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl border-white/10 text-muted-foreground"
                  onClick={() => handleEngagement("Share")}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          <article className="prose prose-invert max-w-none">
            <Text
              variant="body"
              className="text-xl leading-relaxed text-foreground/80 italic border-l-4 border-primary/30 pl-8 mb-12"
            >
              "{discussion.content}"
            </Text>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                In the current fiscal cycle, we are witnessing a significant
                decoupling of technical indicators from fundamental benchmarks.
                The <strong>{discussion.asset_tag}</strong> liquidity node is
                particularly sensitive to the upcoming central bank dispatches.
              </p>
              <p>
                Historically, when the trending score crosses the 90th
                percentile, we see high-velocity rebalancing within
                professional-tier portfolios. I would argue that the current
                consolidation phase is a necessary structural handshake before
                the next leg of the super-cycle.
              </p>
            </div>
          </article>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-white/5">
            <div className="flex flex-col items-center p-6 rounded-2xl bg-card/30 border border-white/5">
              <div className="text-2xl font-bold font-mono">
                {(discussion.views / 1000).toFixed(1)}k
              </div>
              <Text
                variant="label"
                className="text-[8px] opacity-50 uppercase font-bold tracking-widest mt-1"
              >
                Discovery Reach
              </Text>
            </div>
            <div className="flex flex-col items-center p-6 rounded-2xl bg-card/30 border border-white/5">
              <div className="text-2xl font-bold font-mono">
                {discussion.likes}
              </div>
              <Text
                variant="label"
                className="text-[8px] opacity-50 uppercase font-bold tracking-widest mt-1"
              >
                Sentiment Nodes
              </Text>
            </div>
            <div className="flex flex-col items-center p-6 rounded-2xl bg-card/30 border border-white/5">
              <div className="text-2xl font-bold font-mono">
                {discussion.comments}
              </div>
              <Text
                variant="label"
                className="text-[8px] opacity-50 uppercase font-bold tracking-widest mt-1"
              >
                Dialogue Depth
              </Text>
            </div>
          </div>
        </div>

        {/* Discussion Engagement Suite */}
        <section className="space-y-12 pt-12 border-t border-white/5">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <Text variant="h3" className="font-bold">
                Community Dialogue
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Sort By:
              </span>
              <Badge
                variant="secondary"
                className="bg-primary/5 text-primary border-none font-bold text-[9px] h-6 px-3 cursor-pointer hover:bg-primary/10 transition-colors"
              >
                Most Impactful
              </Badge>
            </div>
          </div>

          {/* User Input Hub */}
          <div className="flex gap-5 animate-in slide-in-from-left-4 duration-500">
            <Avatar className="h-10 w-10 rounded-xl mt-1">
              <AvatarImage src="https://picsum.photos/seed/user42/100/100" />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <Textarea
                placeholder="Submit your tactical analysis to this thread..."
                className="bg-card/30 border-white/10 min-h-[100px] resize-none leading-relaxed rounded-2xl italic text-sm"
              />
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className="border-white/5 bg-background/50 text-[8px] font-bold uppercase cursor-pointer hover:bg-emerald-500/10 transition-colors"
                  >
                    Bullish
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-white/5 bg-background/50 text-[8px] font-bold uppercase cursor-pointer hover:bg-destructive/10 transition-colors"
                  >
                    Bearish
                  </Badge>
                </div>
                <Button className="rounded-xl h-10 px-8 font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                  Publish Node
                </Button>
              </div>
            </div>
          </div>

          {/* Threaded Comments */}
          <div className="space-y-10">
            {comments.map((comment) => (
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
            <Activity className="mr-3 h-5 w-5 group-hover:animate-pulse" /> Load
            Extended Discussion Matrix
          </Button>
        </section>

        {/* Global Strategy Footer */}
        <footer className="mt-24 p-12 rounded-[3.5rem] bg-primary/5 border border-primary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Target className="h-64 w-64 text-primary" />
          </div>
          <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
            <div className="w-20 h-20 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <div className="flex-1 text-center lg:text-left space-y-2">
              <Text variant="h2" className="text-2xl font-bold">
                Dialogue Integrity Verified
              </Text>
              <Text
                variant="bodySmall"
                className="text-muted-foreground leading-relaxed max-w-2xl text-base"
              >
                Discussions are monitored by the **Reputation Consensus Node**.
                Contributors who consistently provide verified analysis receive
                prioritized placement in the discovery feed.
              </Text>
            </div>
            <Button
              variant="outline"
              className="h-12 px-8 rounded-xl font-bold border-primary/30 hover:bg-primary/5 shrink-0"
              asChild
            >
              <Link href="/community/leaderboard">Review Expert Authority</Link>
            </Button>
          </div>
        </footer>
      </Container>
    </main>
  );
}
