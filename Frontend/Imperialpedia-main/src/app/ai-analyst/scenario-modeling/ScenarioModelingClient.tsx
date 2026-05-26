"use client";

import React, { useEffect, useState } from "react";
import { AssetCase } from "@/types/analytics";
import { analyticsService } from "@/services/data/analytics-service";
import { Container } from "@/design-system/layout/container";
import { Text } from "@/design-system/typography/text";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Loader2,
  Search,
  Zap,
  ShieldAlert,
  Info,
  ArrowRight,
  Activity,
  CheckCircle2,
  XCircle,
  BarChart3,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * AI Scenario Modeler Client.
 * Specialized tool for visualizing side-by-side Bull and Bear cases for indexed assets.
 */
export function ScenarioModelingClient() {
  const [cases, setCases] = useState<AssetCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getAssetCases();
        if (response.data) setCases(response.data);
      } catch (e) {
        console.error("Failed to sync case matrix", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    setGenerating(true);
    // Simulate complex dual-case synthesis
    await new Promise((r) => setTimeout(r, 1500));
    setGenerating(false);

    toast({
      title: "Scenarios Synchronized",
      description: `Dual-case analysis for ${search.toUpperCase()} has been generated.`,
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
          Calibrating Probability Nodes...
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Sparkles className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Decision Intelligence
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            Scenario Modeler
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Synthesizing side-by-side market outcomes for indexed assets.
          </Text>
        </div>

        <form onSubmit={handleGenerate} className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Enter asset symbol..."
              className="pl-10 bg-card/30 border-white/10 h-11 rounded-xl font-bold uppercase"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            disabled={generating || !search.trim()}
            className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20"
          >
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Generate Dual Case
          </Button>
        </form>
      </header>

      {cases.map((asset) => (
        <div key={asset.symbol} className="space-y-8">
          <div className="flex items-center gap-4 px-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <Text variant="h2" className="text-2xl font-bold">
                {asset.asset_name}
              </Text>
              <Text
                variant="caption"
                className="text-muted-foreground font-mono uppercase tracking-widest"
              >
                Node ID: {asset.symbol}
              </Text>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bull Case Panel */}
            <Card className="glass-card border-none shadow-2xl overflow-hidden group hover:border-emerald-500/30 transition-all">
              <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/10 p-8">
                <div className="flex justify-between items-center mb-4">
                  <Badge className="bg-emerald-500 text-white border-none font-bold uppercase text-[9px] px-3 h-6">
                    Bullish Scenario
                  </Badge>
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <CardTitle className="text-xl font-bold leading-relaxed italic">
                  "{asset.bull_case.summary}"
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <Text
                    variant="label"
                    className="text-[10px] text-muted-foreground font-bold tracking-widest"
                  >
                    Growth Driver Nodes
                  </Text>
                  <div className="grid grid-cols-1 gap-3">
                    {asset.bull_case.key_drivers?.map(
                      (driver: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-white/5 group/item"
                        >
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </div>
                          <Text
                            variant="bodySmall"
                            className="text-foreground/80"
                          >
                            {driver}
                          </Text>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-end">
                    <Text
                      variant="label"
                      className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest"
                    >
                      Audit Probability
                    </Text>
                    <span className="text-3xl font-bold text-foreground">
                      {Math.round(asset.bull_case.confidence_score * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={asset.bull_case.confidence_score * 100}
                    className="h-1.5 bg-white/5"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bear Case Panel */}
            <Card className="glass-card border-none shadow-2xl overflow-hidden group hover:border-destructive/30 transition-all">
              <CardHeader className="bg-destructive/5 border-b border-destructive/10 p-8">
                <div className="flex justify-between items-center mb-4">
                  <Badge
                    variant="destructive"
                    className="border-none font-bold uppercase text-[9px] px-3 h-6"
                  >
                    Bearish Scenario
                  </Badge>
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
                <CardTitle className="text-xl font-bold leading-relaxed italic">
                  "{asset.bear_case.summary}"
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <Text
                    variant="label"
                    className="text-[10px] text-muted-foreground font-bold tracking-widest"
                  >
                    Structural Risk Nodes
                  </Text>
                  <div className="grid grid-cols-1 gap-3">
                    {asset.bear_case.key_risks?.map((risk: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-white/5 group/item"
                      >
                        <div className="p-1.5 rounded-lg bg-destructive/10 text-destructive group-hover/item:bg-destructive group-hover/item:text-white transition-all">
                          <XCircle className="h-3.5 w-3.5" />
                        </div>
                        <Text
                          variant="bodySmall"
                          className="text-foreground/80"
                        >
                          {risk}
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-end">
                    <Text
                      variant="label"
                      className="text-[10px] font-bold text-destructive uppercase tracking-widest"
                    >
                      Audit Probability
                    </Text>
                    <span className="text-3xl font-bold text-foreground">
                      {Math.round(asset.bear_case.confidence_score * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={asset.bear_case.confidence_score * 100}
                    className="h-1.5 bg-white/5"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}

      {/* Strategic Directive Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card bg-primary/5 border-primary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-primary/10 w-fit text-primary">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">
              Scenario Weighting
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed"
            >
              These models are synthesized using standard **Institutional
              Logic**. Probabilities are weighted against current central bank
              liquidity buffers and trailing 12-month volatility clusters.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-secondary/20 p-8 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Activity className="h-24 w-24 text-secondary rotate-12" />
          </div>
          <div className="p-4 rounded-[2rem] bg-secondary/10 w-fit text-secondary">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">
              Execution Integrity
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed"
            >
              Always cross-reference dual scenarios with the **Catalyst
              Detection** node before assigning capital. Real-time shifts in
              social sentiment can pivot probability weights in under 15
              minutes.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
