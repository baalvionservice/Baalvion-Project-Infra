"use client";

import React, { useState } from "react";
import Link from "next/link";
import { generateBullCase, BullCaseOutput } from "@/ai/flows/bull-case-flow";
import { Container } from "@/design-system/layout/container";
import { Text } from "@/design-system/typography/text";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Sparkles,
  Loader2,
  ArrowRight,
  Target,
  BarChart3,
  Activity,
  MessageSquare,
  Search,
  CheckCircle2,
  Zap,
  Info,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

/**
 * AI Bull Case Generator Dashboard.
 * Specialized tool for generating structured, AI-driven bullish scenarios.
 */
export default function BullCaseGeneratorPage() {
  const [asset, setAsset] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BullCaseOutput | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const output = await generateBullCase({ asset });
      setResult(output);
      toast({
        title: "Intelligence Generated",
        description: `Bull case for ${asset.toUpperCase()} is ready for review.`,
      });
    } catch (error) {
      console.error("AI Analyst failure", error);
      toast({
        variant: "destructive",
        title: "Generation Error",
        description:
          "The AI engine encountered an exception. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20 pt-12">
      <Container>
        <header className="mb-12 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
            <Zap className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold">
              Advanced Analyst Engine
            </Text>
          </div>
          <Text
            variant="h1"
            className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight"
          >
            Bull Case Generator
          </Text>
          <Text
            variant="body"
            className="text-muted-foreground text-lg leading-relaxed"
          >
            Generate high-fidelity, data-driven bullish scenarios for any
            financial asset using the Imperialpedia AI Index.
          </Text>
        </header>

        <div className="max-w-2xl mx-auto mb-16">
          <Card className="glass-card shadow-2xl border-primary/20 overflow-hidden">
            <CardContent className="p-6">
              <form onSubmit={handleGenerate} className="flex gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Enter asset symbol (e.g. BTC, NVDA, Gold)..."
                    value={asset}
                    onChange={(e) => setAsset(e.target.value)}
                    className="h-14 pl-12 bg-background/50 border-white/10 rounded-2xl text-lg"
                    disabled={loading}
                  />
                </div>
                <Button
                  size="lg"
                  type="submit"
                  disabled={loading || !asset.trim()}
                  className="h-14 px-8 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all scale-[1.02] active:scale-100"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                  )}
                  {loading ? "Analyzing..." : "Generate Case"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {loading && !result && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <Text variant="h3" className="font-bold mb-2">
              Synthesizing Market Data
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground text-center max-w-sm"
            >
              Traversing global liquidity clusters and sentiment nodes for{" "}
              {asset.toUpperCase()}...
            </Text>
          </div>
        )}

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Thesis & Catalysts */}
              <div className="lg:col-span-8 space-y-8">
                <Card className="glass-card border-none shadow-2xl overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-white/5 p-8">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className="bg-primary text-white border-none px-3 py-1 font-bold uppercase tracking-widest text-[10px]">
                        Market Intelligence
                      </Badge>
                      <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                        <TrendingUp className="h-4 w-4" /> Bullish Scenario
                        Active
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold leading-tight">
                      Strategic Thesis: {asset.toUpperCase()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Text
                      variant="body"
                      className="text-lg leading-relaxed text-foreground/80 italic border-l-4 border-primary/30 pl-6 mb-10"
                    >
                      {result.overview}
                    </Text>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
                        <Zap className="h-4 w-4" /> Growth Catalysts
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.catalysts.map((catalyst, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl bg-background/40 border border-white/5 flex gap-4 items-start group hover:border-primary/30 transition-colors"
                          >
                            <div className="mt-1 w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                              <CheckCircle2 className="h-3 w-3" />
                            </div>
                            <Text
                              variant="bodySmall"
                              className="text-muted-foreground group-hover:text-foreground transition-colors"
                            >
                              {catalyst}
                            </Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Price Targets Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="glass-card border-none bg-emerald-500/5 border-emerald-500/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-500">
                        <Target className="h-4 w-4" /> Short-Term Projection
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-2xl font-bold">
                        {result.expected_price_range.short_term.split(":")[0]}
                      </div>
                      <Text
                        variant="caption"
                        className="text-muted-foreground leading-relaxed"
                      >
                        {result.expected_price_range.short_term.split(":")[1] ||
                          result.expected_price_range.short_term}
                      </Text>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-none bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                        <TrendingUp className="h-4 w-4" /> Medium-Term
                        Projection
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-2xl font-bold">
                        {result.expected_price_range.medium_term.split(":")[0]}
                      </div>
                      <Text
                        variant="caption"
                        className="text-muted-foreground leading-relaxed"
                      >
                        {result.expected_price_range.medium_term.split(
                          ":"
                        )[1] || result.expected_price_range.medium_term}
                      </Text>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right Column: Confidence & Metrics */}
              <div className="lg:col-span-4 space-y-8">
                <Card className="glass-card border-none shadow-xl bg-card/30">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                      Analyst Conviction
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex justify-between items-end mb-2">
                      <div className="text-5xl font-bold tracking-tighter text-primary">
                        {result.confidence_score}
                      </div>
                      <Text variant="label" className="mb-1">
                        Score / 100
                      </Text>
                    </div>
                    <Progress
                      value={result.confidence_score}
                      className="h-3 bg-muted/20"
                    />
                    <div className="pt-4 flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <Info className="h-5 w-5 text-primary shrink-0" />
                      <Text
                        variant="caption"
                        className="italic text-muted-foreground"
                      >
                        conviction is based on current sentiment density and
                        historical return correlations.
                      </Text>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-none">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-secondary" />{" "}
                      Supporting Matrix
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">
                        <MessageSquare className="h-3 w-3" /> Sentiment Node
                      </div>
                      <div className="p-3 rounded-xl bg-background/50 border border-white/5">
                        <Text
                          variant="bodySmall"
                          className="font-bold text-secondary"
                        >
                          {result.supporting_metrics.social_sentiment}
                        </Text>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">
                        <Activity className="h-3 w-3" /> Liquidity Velocity
                      </div>
                      <div className="p-3 rounded-xl bg-background/50 border border-white/5">
                        <Text variant="bodySmall" className="font-bold">
                          {result.supporting_metrics.volume_trend}
                        </Text>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <div className="text-[10px] font-bold uppercase text-muted-foreground">
                        Fundamental KPIs
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.supporting_metrics.key_kpis.map((kpi, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="bg-secondary/10 text-secondary border-none px-2 py-0.5 text-[9px] font-bold"
                          >
                            {kpi}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="p-8 rounded-[2rem] border border-primary/20 bg-primary/5 space-y-4">
                  <Text variant="label" className="text-primary font-bold">
                    Strategic Insight
                  </Text>
                  <Text
                    variant="caption"
                    className="text-muted-foreground leading-relaxed italic"
                  >
                    "This bull case remains contingent on standard interest rate
                    stability. An unexpected hawk shift in the FOMC dots could
                    trigger a temporary re-test of support zones."
                  </Text>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary text-xs font-bold group"
                    asChild
                  >
                    <Link href="/financial-tools/portfolio">
                      Model in Portfolio Architect{" "}
                      <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
