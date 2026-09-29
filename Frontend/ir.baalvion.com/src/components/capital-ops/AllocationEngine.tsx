
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SPV } from "@/lib/capital-ops/types";
import { Layers, ArrowRight } from "lucide-react";

interface AllocationEngineProps {
  spvs: SPV[];
  onExecute: () => void;
  canExecute: boolean;
  disabled: boolean;
}

export function AllocationEngine({ spvs, onExecute, canExecute, disabled }: AllocationEngineProps) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <Card className="border-border/50 bg-card/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Asset Allocation Engine
          </CardTitle>
          <CardDescription className="text-xs">Deploy confirmed capital into diversified asset vehicles.</CardDescription>
        </div>
        <Button 
          onClick={onExecute} 
          disabled={!canExecute || disabled}
          className="h-9 px-6 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
        >
          Execute Deployment <ArrowRight className="ml-2 h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground">Allocation Target</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground">Weight</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground text-right pr-6">Current Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spvs.map((spv) => (
                <TableRow key={spv.id} className="border-border/50">
                  <TableCell className="font-bold text-sm tracking-tight">{spv.name}</TableCell>
                  <TableCell>
                    <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border">{spv.targetPercentage}%</span>
                  </TableCell>
                  <TableCell className="text-right pr-6 font-bold text-sm">{formatCurrency(spv.allocatedAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
