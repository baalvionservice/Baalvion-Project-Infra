"use client";

import React from "react";
import { UserPrediction } from "@/types/community";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Text } from "@/design-system/typography/text";
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  TrendingUp,
  ArrowRight,
  Zap,
  Layers,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PredictionHistoryProps {
  predictions: UserPrediction[];
}

/**
 * User Prediction Ledger Hub.
 * Archives historical forecasts and tracks aggregate reputation node accumulation.
 */
export function PredictionHistory({ predictions }: PredictionHistoryProps) {
  const getResultBadge = (result: string) => {
    switch (result) {
      case "Correct":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-3">
            <CheckCircle2 className="h-2.5 w-2.5" /> Correct
          </Badge>
        );
      case "Incorrect":
        return (
          <Badge
            variant="destructive"
            className="gap-1.5 font-bold uppercase text-[9px] h-6 px-3"
          >
            <XCircle className="h-2.5 w-2.5" /> Incorrect
          </Badge>
        );
      case "Pending":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-3">
            <Clock className="h-2.5 w-2.5 animate-pulse" /> Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{result}</Badge>;
    }
  };

  const aggregatePoints = predictions.reduce(
    (acc, curr) => acc + curr.points,
    0
  );
  const accuracyRate = (
    (predictions.filter((p) => p.result === "Correct").length /
      predictions.filter((p) => p.result !== "Pending").length) *
    100
  ).toFixed(1);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Aggregate Performance Vitals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl bg-primary/5 group hover:border-primary/20 transition-all">
          <CardContent className="p-6 space-y-2">
            <Text
              variant="label"
              className="text-[9px] opacity-50 uppercase font-bold tracking-widest text-primary"
            >
              Cumulative Alpha
            </Text>
            <div className="text-3xl font-bold tracking-tighter text-primary">
              +{aggregatePoints}
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground block text-[10px]"
            >
              Reputation Nodes Earned
            </Text>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl group hover:border-emerald-500/20 transition-all">
          <CardContent className="p-6 space-y-2">
            <Text
              variant="label"
              className="text-[9px] opacity-50 uppercase font-bold tracking-widest text-emerald-500"
            >
              Precision Ratio
            </Text>
            <div className="text-3xl font-bold tracking-tighter text-emerald-500">
              {isNaN(Number(accuracyRate)) ? "0" : accuracyRate}%
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground block text-[10px]"
            >
              Historical Accuracy Node
            </Text>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardContent className="p-6 space-y-2">
            <Text
              variant="label"
              className="text-[9px] opacity-50 uppercase font-bold tracking-widest"
            >
              Active Forecasts
            </Text>
            <div className="text-3xl font-bold tracking-tighter">
              {predictions.filter((p) => p.result === "Pending").length}
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground block text-[10px]"
            >
              Awaiting Data Handshake
            </Text>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl bg-secondary/5">
          <CardContent className="p-6 space-y-2">
            <Text
              variant="label"
              className="text-[9px] opacity-50 uppercase font-bold tracking-widest text-secondary"
            >
              Global Rank
            </Text>
            <div className="text-3xl font-bold tracking-tighter text-secondary">
              #124
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground block text-[10px]"
            >
              Top 5% of Analysts
            </Text>
          </CardContent>
        </Card>
      </div>

      {/* Prediction Table */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <History className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Prediction Archive</CardTitle>
              <CardDescription>
                Chronological ledger of your crowdsourced intelligence nodes.
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-secondary/10 text-secondary border-secondary/20">
            VERIFIED LEDGER
          </Badge>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b border-white/5">
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                  Contest Narrative
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                  Forecast Value
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Settlement Status
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Yield (Nodes)
                </TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                  Achieved Rank
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {predictions.map((pred) => (
                <TableRow
                  key={pred.id}
                  className="group hover:bg-white/5 transition-colors border-b border-white/5"
                >
                  <TableCell className="py-5 pl-8">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground/90">
                        {pred.contestName}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono uppercase mt-1">
                        Asset: {pred.asset} • {pred.date}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-background/50 border-white/5 font-mono text-xs font-bold text-primary px-3 h-7"
                      >
                        {pred.prediction}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {getResultBadge(pred.result)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <span
                        className={cn(
                          "text-sm font-mono font-bold",
                          pred.points > 0
                            ? "text-emerald-500"
                            : "text-muted-foreground opacity-50"
                        )}
                      >
                        {pred.points > 0 ? `+${pred.points}` : "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    {pred.rank ? (
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-foreground">
                          #{pred.rank}
                        </span>
                        <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">
                          Final Placement
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Pending
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Dynamic Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card bg-primary/5 border-primary/20 p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <Sparkles className="h-32 w-32 text-primary" />
          </div>
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Zap className="h-6 w-6" />
              </div>
              <Text variant="h4" className="font-bold">
                Next Reputation Unlock
              </Text>
            </div>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed italic"
            >
              "Your current precision score is in the 95th percentile. Win **2
              more contests** to unlock the 'Institutional Oracle' badge and 500
              bonus nodes."
            </Text>
            <div className="pt-2">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Badge Progress
                </span>
                <span className="text-xs font-bold">3 / 5 Wins</span>
              </div>
              <Progress value={60} className="h-1.5 bg-white/5" />
            </div>
          </div>
        </Card>

        <Card className="glass-card border-secondary/20 p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <Layers className="h-32 w-32 text-secondary" />
          </div>
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-secondary/10 text-secondary">
                <Activity className="h-6 w-6" />
              </div>
              <Text variant="h4" className="font-bold">
                Strategy Audit
              </Text>
            </div>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed"
            >
              Analyzing your history: Your forecasts for **Crypto** nodes are
              2.4x more accurate than **Equities**. Consider focusing on DeFi
              contests to maximize yield.
            </Text>
            <Button
              variant="outline"
              className="rounded-xl h-10 px-6 border-secondary/30 text-secondary font-bold text-xs"
              asChild
            >
              <a href="/community/contests">Enter New Contest</a>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
