"use client";

import React, { useState } from "react";
import { Comment } from "@/types/community";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/design-system/typography/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Flag,
  Clock,
  Zap,
  CornerDownRight,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CommentCardProps {
  comment: Comment;
  isReply?: boolean;
}

/**
 * A sophisticated comment card with reputation, sentiment voting, and threading.
 * Optimized for Prompt 37 visual separation and engagement.
 */
export function CommentCard({ comment, isReply = false }: CommentCardProps) {
  const [upvotes, setUpvotes] = useState(comment.upvotes);
  const [downvotes, setDownvotes] = useState(comment.downvotes);
  const [activeVote, setActiveVote] = useState<"up" | "down" | null>(null);

  const handleVote = (type: "up" | "down") => {
    if (activeVote === type) {
      setActiveVote(null);
      type === "up" ? setUpvotes((v) => v - 1) : setDownvotes((v) => v - 1);
    } else {
      if (activeVote) {
        activeVote === "up"
          ? setUpvotes((v) => v - 1)
          : setDownvotes((v) => v - 1);
      }
      setActiveVote(type);
      type === "up" ? setUpvotes((v) => v + 1) : setDownvotes((v) => v + 1);
    }
  };

  return (
    <div
      className={cn(
        "animate-in fade-in duration-500",
        isReply
          ? "ml-6 lg:ml-12 mt-4 pt-4 border-l-2 border-primary/10 pl-6"
          : "mt-8"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <Avatar
            className={cn(
              "rounded-xl border-2 border-background shadow-lg ring-1 ring-white/10",
              isReply ? "h-8 w-8" : "h-12 w-12"
            )}
          >
            <AvatarImage src={comment.avatar} />
            <AvatarFallback className="bg-muted font-bold">
              {comment.username.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {!isReply && (
            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
              <div className="bg-primary/20 rounded-full p-1">
                <Zap className="h-2.5 w-2.5 text-primary" />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "font-bold text-foreground hover:text-primary transition-colors cursor-pointer",
                  isReply ? "text-xs" : "text-sm"
                )}
              >
                {comment.username}
              </span>
              {comment.badge && (
                <Badge
                  variant="secondary"
                  className="bg-primary/5 text-primary border-none text-[8px] font-bold uppercase h-4 px-1.5"
                >
                  {comment.badge}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                <Zap className="h-2.5 w-2.5 text-amber-500" />{" "}
                {comment.reputation || comment.reputationScore}
              </div>
              <span className="text-[9px] text-muted-foreground flex items-center gap-1 uppercase tracking-tighter opacity-60">
                <Clock className="h-2.5 w-2.5" /> {comment.timestamp}
              </span>
            </div>

            <Badge
              className={cn(
                "border-none text-[9px] font-bold uppercase h-5 px-2",
                (comment.bull_bear || comment.bullBearVote) === "Bull"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : (comment.bull_bear || comment.bullBearVote) === "Bear"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {(comment.bull_bear || comment.bullBearVote) === "Bull" ? (
                <TrendingUp className="h-2.5 w-2.5 mr-1" />
              ) : (comment.bull_bear || comment.bullBearVote) === "Bear" ? (
                <TrendingDown className="h-2.5 w-2.5 mr-1" />
              ) : null}
              {comment.bull_bear || comment.bullBearVote}
            </Badge>
          </div>

          <Card
            className={cn(
              "border-none shadow-sm transition-all duration-300",
              !isReply ? "bg-card/50 hover:border-primary/20" : "bg-muted/20"
            )}
          >
            <CardContent className="p-4">
              <Text
                variant="bodySmall"
                className="text-foreground/90 leading-relaxed"
              >
                {comment.text || comment.content}
              </Text>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-background/50 border border-white/5 rounded-xl h-9 overflow-hidden shadow-inner">
              <button
                onClick={() => handleVote("up")}
                className={cn(
                  "px-3 h-full hover:bg-emerald-500/10 transition-colors border-r border-white/5",
                  activeVote === "up"
                    ? "text-emerald-500 bg-emerald-500/5"
                    : "text-muted-foreground"
                )}
              >
                <ArrowBigUp className="h-4 w-4" />
              </button>
              <span className="px-3 text-xs font-bold font-mono text-foreground">
                {upvotes - downvotes}
              </span>
              <button
                onClick={() => handleVote("down")}
                className={cn(
                  "px-3 h-full hover:bg-destructive/10 transition-colors",
                  activeVote === "down"
                    ? "text-destructive bg-destructive/5"
                    : "text-muted-foreground"
                )}
              >
                <ArrowBigDown className="h-4 w-4" />
              </button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl text-[10px] font-bold text-muted-foreground hover:text-primary group"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1.5 group-hover:scale-110 transition-transform" />{" "}
              Reply
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Flag className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-4">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id || reply.comment_id}
              comment={reply}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
