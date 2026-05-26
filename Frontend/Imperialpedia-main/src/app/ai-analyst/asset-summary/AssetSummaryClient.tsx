"use client";

import React, { useEffect, useState } from "react";
import { AssetSummary } from "@/types/analytics";
import { analyticsService } from "@/services/data/analytics-service";
import { Container } from "@/design-system/layout/container";
import { Text } from "@/design-system/typography/text";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Info,
  Zap,
  ArrowRight,
  Globe,
  Activity,
  Loader2,
  Sparkles,
  BarChart3,
  Target,
  Search,
  RefreshCw,
  Flame,
  ShieldAlert,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis } from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

/**
 * AI Asset Summary Client Hub.
 * Specialized tool for visualizing consolidated intelligence for specific financial nodes.
 */
export function AssetSummaryClient() {
  const [summaries, setSummaries] = useState<AssetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getAssetSummaries();
        if (response.data) setSummaries(response.data);
      } catch (e) {
        console.error("Failed to sync asset intelligence", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = summaries.filter(
    (s) =>
      s.asset_name.toLowerCase().includes(search.toLowerCase()) ||
      s.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const getRiskBadge = (flag: string) => {
    switch (flag) {
      case "High":
        return (
          <Badge
            variant="destructive"
            className="font-bold uppercase text-[9px] px-2 h-5"
          >
            High Risk
          </Badge>
        );
      case "Moderate":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold uppercase text-[9px] px-2 h-5">
            Moderate
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-emerald-500 border-emerald-500/20 bg-emerald-500/5 font-bold uppercase text-[9px] px-2 h-5"
          >
            Stable
          </Badge>
        );
    }
  };

  const getSentimentLabel = (val: number) => {
    if (val > 0.7)
      return { label: "Strong Bullish", color: "text-emerald-500" };
    if (val > 0.5) return { label: "Bullish", color: "text-primary" };
    if (val > 0.3) return { label: "Neutral", color: "text-muted-foreground" };
    return { label: "Bearish", color: "text-destructive" };
  };

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text
          variant="bodySmall"
          className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground"
        >
          Establishing Analyst Handshake...
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Sparkles className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Intelligence Consolidation
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            AI Asset Summary
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Real-time synthesis of market data and institutional research for
            individual nodes.
          </Text>
        </div>

        <div className="relative w-full md:w-72 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search indexed assets..."
            className="pl-10 bg-card/30 border-white/10 h-11 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="py-32 text-center border-2 border-dashed rounded-[3rem] border-white/5 bg-card/10">
          <Text variant="bodySmall" className="text-muted-foreground italic">
            No matching asset nodes localized in the current discovery buffer.
          </Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {filtered.map((asset) => (
            <Card
              key={asset.symbol}
              className="glass-card border-none shadow-2xl overflow-hidden group hover:border-primary/20 transition-all duration-500"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Market Metric Panel */}
                <div className="lg:col-span-4 p-8 bg-card/30 border-r border-white/5 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <Text variant="h2" className="text-2xl font-bold">
                          {asset.asset_name}
                        </Text>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] border-white/10 bg-background/50"
                        >
                          {asset.symbol}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <span className="text-4xl font-bold tracking-tighter">
                          ${asset.current_price.toLocaleString()}
                        </span>
                        <div
                          className={cn(
                            "flex items-center text-xs font-bold px-2 py-0.5 rounded-lg",
                            asset.daily_change_pct >= 0
                              ? "text-emerald-500 bg-emerald-500/10"
                              : "text-destructive bg-destructive/10"
                          )}
                        >
                          {asset.daily_change_pct >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(asset.daily_change_pct)}%
                        </div>
                      </div>
                    </div>
                    {getRiskBadge(asset.risk_flag)}
                  </div>

                  {asset.price_history && (
                    <div className="h-24 w-full opacity-50 group-hover:opacity-100 transition-opacity">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={asset.price_history}>
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke={
                              asset.daily_change_pct >= 0
                                ? "#10b981"
                                : "#ef4444"
                            }
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    <div>
                      <Text
                        variant="label"
                        className="text-[9px] opacity-50 uppercase font-bold tracking-widest block mb-1"
                      >
                        Market Cap
                      </Text>
                      <Text variant="bodySmall" weight="bold">
                        {asset.market_cap}
                      </Text>
                    </div>
                    <div>
                      <Text
                        variant="label"
                        className="text-[9px] opacity-50 uppercase font-bold tracking-widest block mb-1"
                      >
                        24h Volume
                      </Text>
                      <Text variant="bodySmall" weight="bold">
                        {(asset.volume / 1000000).toFixed(1)}M
                      </Text>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end mb-1">
                      <Text
                        variant="label"
                        className="text-[10px] text-muted-foreground font-bold"
                      >
                        Analyst Confidence
                      </Text>
                      <span className="text-sm font-bold text-primary">
                        {Math.round(asset.ai_insights.confidence_score * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={asset.ai_insights.confidence_score * 100}
                      className="h-1 bg-white/5"
                    />
                  </div>
                </div>

                {/* AI Insights Panel */}
                <div className="lg:col-span-8 p-8 space-y-8 relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Bull Case */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest">
                        <TrendingUp className="h-4 w-4" /> Strategic Bull Case
                      </div>
                      <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 italic text-sm text-muted-foreground leading-relaxed h-full">
                        "{asset.ai_insights.bull_case}"
                      </div>
                    </div>

                    {/* Bear Case */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-destructive font-bold text-xs uppercase tracking-widest">
                        <TrendingDown className="h-4 w-4" /> Strategic Bear Case
                      </div>
                      <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/10 italic text-sm text-muted-foreground leading-relaxed h-full">
                        "{asset.ai_insights.bear_case}"
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-white/5">
                    {/* Catalyst Node */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                        <Zap className="h-4 w-4" /> Key Market Catalysts
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {asset.ai_insights.catalysts.map(
                          (cat: any, i: number) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 border border-white/10 group/cat"
                            >
                              <div className="w-1 h-1 rounded-full bg-primary" />
                              <Text
                                variant="caption"
                                className="font-bold group-hover/cat:text-primary transition-colors"
                              >
                                {cat}
                              </Text>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Sentiment Node */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-widest">
                        <Activity className="h-4 w-4" /> Social Pulse
                      </div>
                      <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/10 flex flex-col items-center text-center justify-center">
                        <span
                          className={cn(
                            "text-xl font-bold mb-1",
                            getSentimentLabel(
                              asset.ai_insights.social_sentiment
                            ).color
                          )}
                        >
                          {
                            getSentimentLabel(
                              asset.ai_insights.social_sentiment
                            ).label
                          }
                        </span>
                        <Text
                          variant="caption"
                          className="text-muted-foreground uppercase font-bold text-[8px] tracking-tighter"
                        >
                          Index: {asset.ai_insights.social_sentiment.toFixed(2)}
                        </Text>
                      </div>
                    </div>
                  </div>

                  <CardFooter className="absolute bottom-4 right-4 p-0">
                    <Button
                      variant="ghost"
                      className="text-primary font-bold text-xs group/btn"
                      asChild
                    >
                      <a
                        href={`/articles/${asset.symbol.toLowerCase()}-deep-dive`}
                      >
                        Access Research Node{" "}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </a>
                    </Button>
                  </CardFooter>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Global Context Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card bg-primary/5 border-primary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-primary/10 w-fit text-primary">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">
              Vulnerability Logic
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed"
            >
              Asset risk flags are calculated using a weighted matrix of
              **Longitudinal Volatility**, **Social Sentiment Decay**, and
              **Liquidity Depth Anomalies**. A 'High' flag suggests a decoupling
              from fundamental benchmarks.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-secondary/20 p-8 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Globe className="h-24 w-24 text-secondary rotate-12" />
          </div>
          <div className="p-4 rounded-[2rem] bg-secondary/10 w-fit text-secondary">
            <Target className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">
              Intelligence Feed
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed"
            >
              These summaries are synchronized with the **Institutional Data
              Node** every 15 minutes. Analyst conviction scores are refined in
              real-time as new regulatory filings and market wires are ingested
              into the index.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
