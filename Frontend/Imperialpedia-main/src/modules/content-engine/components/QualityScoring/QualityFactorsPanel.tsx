/**
 * @fileOverview Panel explaining the quality score calculation.
 */

import React from "react";
import { QualityFactors } from "@/types/content-quality";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/design-system/typography/text";
import { Progress } from "@/components/ui/progress";
import {
  Info,
  BookOpen,
  UserCheck,
  Activity,
  ShieldCheck,
  FileSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QualityFactorsPanelProps {
  factors: QualityFactors;
}

export function QualityFactorsPanel({ factors }: QualityFactorsPanelProps) {
  const mapping = [
    {
      key: "research_depth",
      label: "Research Depth",
      icon: BookOpen,
      color: "text-primary",
    },
    {
      key: "expert_contribution",
      label: "Expert Review",
      icon: UserCheck,
      color: "text-secondary",
    },
    {
      key: "community_engagement",
      label: "Community Pulse",
      icon: Activity,
      color: "text-emerald-500",
    },
    {
      key: "source_credibility",
      label: "Source Verification",
      icon: ShieldCheck,
      color: "text-primary",
    },
    {
      key: "editorial_review",
      label: "Editorial Audit",
      icon: FileSearch,
      color: "text-secondary",
    },
  ];

  return (
    <Card className="glass-card border-none shadow-xl bg-card/30">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
          <Info className="h-4 w-4" /> Scoring Taxonomy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {mapping.map((item) => (
          <div key={item.key} className="space-y-2 group cursor-default">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase">
              <span className="text-muted-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
                <item.icon className={cn("h-3 w-3", item.color)} />
                {item.label}
              </span>
              <span className="font-mono text-foreground">
                {(factors as any)[item.key]}%
              </span>
            </div>
            <Progress
              value={(factors as any)[item.key]}
              className="h-1 bg-white/5"
            />
          </div>
        ))}

        <div className="pt-4 border-t border-white/5">
          <Text
            variant="caption"
            className="text-muted-foreground italic leading-relaxed text-[10px]"
          >
            "Quality scores are weighted against trailing 12-month platform
            benchmarks and verified institutional sources."
          </Text>
        </div>
      </CardContent>
    </Card>
  );
}
