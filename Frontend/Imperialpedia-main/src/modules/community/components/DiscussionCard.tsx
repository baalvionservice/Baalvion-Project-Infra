"use client";

import React from "react";
import { DiscussionNode } from "@/types/community";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/design-system/typography/text";
import {
  MessageSquare,
  Heart,
  Eye,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  Flame,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DiscussionCardProps {
  discussion: DiscussionNode;
}

/**
 * A sophisticated card representing a trending financial discussion.
 */
export function DiscussionCard({ discussion }: DiscussionCardProps) {
  return (
    <Card className="glass-card border-none shadow-xl hover:border-primary/30 transition-all duration-500 overflow-hidden relative group">
      {/* Background Icon Overlay */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
        <Flame className="h-20 w-20 text-primary" />
      </div>

      <CardHeader className="p-6 pb-2">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/20 text-[9px] font-bold uppercase tracking-widest px-2 h-5"
            >
              {discussion.category}
            </Badge>
            {discussion.trending_score > 90 && (
              <Badge className="bg-amber-500 text-white border-none text-[8px] font-bold uppercase h-5 px-2 animate-pulse">
                <Flame className="h-2 w-2 mr-1" /> Viral
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-primary font-bold text-[10px]">
            <TrendingUp className="h-3 w-3" /> {discussion.trending_score}%
            velocity
          </div>
        </div>
        <Link href={`/community/discussions/${discussion.id}`}>
          <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors cursor-pointer">
            {discussion.title}
          </CardTitle>
        </Link>
      </CardHeader>

      <CardContent className="p-6 pt-2">
        <Text
          variant="bodySmall"
          className="text-muted-foreground line-clamp-2 italic leading-relaxed mb-6"
        >
          "{discussion.content}"
        </Text>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 rounded-lg border border-white/10 group-hover:border-primary/30 transition-colors">
              <AvatarImage src={discussion.authorAvatar} />
              <AvatarFallback>{discussion.author.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground/90">
                {discussion.author}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                {discussion.timestamp}
              </span>
            </div>
          </div>

          {discussion.asset_tag && (
            <Badge
              variant="secondary"
              className="bg-background/50 border border-white/5 text-[9px] font-mono font-bold text-primary"
            >
              <Zap className="h-2.5 w-2.5 mr-1" /> {discussion.asset_tag}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 border-t border-white/5 mt-4 bg-muted/10">
        <div className="flex items-center justify-between w-full pt-4">
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold font-mono">
                {(discussion.views / 1000).toFixed(1)}k
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-destructive/60" />
              <span className="text-[10px] font-bold font-mono">
                {discussion.likes}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-[10px] font-bold font-mono">
                {discussion.comments}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-primary font-bold text-xs group/btn"
            asChild
          >
            <Link href={`/community/discussions/${discussion.id}`}>
              Analyze Hub{" "}
              <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
