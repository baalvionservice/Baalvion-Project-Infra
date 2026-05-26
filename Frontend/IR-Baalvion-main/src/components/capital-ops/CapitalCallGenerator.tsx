
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Zap } from "lucide-react";

interface CapitalCallGeneratorProps {
  onGenerate: (percentage: number) => void;
  disabled: boolean;
}

export function CapitalCallGenerator({ onGenerate, disabled }: CapitalCallGeneratorProps) {
  const [percentage, setPercentage] = useState<number>(10);

  return (
    <Card className="border-border/50 bg-card/30">
      <CardHeader>
        <div className="flex items-center gap-2 mb-1 text-primary">
          <Zap className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Operations</span>
        </div>
        <CardTitle className="text-lg font-bold">Capital Call Issuance</CardTitle>
        <CardDescription className="text-xs">
          Trigger a pro-rata drawdown across all institutional commitments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="percentage" className="text-[10px] font-bold uppercase text-muted-foreground">Call Percentage (%)</Label>
            <div className="relative">
              <Input 
                id="percentage"
                type="number"
                min={1}
                max={100}
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="bg-background border-border/50 h-10 pr-10"
                disabled={disabled}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <Button 
            className="h-10 px-8 font-bold text-xs uppercase tracking-widest"
            onClick={() => onGenerate(percentage)}
            disabled={disabled}
          >
            Generate Issuance
          </Button>
        </div>
        
        {percentage > 50 && (
          <div className="mt-4 flex gap-2 items-start p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-500">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed">
              <strong>Compliance Notice:</strong> Calls exceeding 50% of remaining commitment require supplementary board notification and may trigger secondary liquidity review.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
