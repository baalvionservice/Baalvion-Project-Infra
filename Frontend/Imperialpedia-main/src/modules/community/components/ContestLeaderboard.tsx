"use client";

import React from "react";
import { ContestLeaderboardEntry } from "@/types/community";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/design-system/typography/text";
import {
  Trophy,
  Medal,
  Zap,
  Activity,
  Target,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ContestLeaderboardProps {
  entries: ContestLeaderboardEntry[];
  title?: string;
}

/**
 * Specialized leaderboard for prediction contests.
 * Tracks forecast precision and earned reputation nodes.
 */
export function ContestLeaderboard({
  entries,
  title = "Contest Leaderboard",
}: ContestLeaderboardProps) {
  return (
    <Card className="glass-card border-none shadow-2xl overflow-hidden">
      <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <Text
              variant="caption"
              className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
            >
              Global Forecast Precision
            </Text>
          </div>
        </div>
        <Badge
          variant="outline"
          className="border-white/10 bg-background/30 text-[10px] font-bold uppercase px-3 h-7"
        >
          Top 20 Indexed
        </Badge>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20 border-b border-white/5">
              <TableHead className="w-20 text-center font-bold text-[10px] uppercase tracking-widest py-6">
                Rank
              </TableHead>
              <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest">
                Participant Node
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                Forecast Value
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                Precision Score
              </TableHead>
              <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                Reputation Nodes
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow
                key={entry.user}
                className="group hover:bg-white/5 transition-colors border-b border-white/5"
              >
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    {entry.rank === 1 ? (
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-900/40">
                        <Trophy className="h-4 w-4" />
                      </div>
                    ) : entry.rank <= 3 ? (
                      <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center border border-white/10">
                        <Medal className="h-4 w-4" />
                      </div>
                    ) : (
                      <span className="font-mono font-bold text-muted-foreground opacity-50">
                        #{entry.rank}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-5 pl-8">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 rounded-[1.25rem] border-2 border-background ring-1 ring-white/5 group-hover:border-primary/30 transition-all">
                      <AvatarImage src={entry.avatar} />
                      <AvatarFallback>{entry.user.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-bold group-hover:text-primary transition-colors">
                      {entry.user}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <span className="font-mono text-xs font-bold text-foreground/80">
                      {entry.prediction}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-xs font-bold font-mono text-emerald-500">
                      {entry.accuracy}
                    </span>
                    <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: entry.accuracy }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right pr-8">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-primary">
                      +{entry.points}
                    </span>
                    <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">
                      Settled
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <CardFooter className="p-6 bg-muted/10 border-t border-white/5 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary group"
        >
          View Global Precision Matrix{" "}
          <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}
