
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Database, ArrowRight, ShieldCheck, Landmark } from "lucide-react";

interface CapitalFlowProps {
  totalCommitted: number;
  totalCalled: number;
  totalDeployed: number;
}

export function CapitalFlowVisualization({ totalCommitted, totalCalled, totalDeployed }: CapitalFlowProps) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <Card className="border-border/50 bg-card/30">
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Capital Lifecycle Logic</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col lg:flex-row items-center justify-between gap-8 py-10">
        {/* Step 1: Commitment */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-16 w-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 shadow-xl shadow-blue-500/5">
            <Database className="h-8 w-8" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Registry</p>
            <p className="text-sm font-bold">{formatCurrency(totalCommitted)}</p>
          </div>
        </div>

        <ArrowRight className="hidden lg:block h-6 w-6 text-muted-foreground/30" />

        {/* Step 2: Called */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-xl shadow-primary/5">
            <Landmark className="h-8 w-8" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Called</p>
            <p className="text-sm font-bold">{formatCurrency(totalCalled)}</p>
          </div>
        </div>

        <ArrowRight className="hidden lg:block h-6 w-6 text-muted-foreground/30" />

        {/* Step 3: Deployed */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-16 w-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500 shadow-xl shadow-green-500/5">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Deployed</p>
            <p className="text-sm font-bold">{formatCurrency(totalDeployed)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
