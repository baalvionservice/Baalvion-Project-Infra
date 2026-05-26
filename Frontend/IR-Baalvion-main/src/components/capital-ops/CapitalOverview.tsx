
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, ArrowUpRight, ShieldCheck, Database, Landmark } from "lucide-react";

interface CapitalOverviewProps {
  totalCommitted: number;
  totalCalled: number;
  remainingCommitment: number;
  deployedCapital: number;
  liquidityReserve: number;
}

export function CapitalOverview({ 
  totalCommitted, 
  totalCalled, 
  remainingCommitment, 
  deployedCapital, 
  liquidityReserve 
}: CapitalOverviewProps) {
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const metrics = [
    { title: "Total Committed", value: formatCurrency(totalCommitted), icon: Database, color: "text-blue-500" },
    { title: "Total Called", value: formatCurrency(totalCalled), icon: ArrowUpRight, color: "text-primary" },
    { title: "Remaining", value: formatCurrency(remainingCommitment), icon: Wallet, color: "text-muted-foreground" },
    { title: "Deployed to SPVs", value: formatCurrency(deployedCapital), icon: ShieldCheck, color: "text-green-500" },
    { title: "Liquidity Reserve", value: formatCurrency(liquidityReserve), icon: Landmark, color: "text-amber-500" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map((m) => (
        <Card key={m.title} className="bg-card/50 border-border/50">
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {m.title}
            </CardTitle>
            <m.icon className={`h-3 w-3 ${m.color}`} />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold tracking-tighter">{m.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
