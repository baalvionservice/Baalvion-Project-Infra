"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Text } from "@/design-system/typography/text";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Target,
  Users,
  MessageSquare,
  Zap,
  CheckCircle2,
  Star,
  Activity,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

interface AnalystPerformanceDashboardProps {
  stats: {
    engagementScore: number;
    accuracyScore: number;
    credibilityScore: number;
    totalReads: number;
  };
  performanceHistory: { month: string; articles: number; engagement: number }[];
}

/**
 * Institutional-grade performance summary for verified analysts.
 */
export function AnalystPerformanceDashboard({
  stats,
  performanceHistory,
}: AnalystPerformanceDashboardProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Credibility Node */}
        <Card className="glass-card border-none shadow-xl bg-primary/5 group hover:border-primary/30 transition-all">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tighter text-primary">
                {stats.credibilityScore}
              </div>
              <Text
                variant="label"
                className="text-[10px] opacity-50 font-bold uppercase tracking-widest"
              >
                Credibility Score
              </Text>
            </div>
            <Progress
              value={stats.credibilityScore}
              className="h-1 bg-white/5"
            />
          </CardContent>
        </Card>

        {/* Accuracy Gauge */}
        <Card className="glass-card border-none shadow-xl group hover:border-emerald-500/30 transition-all">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tighter text-emerald-500">
                {stats.accuracyScore}%
              </div>
              <Text
                variant="label"
                className="text-[10px] opacity-50 font-bold uppercase tracking-widest"
              >
                Prediction Accuracy
              </Text>
            </div>
            <Progress value={stats.accuracyScore} className="h-1 bg-white/5" />
          </CardContent>
        </Card>

        {/* Engagement Velocity */}
        <Card className="glass-card border-none shadow-xl group hover:border-secondary/30 transition-all">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
            <div className="p-3 rounded-2xl bg-secondary/10 text-secondary group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tighter text-secondary">
                {stats.engagementScore}%
              </div>
              <Text
                variant="label"
                className="text-[10px] opacity-50 font-bold uppercase tracking-widest"
              >
                Engagement Rate
              </Text>
            </div>
            <Progress
              value={stats.engagementScore}
              className="h-1 bg-white/5"
            />
          </CardContent>
        </Card>

        {/* Community Rating */}
        <Card className="glass-card border-none shadow-xl group hover:border-amber-500/30 transition-all">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tighter text-amber-500">
                4.9/5
              </div>
              <Text
                variant="label"
                className="text-[10px] opacity-50 font-bold uppercase tracking-widest"
              >
                Community Rating
              </Text>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="h-2.5 w-2.5 fill-amber-500 text-amber-500"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Performance Chart */}
        <Card className="lg:col-span-8 glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-card/30 border-b border-white/5 p-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Monthly
                Intelligence Reach
              </CardTitle>
              <CardDescription>
                Visualizing output velocity vs audience engagement.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/5 text-primary font-bold text-[10px]"
            >
              30 DAY WINDOW
            </Badge>
          </CardHeader>
          <CardContent className="p-8 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceHistory}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff05"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1C1822",
                    border: "1px solid #ffffff10",
                    borderRadius: "12px",
                  }}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Bar
                  dataKey="engagement"
                  fill="#8272F2"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Intelligence Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-none shadow-xl bg-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Zap className="h-24 w-24 text-primary" />
            </div>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Zap className="h-4 w-4" /> Top Performing Node
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Text
                variant="bodySmall"
                weight="bold"
                className="block leading-tight group-hover:text-primary transition-colors"
              >
                Global Liquidity and Stock Market Cycles
              </Text>
              <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3" /> 50.2k Reads
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> 124 Dialogue
                </div>
              </div>
              <div className="pt-4 border-t border-white/5">
                <Text
                  variant="caption"
                  className="italic text-muted-foreground leading-relaxed"
                >
                  "This research node achieved a 94% accuracy score against
                  subsequent central bank liquidity injections."
                </Text>
              </div>
            </CardContent>
          </Card>

          <div className="p-8 rounded-[2.5rem] border border-secondary/20 bg-secondary/5 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-16 w-16 text-secondary" />
            </div>
            <div className="flex items-center gap-2 text-secondary font-bold text-[10px] uppercase tracking-widest">
              <Activity className="h-4 w-4" /> Analyst Directives
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed"
            >
              Maintain high word counts and primary source citations to increase
              your **Credibility Node** reach.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
