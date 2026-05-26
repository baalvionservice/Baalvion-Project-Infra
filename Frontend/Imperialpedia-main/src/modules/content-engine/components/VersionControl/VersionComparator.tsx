"use client";

import React from "react";
import { ArticleVersion } from "@/types/version-control";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/design-system/typography/text";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, GitCompare, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface VersionComparatorProps {
  versionA: ArticleVersion;
  versionB: ArticleVersion;
}

/**
 * Split-screen comparison tool for visualizing content diffs.
 */
export function VersionComparator({
  versionA,
  versionB,
}: VersionComparatorProps) {
  // Simplified mock diff logic: identifies specific words that might change in our mocks
  const renderDiff = (text: string, isNew: boolean) => {
    // This is a simplified visual mock of a diff
    const highlights = [
      "high-fidelity",
      "critical",
      "(where short term rates exceed long term)",
      "but an inversion",
      "often signals an upcoming recession",
      "For example, the 2023 inversion was a major focal point for macro analysts.",
    ];

    const parts = text.split(/([.,])/);

    return (
      <div className="space-y-4 leading-relaxed text-sm">
        {parts.map((part, i) => {
          const isHighlighted = highlights.some((h) => part.includes(h));
          if (isHighlighted) {
            return (
              <span
                key={i}
                className={cn(
                  "px-1 rounded-sm font-medium",
                  isNew
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-destructive/20 text-destructive border border-destructive/30 line-through"
                )}
              >
                {part}
              </span>
            );
          }
          return (
            <span key={i} className="text-muted-foreground">
              {part}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
      <Card className="glass-card border-none bg-background/30 shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-white/5 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-60">
                Version {versionA.version} (Legacy)
              </CardTitle>
            </div>
            <Badge
              variant="outline"
              className="text-[8px] font-bold border-white/10 uppercase"
            >
              {versionA.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8 h-[400px] overflow-y-auto custom-scrollbar">
          {renderDiff(versionA.content, false)}
        </CardContent>
      </Card>

      <Card className="glass-card border-none bg-primary/5 shadow-2xl overflow-hidden ring-1 ring-primary/20">
        <CardHeader className="bg-primary/10 border-b border-primary/10 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">
                Version {versionB.version} (Challenger)
              </CardTitle>
            </div>
            <Badge className="bg-primary text-white border-none text-[8px] font-bold uppercase">
              {versionB.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8 h-[400px] overflow-y-auto custom-scrollbar">
          {renderDiff(versionB.content, true)}
        </CardContent>
      </Card>
    </div>
  );
}
