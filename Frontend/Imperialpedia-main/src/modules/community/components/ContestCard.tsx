"use client";

import React from "react";
import { PredictionContest } from "@/types/community";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Text } from "@/design-system/typography/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Users,
  Clock,
  ArrowRight,
  Zap,
  Layers,
  ChevronRight,
  Sparkles,
  Lock,
  Medal,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ContestCardProps {
  contest: PredictionContest;
}

/**
 * A high-fidelity card component for community prediction contests.
 * Enhanced for Prompt 38 with leaderboard snapshots and prize info.
 */
export function ContestCard({ contest }: ContestCardProps) {
  const isUpcoming = contest.status === "Upcoming";
  const isClosed = contest.status === "Completed";
  const isOngoing = contest.status === "Active";

  return (
    <Card
      className={cn(
        "glass-card border-none transition-all duration-500 hover:translate-y-[-6px] group flex flex-col h-full",
        isOngoing
          ? "ring-1 ring-primary/30 shadow-2xl shadow-primary/5"
          : "opacity-90"
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-4">
          <Badge
            className={cn(
              "border-none text-[9px] font-bold uppercase px-3 h-6",
              isOngoing
                ? "bg-emerald-500 text-white"
                : isUpcoming
                ? "bg-amber-500/10 text-amber-500"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isOngoing ? (
              <span className="flex items-center gap-1">
                <Activity className="h-2.5 w-2.5" /> Ongoing
              </span>
            ) : (
              contest.status
            )}
          </Badge>
          <div className="p-2 rounded-lg bg-background/50 border border-white/5 group-hover:bg-primary/10 transition-colors">
            <Trophy
              className={cn(
                "h-4 w-4",
                isOngoing
                  ? "text-primary group-hover:scale-110 transition-transform"
                  : "text-muted-foreground"
              )}
            />
          </div>
        </div>
        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors leading-tight">
          {contest.title}
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed mt-2 line-clamp-2 italic">
          "{contest.description}"
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 flex-grow">
        {/* Involved Assets */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Layers className="h-3 w-3 text-muted-foreground" />
            <Text
              variant="label"
              className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest"
            >
              Asset Nodes
            </Text>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {contest.assets?.map((asset) => (
              <Badge
                key={asset}
                variant="secondary"
                className="bg-primary/5 text-primary border-none text-[9px] font-bold px-2 py-0.5"
              >
                {asset}
              </Badge>
            )) || (
              <Badge
                variant="secondary"
                className="bg-muted/20 text-muted-foreground border-none text-[9px] font-bold px-2 py-0.5"
              >
                No assets specified
              </Badge>
            )}
          </div>
        </div>

        {/* Top Participants Leaderboard */}
        {!isUpcoming && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <Text
                variant="label"
                className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest"
              >
                Leaderboard Snapshot
              </Text>
              <Medal className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="space-y-2">
              {typeof contest.participants === "number" ? (
                <div className="text-center py-4 text-[10px] text-muted-foreground italic border border-dashed rounded-xl border-white/10">
                  {contest.participants} participants registered
                </div>
              ) : (
                <div className="text-center py-4 text-[10px] text-muted-foreground italic border border-dashed rounded-xl border-white/10">
                  Awaiting first forecast nodes...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prize Pool */}
        {contest.prize && (
          <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/20 relative overflow-hidden group/prize">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/prize:scale-125 transition-transform">
              <Sparkles className="h-8 w-8 text-secondary" />
            </div>
            <Text
              variant="label"
              className="text-secondary text-[9px] font-bold uppercase mb-1.5 block tracking-widest"
            >
              Prize Reward
            </Text>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-secondary/10 text-secondary">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <Text
                variant="caption"
                className="font-bold text-foreground leading-snug"
              >
                {contest.prize}
              </Text>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 pt-0 border-t border-white/5 mt-auto bg-muted/10">
        <div className="flex flex-col sm:flex-row items-center justify-between w-full pt-4 gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
            <Clock className="h-3 w-3" />
            {isClosed ? (
              <span className="text-muted-foreground">Audit Finalized</span>
            ) : (
              <span>
                {isOngoing ? "Ends" : "Starts"}{" "}
                {contest.endDate || contest.startDate || "Soon"}
              </span>
            )}
          </div>

          <Button
            disabled={isClosed}
            className={cn(
              "w-full sm:w-auto h-9 px-6 rounded-xl text-xs font-bold transition-all shadow-lg",
              isOngoing
                ? "bg-primary hover:bg-primary/90 shadow-primary/20"
                : isUpcoming
                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-none"
                : "bg-muted text-muted-foreground shadow-none"
            )}
          >
            {isUpcoming ? (
              <>
                <Lock className="h-3 w-3 mr-1.5" /> Upcoming
              </>
            ) : isClosed ? (
              "View Final Audit"
            ) : (
              <span className="flex items-center gap-2">
                Participate <ChevronRight className="h-3 w-3" />
              </span>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
