"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  detectRiskFlags,
  RiskDetectionOutput,
} from "@/ai/flows/risk-detection-flow";
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
  ShieldAlert,
  Loader2,
  Search,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Info,
  Activity,
  ArrowRight,
  Fingerprint,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * AI Risk Flag Detection Dashboard.
 * Specialized tool for scanning assets for anomalies and structural vulnerabilities.
 */
export default function RiskDetectionPage() {
  const [asset, setAsset] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskDetectionOutput | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const output = await detectRiskFlags({ asset });
      setResult(output);
      toast({
        title: "Integrity Audit Complete",
        description: `Risk profile for ${asset.toUpperCase()} has been generated.`,
      });
    } catch (error) {
      console.error("AI Risk Engine failure", error);
      toast({
        variant: "destructive",
        title: "Audit Exception",
        description:
          "The AI engine encountered an error while scanning the asset matrix.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "High":
        return (
          <Badge
            variant="destructive"
            className="font-bold uppercase text-[9px] px-2 h-5"
          >
            Critical Risk
          </Badge>
        );
      case "Medium":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold uppercase text-[9px] px-2 h-5">
            Elevated
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-primary/5 text-primary border-primary/20 font-bold uppercase text-[9px] px-2 h-5"
          >
            Minor
          </Badge>
        );
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "text-destructive";
      case "Medium":
        return "text-amber-500";
      default:
        return "text-primary";
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20 pt-12">
      <Container>
        <header className="mb-12 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive mb-6">
            <ShieldAlert className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold uppercase tracking-widest"
            >
              Anomaly Scanner v4.2
            </Text>
          </div>
          <Text
            variant="h1"
            className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight"
          >
            Risk Flag Detection
          </Text>
          <Text
            variant="body"
            className="text-muted-foreground text-lg leading-relaxed"
          >
            Automated auditing of asset integrity. Detect unusual price swings,
            volume anomalies, and sentiment shifts in real-time.
          </Text>
        </header>

        <div className="max-w-2xl mx-auto mb-16">
          <Card className="glass-card shadow-2xl border-white/5 overflow-hidden">
            <CardContent className="p-6">
              <form onSubmit={handleGenerate} className="flex gap-3">
                <div className="relative flex-1 group">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-destructive transition-colors" />
                  <Input
                    placeholder="Identify asset (e.g. SOL, GME, BTC)..."
                    value={asset}
                    onChange={(e) => setAsset(e.target.value)}
                    className="h-14 pl-12 bg-background/50 border-white/10 rounded-2xl text-lg focus:ring-destructive/40 focus:border-destructive"
                    disabled={loading}
                  />
                </div>
                <Button
                  size="lg"
                  type="submit"
                  disabled={loading || !asset.trim()}
                  className="h-14 px-8 rounded-2xl font-bold bg-destructive hover:bg-destructive/90 shadow-xl shadow-destructive/20 transition-all scale-[1.02] active:scale-100"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  ) : (
                    <ShieldAlert className="mr-2 h-5 w-5" />
                  )}
                  {loading ? "Scanning..." : "Scan Node"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {loading && !result && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="w-24 h-24 rounded-[2rem] bg-destructive/10 flex items-center justify-center mb-6 border border-destructive/20 relative">
              <div className="absolute inset-0 rounded-[2rem] border-2 border-destructive/20 animate-ping opacity-20" />
              <Activity className="h-10 w-10 text-destructive animate-pulse" />
            </div>
            <Text variant="h3" className="font-bold mb-2">
              Traversing Liquidity Matrix
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground text-center max-w-sm"
            >
              Cross-referencing historical volatility, order book depth, and
              dark pool metadata for {asset.toUpperCase()}...
            </Text>
          </div>
        )}

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Flags & Details */}
              <div className="lg:col-span-8 space-y-8">
                <Card className="glass-card border-none shadow-2xl overflow-hidden">
                  <CardHeader className="bg-destructive/5 border-b border-white/5 p-8">
                    <div className="flex justify-between items-start mb-4">
                      <Badge
                        variant="destructive"
                        className="px-3 py-1 font-bold uppercase tracking-widest text-[10px]"
                      >
                        Anomaly Report
                      </Badge>
                      <div className="flex items-center gap-2 text-destructive font-bold text-xs">
                        <AlertTriangle className="h-4 w-4" /> Structural Audit
                        Active
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold leading-tight">
                      Integrity Audit: {asset.toUpperCase()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Text
                      variant="body"
                      className="text-lg leading-relaxed text-foreground/80 mb-10 pb-10 border-b border-white/5"
                    >
                      {result.overview}
                    </Text>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm uppercase tracking-widest mb-4">
                        <Activity className="h-4 w-4" /> Detected Flags
                      </div>
                      <div className="space-y-4">
                        {result.risk_flags.map((flag, idx) => (
                          <div
                            key={idx}
                            className="p-6 rounded-2xl bg-background/40 border border-white/5 space-y-4 group hover:border-destructive/30 transition-all"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "p-2 rounded-lg bg-background/50 border border-white/10",
                                    getSeverityColor(flag.severity)
                                  )}
                                >
                                  <AlertCircle className="h-5 w-5" />
                                </div>
                                <Text variant="body" weight="bold">
                                  {flag.description}
                                </Text>
                              </div>
                              <div className="flex items-center gap-3">
                                {getSeverityBadge(flag.severity)}
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-mono opacity-50"
                                >
                                  {flag.confidence_score}% Conviction
                                </Badge>
                              </div>
                            </div>

                            <div className="pl-11 border-l-2 border-white/5 ml-5">
                              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/20 border border-white/5">
                                <Zap className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                                <div>
                                  <Text
                                    variant="label"
                                    className="text-secondary mb-1"
                                  >
                                    Recommendation
                                  </Text>
                                  <Text
                                    variant="bodySmall"
                                    className="text-muted-foreground leading-relaxed"
                                  >
                                    {flag.recommendation}
                                  </Text>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Aggregates */}
              <div className="lg:col-span-4 space-y-8">
                <Card className="glass-card border-none shadow-xl bg-destructive/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <ShieldAlert className="h-24 w-24" />
                  </div>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                      Audit Conviction
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex justify-between items-end mb-2">
                      <div className="text-5xl font-bold tracking-tighter text-destructive">
                        {result.overall_confidence}
                      </div>
                      <Text variant="label" className="mb-1 opacity-50">
                        Aggregate Score
                      </Text>
                    </div>
                    <Progress
                      value={result.overall_confidence}
                      className="h-3 bg-white/5"
                    />
                    <div className="pt-4 flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-white/5">
                      <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <Text
                        variant="caption"
                        className="italic text-muted-foreground leading-relaxed"
                      >
                        Overall confidence is derived from the weighted average
                        of sentiment variance and liquidity depth anomalies.
                      </Text>
                    </div>
                  </CardContent>
                </Card>

                <div className="p-8 rounded-[2rem] border border-secondary/20 bg-secondary/5 space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <TrendingDown className="h-12 w-12 text-secondary" />
                  </div>
                  <Text variant="label" className="text-secondary font-bold">
                    Counter Intelligence
                  </Text>
                  <Text variant="h3" className="mb-4">
                    Hedge Strategy
                  </Text>
                  <Text
                    variant="bodySmall"
                    className="text-muted-foreground leading-relaxed"
                  >
                    Identify potential support levels or derivative hedges to
                    mitigate the detected risks.
                  </Text>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-secondary font-bold text-xs group/btn"
                    asChild
                  >
                    <Link href="/ai-analyst/bear-case">
                      Model Bear Scenario{" "}
                      <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </Button>
                </div>

                <Card className="glass-card border-none bg-background/30 shadow-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Scanner SLA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <Text variant="caption" className="font-bold">
                        Engine Stable
                      </Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <Text variant="caption">Data Authenticity Verified</Text>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
