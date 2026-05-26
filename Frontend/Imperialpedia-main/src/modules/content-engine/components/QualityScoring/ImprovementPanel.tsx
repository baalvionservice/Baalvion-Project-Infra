/**
 * @fileOverview Recommendations for content improvement.
 */

import React from "react";
import { ImprovementSuggestion } from "@/types/content-quality";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Text } from "@/design-system/typography/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  Zap,
  Target,
  BookOpen,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImprovementPanelProps {
  suggestions: ImprovementSuggestion[];
}

export function ImprovementPanel({ suggestions }: ImprovementPanelProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "source":
        return <ShieldCheck className="h-4 w-4" />;
      case "content":
        return <BookOpen className="h-4 w-4" />;
      case "readability":
        return <Layers className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  return (
    <Card className="glass-card border-none shadow-2xl bg-primary/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-1000">
        <Sparkles className="h-24 w-24 text-primary" />
      </div>
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">
              Optimization Recommendations
            </CardTitle>
            <Text
              variant="caption"
              className="text-primary font-bold uppercase tracking-widest text-[9px]"
            >
              AI Content Strategist
            </Text>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-4 space-y-4">
        {suggestions.map((sug) => (
          <div
            key={sug.id}
            className="flex gap-4 p-4 rounded-2xl bg-background/40 border border-white/5 hover:border-primary/30 transition-all group/item"
          >
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-all">
              {getIcon(sug.type)}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center">
                <Badge
                  variant="outline"
                  className="text-[8px] font-bold uppercase border-primary/20 bg-primary/5 text-primary h-5 px-1.5"
                >
                  {sug.type}
                </Badge>
                <span
                  className={cn(
                    "text-[8px] font-bold uppercase",
                    sug.impact === "High"
                      ? "text-emerald-500"
                      : "text-muted-foreground"
                  )}
                >
                  {sug.impact} Impact
                </span>
              </div>
              <Text
                variant="bodySmall"
                className="text-foreground/80 leading-relaxed font-medium"
              >
                "{sug.message}"
              </Text>
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter className="p-6 bg-muted/10 border-t border-white/5">
        <Button
          variant="ghost"
          className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary group"
        >
          Relaunch Quality Audit{" "}
          <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}
