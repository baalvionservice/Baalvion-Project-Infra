"use client";

import React, { useState } from "react";
import {
  compareMultiAssets,
  MultiAssetComparisonOutput,
} from "@/ai/flows/multi-asset-comparison-flow";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GitCompare,
  Loader2,
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Zap,
  Info,
  ArrowRight,
  Target,
  BarChart3,
  ShieldCheck,
  Plus,
  Trash2,
  Layers,
  Activity,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * AI Multi-Asset Comparison Dashboard.
 * Specialized tool for simultaneous analysis of 3 or more assets.
 */
export default function MultiAssetComparisonPage() {
  const [assets, setAssets] = useState<string[]>(["", "", ""]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MultiAssetComparisonOutput | null>(null);

  const addAssetInput = () => {
    setAssets([...assets, ""]);
  };

  const removeAssetInput = (index: number) => {
    if (assets.length > 3) {
      const newAssets = [...assets];
      newAssets.splice(index, 1);
      setAssets(newAssets);
    } else {
      toast({
        title: "Minimum Nodes Required",
        description:
          "Multi-asset comparison requires at least 3 nodes for statistical significance.",
        variant: "destructive",
      });
    }
  };

  const updateAssetInput = (index: number, value: string) => {
    const newAssets = [...assets];
    newAssets[index] = value;
    setAssets(newAssets);
  };

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAssets = assets.map((a) => a.trim()).filter((a) => a !== "");

    if (cleanAssets.length < 3) {
      toast({
        title: "Incomplete Matrix",
        description: "Please provide at least 3 asset symbols.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const output = await compareMultiAssets({ assets: cleanAssets });
      setResult(output);
      toast({
        title: "Intelligence Synchronized",
        description: `Multi-asset audit for ${cleanAssets.length} nodes is complete.`,
      });
    } catch (error) {
      console.error("AI Multi-Comparison failure", error);
      toast({
        variant: "destructive",
        title: "Audit Exception",
        description:
          "The AI engine encountered an error while synthesizing the multi-asset matrix.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCompact = (val: number) =>
    new Intl.NumberFormat("en-US", { notation: "compact" }).format(val);

  return (
    <main className="min-h-screen bg-background pb-20 pt-12">
      <Container>
        <header className="mb-12 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
            <Layers className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold uppercase tracking-widest"
            >
              Multi-Asset Architect
            </Text>
          </div>
          <Text
            variant="h1"
            className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight"
          >
            AI Multi-Compare
          </Text>
          <Text
            variant="body"
            className="text-muted-foreground text-lg leading-relaxed"
          >
            Duel multiple assets in a single matrix. Model performance variance,
            risk scores, and AI-driven allocation strategy for complex
            portfolios.
          </Text>
        </header>

        <div className="max-w-4xl mx-auto mb-16">
          <Card className="glass-card shadow-2xl border-white/10 overflow-hidden">
            <CardContent className="p-8">
              <form onSubmit={handleCompare} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assets.map((asset, idx) => (
                    <div
                      key={idx}
                      className="relative group animate-in fade-in zoom-in duration-300"
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            placeholder={`Asset ${idx + 1} (e.g. NVDA)`}
                            value={asset}
                            onChange={(e) =>
                              updateAssetInput(idx, e.target.value)
                            }
                            className="h-12 pl-10 bg-background/50 border-white/10 rounded-xl font-bold uppercase"
                            disabled={loading}
                          />
                        </div>
                        {assets.length > 3 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => removeAssetInput(idx)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 border-dashed border-white/20 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
                    onClick={addAssetInput}
                    disabled={loading || assets.length >= 6}
                  >
                    <Plus className="h-4 w-4" /> Add Asset Node
                  </Button>
                </div>

                <Button
                  size="lg"
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all scale-[1.01] active:scale-100"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  ) : (
                    <GitCompare className="mr-2 h-5 w-5" />
                  )}
                  {loading
                    ? "Orchestrating Matrix..."
                    : "Compare Portfolio Nodes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {loading && !result && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="w-24 h-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 relative">
              <div className="absolute inset-0 rounded-[2.5rem] border-2 border-primary/20 animate-ping opacity-20" />
              <Layers className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <Text variant="h3" className="font-bold mb-2 text-primary">
              Synthesizing Group Intelligence
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground text-center max-w-sm"
            >
              Analyzing correlated growth, risk-parity benchmarks, and sentiment
              variance across the matrix...
            </Text>
          </div>
        )}

        {result && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Overview & Recommendation Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <Card className="glass-card border-none bg-primary/5 shadow-xl h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Info className="h-4 w-4" />
                      <Text
                        variant="label"
                        className="text-[10px] font-bold uppercase tracking-widest"
                      >
                        Global Overview
                      </Text>
                    </div>
                    <CardTitle className="text-2xl font-bold leading-tight italic">
                      "{result.overview}"
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
              <div className="lg:col-span-4">
                <Card className="glass-card border-none bg-emerald-500/5 border-emerald-500/20 shadow-xl h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Target className="h-16 w-16 text-emerald-500" />
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2 text-emerald-500 mb-2">
                      <Zap className="h-4 w-4" />
                      <Text
                        variant="label"
                        className="text-[10px] font-bold uppercase tracking-widest"
                      >
                        Allocation Verdict
                      </Text>
                    </div>
                    <CardTitle className="text-xl font-bold">
                      {result.portfolio_recommendation}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </div>

            {/* Metrics Comparison Matrix */}
            <Card className="glass-card border-none shadow-2xl overflow-hidden">
              <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-primary" /> Matrix
                    Comparison Hub
                  </CardTitle>
                  <CardDescription>
                    Side-by-side performance benchmarks for all indexed nodes.
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="flex justify-between items-end mb-2 gap-4">
                    <Text variant="label" className="text-[10px] opacity-50">
                      Audit Conviction
                    </Text>
                    <span className="text-2xl font-bold text-primary">
                      {result.confidence_score}%
                    </span>
                  </div>
                  <Progress
                    value={result.confidence_score}
                    className="h-1.5 w-32 bg-muted/20"
                  />
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                      <TableHead className="pl-8 font-bold uppercase text-[10px] tracking-widest py-6">
                        Asset Node
                      </TableHead>
                      <TableHead className="text-center font-bold uppercase text-[10px] tracking-widest">
                        Price
                      </TableHead>
                      <TableHead className="text-center font-bold uppercase text-[10px] tracking-widest">
                        Market Cap
                      </TableHead>
                      <TableHead className="text-center font-bold uppercase text-[10px] tracking-widest">
                        P/E Ratio
                      </TableHead>
                      <TableHead className="text-center font-bold uppercase text-[10px] tracking-widest">
                        Sentiment
                      </TableHead>
                      <TableHead className="text-center font-bold uppercase text-[10px] tracking-widest">
                        Trajectory
                      </TableHead>
                      <TableHead className="text-right pr-8 font-bold uppercase text-[10px] tracking-widest">
                        Risk
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.key_metrics_table.map((row, idx) => (
                      <TableRow
                        key={idx}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <TableCell className="pl-8 py-6">
                          <Text
                            variant="body"
                            className="font-bold text-primary"
                          >
                            {row.asset}
                          </Text>
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold">
                          {row.price}
                        </TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {row.market_cap}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {row.PE_ratio}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="border-secondary/20 bg-secondary/5 text-secondary text-[10px] font-bold"
                          >
                            {row.sentiment_score}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1 text-[10px] font-bold">
                            {row.performance_trends.includes("+") ? (
                              <TrendingUp className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-destructive" />
                            )}
                            {row.performance_trends}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Badge
                            className={cn(
                              "uppercase text-[9px] font-bold px-2 py-0.5",
                              row.risk_score === "High"
                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                : row.risk_score === "Medium"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            )}
                          >
                            {row.risk_score}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Individual Strength/Weakness Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {result.strengths_weaknesses.map((sw, idx) => (
                <Card
                  key={idx}
                  className="glass-card border-none shadow-xl flex flex-col group hover:border-primary/20 transition-all"
                >
                  <CardHeader className="bg-card/30 border-b border-white/5">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg font-bold">
                        {sw.asset} Profile
                      </span>
                      <Badge
                        variant="outline"
                        className="border-white/10 uppercase text-[9px] font-bold"
                      >
                        Node #{idx + 1}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6 flex-grow">
                    <div className="space-y-3">
                      <Text
                        variant="label"
                        className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest"
                      >
                        Competitive Edge
                      </Text>
                      {sw.strengths.map((s, i) => (
                        <div
                          key={i}
                          className="flex gap-3 items-start group/item"
                        >
                          <div className="mt-1 w-4 h-4 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover/item:scale-110 transition-transform">
                            <TrendingUp className="h-2.5 w-2.5" />
                          </div>
                          <Text
                            variant="caption"
                            className="text-muted-foreground leading-relaxed"
                          >
                            {s}
                          </Text>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <Text
                        variant="label"
                        className="text-[10px] text-destructive font-bold uppercase tracking-widest"
                      >
                        Structural Friction
                      </Text>
                      {sw.weaknesses.map((w, i) => (
                        <div
                          key={i}
                          className="flex gap-3 items-start group/item"
                        >
                          <div className="mt-1 w-4 h-4 rounded bg-destructive/10 flex items-center justify-center text-destructive group-hover/item:scale-110 transition-transform">
                            <AlertCircle className="h-2.5 w-2.5" />
                          </div>
                          <Text
                            variant="caption"
                            className="text-muted-foreground leading-relaxed"
                          >
                            {w}
                          </Text>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 bg-muted/10 flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5"
                      asChild
                    >
                      <a href={`/ai-analyst/bull-case?asset=${sw.asset}`}>
                        Detailed Analysis
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Strategic Footer */}
            <div className="p-8 rounded-[3rem] border border-secondary/20 bg-secondary/5 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Sparkles className="h-32 w-32 text-secondary" />
              </div>
              <div className="p-4 rounded-3xl bg-secondary/10 text-secondary shrink-0">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <div className="flex-1 space-y-2">
                <Text variant="h4" className="font-bold">
                  E-E-A-T Verified Audit
                </Text>
                <Text
                  variant="bodySmall"
                  className="text-muted-foreground leading-relaxed max-w-2xl"
                >
                  This comparison matrix is synthesized across the Imperialpedia
                  Index, weighting historical return correlations, institutional
                  liquidity depth, and real-time social narratives. Always
                  consult with a verified fiduciary before executing rebalancing
                  strategies.
                </Text>
              </div>
              <Button
                size="lg"
                className="h-12 px-8 rounded-xl font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-xl shadow-secondary/20 shrink-0"
              >
                Generate Weekly Digest
              </Button>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
