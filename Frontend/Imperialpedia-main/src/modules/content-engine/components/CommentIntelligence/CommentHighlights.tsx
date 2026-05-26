"use client";

import React from "react";
import { IntelligenceCommentNode } from "@/types/community";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Text } from "@/design-system/typography/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Zap,
  Sparkles,
  Trophy,
  MessageSquare,
  ArrowUpRight,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CommentHighlightsProps {
  editorsPick: IntelligenceCommentNode[];
  topCommunity: IntelligenceCommentNode[];
}

/**
 * Curated Comment Discovery Hub.
 * Highlights Editor's Picks and high-impact community insights above the main thread.
 */
export function CommentHighlights({
  editorsPick,
  topCommunity,
}: CommentHighlightsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 animate-in slide-in-from-top-4 duration-1000">
      {/* Editor's Pick Column */}
      <div className="lg:col-span-5 space-y-6">
        <div className="flex items-center gap-2 px-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <Text
            variant="label"
            className="text-[10px] font-bold uppercase tracking-widest"
          >
            Editorial curation
          </Text>
        </div>

        {editorsPick.map((item) => (
          <Card
            key={item.id}
            className="glass-card border-none shadow-2xl bg-primary/5 relative overflow-hidden group hover:border-primary/30 transition-all"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
              <Zap className="h-24 w-24 text-primary" />
            </div>
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-10 w-10 border-2 border-primary/20 rounded-xl">
                  <AvatarImage src={item.avatar} />
                  <AvatarFallback>{item.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{item.username}</span>
                    <Badge className="bg-primary text-white border-none text-[8px] px-2 h-5 font-bold uppercase">
                      Editor's Pick
                    </Badge>
                  </div>
                  <Text
                    variant="caption"
                    className="text-muted-foreground font-bold text-[9px] uppercase tracking-tighter"
                  >
                    {item.badge}
                  </Text>
                </div>
              </div>
              <Text
                variant="bodySmall"
                className="text-foreground leading-relaxed italic text-base"
              >
                "{item.text}"
              </Text>
            </CardHeader>
            <CardFooter className="px-8 pb-8 pt-0">
              <Button
                variant="link"
                className="p-0 h-auto text-primary text-[10px] font-bold uppercase group/link"
                asChild
              >
                <a href={`#comment-${item.id}`}>
                  Jump to dialogue{" "}
                  <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Top Community Insights */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-center gap-2 px-2">
          <Sparkles className="h-4 w-4 text-secondary" />
          <Text
            variant="label"
            className="text-[10px] font-bold uppercase tracking-widest"
          >
            Consensus Highlights
          </Text>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topCommunity.map((item) => (
            <Card
              key={item.id}
              className="glass-card border-none shadow-xl hover:border-secondary/20 transition-all group cursor-pointer h-full flex flex-col"
            >
              <CardContent className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <Badge
                    variant="secondary"
                    className="bg-secondary/10 text-secondary border-none text-[8px] font-bold uppercase px-2 h-5"
                  >
                    {item.label}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-emerald-500 font-mono text-[10px] font-bold">
                    <ArrowUpRight className="h-3 w-3" /> {item.upvotes}
                  </div>
                </div>
                <Text
                  variant="caption"
                  className="text-muted-foreground leading-relaxed line-clamp-3 italic mb-4"
                >
                  "{item.text}"
                </Text>
                <div className="flex items-center gap-2 mt-auto">
                  <Avatar className="h-6 w-6 rounded-lg opacity-60">
                    <AvatarImage src={item.avatar} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    @{item.username.toLowerCase().replace(" ", "")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
