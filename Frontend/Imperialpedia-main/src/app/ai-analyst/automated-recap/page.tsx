"use client";

import React, { useEffect, useState } from "react";
import { analyticsService } from "@/services/data/analytics-service";
import { RecapSummaryItem } from "@/types/analytics";
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
import {
  History,
  TrendingUp,
  TrendingDown,
  Zap,
  Calendar,
  Loader2,
  ArrowRight,
  ChevronRight,
  Globe,
  PieChart,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * AI Automated Recap Dashboard.
 * Specialized tool for generating structured summaries of market cycles.
 */
export default function AutomatedRecapPage() {
  const [recaps, setRecaps] = useState<RecapSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecaps() {
      try {
        const response = await analyticsService.getRecapSummaries();
        if (response.data) setRecaps(response.data);
      } catch (e) {
        console.error("Failed to sync recap intelligence", e);
      } finally {
        setLoading(false);
      }
    }
    loadRecaps();
  }, []);

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text
          variant="bodySmall"
          className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground"
        >
          Synthesizing Cycle History...
        </Text>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-20 pt-12">
      <Container>
        <header className="mb-16 max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-2">
            <History className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold uppercase tracking-widest"
            >
              Chronological Intelligence Node
            </Text>
          </div>
          <Text
            variant="h1"
            className="text-4xl lg:text-6xl font-bold tracking-tight"
          >
            Automated Recaps
          </Text>
          <Text
            variant="body"
            className="text-muted-foreground text-lg leading-relaxed"
          >
            Consolidated intelligence reports for any market cycle. Monitor top
            movers, laggers, and strategic takeaways in a high-fidelity retro
            view.
          </Text>
        </header>

        <div className="space-y-12">
          {recaps.map((recap, idx) => (
            <div
              key={recap.date}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <div className="flex items-center gap-4 mb-6 px-2">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <Text variant="h2" className="text-2xl font-bold">
                    {format(new Date(recap.date), "MMMM d, yyyy")}
                  </Text>
                  <Text
                    variant="caption"
                    className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
                  >
                    Market Cycle Summary
                  </Text>
                </div>
                <div className="flex-grow h-px bg-gradient-to-r from-border to-transparent ml-4 opacity-30" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Performance Matrix */}
                <div className="lg:col-span-4 space-y-6">
                  <Card className="glass-card border-none shadow-xl bg-emerald-500/5 h-full">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-sm font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Top Movers
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recap.top_movers.map((mover, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-xl bg-background/40 border border-emerald-500/10 hover:border-emerald-500/30 transition-colors"
                        >
                          <Text variant="bodySmall" className="font-bold">
                            {mover.split(" ")[0]}
                          </Text>
                          <span className="text-sm font-mono font-bold text-emerald-500">
                            {mover.split(" ")[1]}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <Card className="glass-card border-none shadow-xl bg-destructive/5 h-full">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-sm font-bold uppercase tracking-widest text-destructive flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" /> Top Laggers
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recap.top_laggers.map((lagger, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-xl bg-background/40 border border-destructive/10 hover:border-destructive/30 transition-colors"
                        >
                          <Text variant="bodySmall" className="font-bold">
                            {lagger.split(" ")[0]}
                          </Text>
                          <span className="text-sm font-mono font-bold text-destructive">
                            {lagger.split(" ")[1]}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Strategic Takeaways */}
                <div className="lg:col-span-4">
                  <Card className="glass-card border-none shadow-2xl bg-primary/5 h-full relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <Zap className="h-16 w-16 text-primary" />
                    </div>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                        <Target className="h-4 w-4" /> Key Takeaways
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {recap.key_points.map((point, i) => (
                        <div
                          key={i}
                          className="flex gap-3 items-start group/item"
                        >
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0 group-hover/item:scale-150 transition-transform" />
                          <Text
                            variant="caption"
                            className="text-muted-foreground group-hover/item:text-foreground transition-colors leading-relaxed italic"
                          >
                            "{point}"
                          </Text>
                        </div>
                      ))}
                    </CardContent>
                    <CardFooter className="pt-0 pb-6 px-6 mt-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 group/btn"
                      >
                        Full Daily Audit{" "}
                        <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Global Strategy Footer */}
        <div className="p-12 rounded-[3.5rem] bg-secondary/5 border border-secondary/20 flex flex-col lg:flex-row items-center gap-10 mt-24 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
            <Globe className="h-64 w-64 text-secondary" />
          </div>
          <div className="w-20 h-20 rounded-[2.5rem] bg-secondary/20 flex items-center justify-center text-secondary shadow-2xl shrink-0">
            <PieChart className="h-10 w-10" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-2 relative z-10">
            <Text variant="h2" className="text-2xl font-bold">
              Longitudinal Cycle Analysis
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed max-w-3xl"
            >
              Our automated recaps aggregate data from the **Institutional Wires
              Hub** and **Social Sentiment Nodes**. Use these to verify if your
              portfolio allocation aligns with current sector-wide rotation
              trends.
            </Text>
          </div>
          <Button
            size="lg"
            className="h-14 px-10 rounded-2xl font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-xl shadow-secondary/30 shrink-0 relative z-10"
            asChild
          >
            <a href="/ai-analyst/sector-overview">Analyze Sector Rotations</a>
          </Button>
        </div>
      </Container>
    </main>
  );
}
