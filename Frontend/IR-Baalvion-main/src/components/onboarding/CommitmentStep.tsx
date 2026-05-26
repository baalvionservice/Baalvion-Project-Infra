
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Landmark, Wallet, ArrowRight, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export function CommitmentStep({ onNext }: { onNext: (data: any) => void }) {
  const [commitment, setCommitment] = useState(1000000);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="animate-in fade-in duration-500">
      <CardHeader className="text-center border-b border-border/50 pb-8">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <Landmark className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Capital Commitment</CardTitle>
        <CardDescription>Specify your intended allocation for the 2026 Opportunity Tranche.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Target Commitment Amount</Label>
            <div className="text-4xl font-bold tracking-tighter text-primary">
              {formatCurrency(commitment)}
            </div>
          </div>

          <div className="px-4 py-8">
            <Slider 
              min={100000} 
              max={10000000} 
              step={50000} 
              value={[commitment]} 
              onValueChange={(v) => setCommitment(v[0])} 
            />
            <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold mt-4">
              <span>Min: $100K</span>
              <span>Max: $10M+</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border/50 bg-background/20">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-3 w-3 text-muted-foreground" />
                <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Est. Deployment</span>
              </div>
              <div className="text-lg font-bold tracking-tight">{formatCurrency(commitment * 0.1)}</div>
              <p className="text-[8px] text-muted-foreground uppercase font-medium">Initial 10% Call</p>
            </div>
            <div className="p-4 rounded-xl border border-border/50 bg-background/20">
              <div className="flex items-center gap-2 mb-1">
                <Landmark className="h-3 w-3 text-muted-foreground" />
                <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Asset Target</span>
              </div>
              <div className="text-lg font-bold tracking-tight">Growth SPV-A</div>
              <p className="text-[8px] text-muted-foreground uppercase font-medium">Primary Allocation</p>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => onNext({ commitment })}
          className="w-full h-12 font-bold uppercase tracking-widest"
        >
          Confirm Intent <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </div>
  );
}
