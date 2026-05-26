'use client';

import React, { useState } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { calculatorsService } from '@/services/data';
import { CalculatorResultModal } from '@/modules/calculators/components/CalculatorResultModal';
import { TrendingUp, RefreshCcw, ArrowLeft, Info, CheckCircle2, Loader2, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useCalculatorStore } from '@/lib/state/calculator-store';

export default function CompoundInterestClient() {
  const { compound, updateCompound, resetCalculator } = useCalculatorStore();
  const { principal, rate, years, frequency, result, errors } = compound;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const p = Number(principal);
    const r = Number(rate);
    const y = Number(years);

    if (!principal || isNaN(p) || p < 0) newErrors.principal = "Required (>= 0)";
    if (!rate || isNaN(r) || r < 0 || r > 100) newErrors.rate = "Required (0-100%)";
    if (!years || isNaN(y) || y <= 0) newErrors.years = "Required (> 0)";
    
    updateCompound({ errors: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setCalculating(true);
    try {
      const response = await calculatorsService.calculateCompound(
        Number(principal),
        Number(rate),
        Number(years),
        0,
        Number(frequency)
      );
      
      if (response.data) {
        updateCompound({ result: response.data });
        setIsModalOpen(true);
      }
    } finally {
      setCalculating(false);
    }
  };

  const handleReset = () => {
    resetCalculator('compound');
    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <main className="min-h-screen bg-background pt-20 pb-32">
      <Container isNarrow>
        <Button variant="ghost" size="sm" className="mb-8 p-0 hover:bg-transparent text-muted-foreground hover:text-primary group" asChild>
          <Link href="/financial-tools"><ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Dashboard</Link>
        </Button>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
              <TrendingUp className="h-7 w-7" />
            </div>
            <Badge variant="outline" className="text-primary border-primary/30 uppercase tracking-widest text-[10px] font-bold px-3 py-1">
              Wealth Building
            </Badge>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold mb-4 tracking-tight">Compound Interest Engine</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Determine the future value of your capital by analyzing the impact of time and compounding frequency on your principal.
          </Text>
        </header>

        <div className="space-y-8">
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <div className="bg-primary/5 px-8 py-4 border-b border-white/5 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <Text variant="caption" className="text-primary font-bold uppercase tracking-widest">Growth Parameters</Text>
            </div>
            <CardContent className="p-8">
              <form onSubmit={handleCalculate} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="principal" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Initial Principal ($)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-64">The starting amount of capital you are investing or saving before interest begins to accrue.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input 
                      id="principal" 
                      type="number" 
                      value={principal} 
                      onChange={(e) => updateCompound({ principal: e.target.value, errors: { ...errors, principal: '' } })}
                      error={errors.principal}
                      className="h-12 bg-background/50 rounded-xl border-white/10"
                      placeholder="e.g. 10000"
                      disabled={calculating}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="rate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Annual Interest Rate (%)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-64">The nominal annual growth rate. This should be expressed as a percentage (e.g., 7.5 for 7.5%).</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input 
                      id="rate" 
                      type="number" 
                      step="0.1"
                      value={rate} 
                      onChange={(e) => updateCompound({ rate: e.target.value, errors: { ...errors, rate: '' } })}
                      error={errors.rate}
                      className="h-12 bg-background/50 rounded-xl border-white/10"
                      placeholder="e.g. 7.5"
                      disabled={calculating}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="years" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Time Horizon (Years)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-64">The duration in years that your investment will be allowed to grow.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input 
                      id="years" 
                      type="number" 
                      value={years} 
                      onChange={(e) => updateCompound({ years: e.target.value, errors: { ...errors, years: '' } })}
                      error={errors.years}
                      className="h-12 bg-background/50 rounded-xl border-white/10"
                      placeholder="e.g. 20"
                      disabled={calculating}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="frequency" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Compounding Frequency</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-64">Determines how often the accumulated interest is added back into the principal to earn more interest.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select value={frequency} onValueChange={(val) => updateCompound({ frequency: val })} disabled={calculating}>
                      <SelectTrigger className="h-12 bg-background/50 rounded-xl border-white/10">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Annually</SelectItem>
                        <SelectItem value="2">Semi-Annually</SelectItem>
                        <SelectItem value="4">Quarterly</SelectItem>
                        <SelectItem value="12">Monthly</SelectItem>
                        <SelectItem value="365">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={handleReset} className="h-14 flex-1 rounded-2xl font-bold border-white/10 hover:bg-white/5 transition-all" disabled={calculating}>
                    <RefreshCcw className="mr-2 h-4 w-4" /> Reset Tool
                  </Button>
                  <Button type="submit" disabled={calculating} className="h-14 flex-1 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all scale-[1.02] active:scale-100">
                    {calculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Analyze Growth
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {calculating && (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-3xl" />
            </div>
          )}

          {result && !calculating && (
            <Card className="glass-card border-none shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="bg-emerald-500/10 border-b border-emerald-500/20 py-4 px-8">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 className="h-5 w-5" /> Summary Result
                  </CardTitle>
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-500 border-none font-bold uppercase tracking-tighter">
                    Calculation Stable
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-2">
                    <Text variant="label" className="text-muted-foreground">Estimated Future Value</Text>
                    <div className="text-5xl font-bold tracking-tighter text-foreground">
                      {formatCurrency(result)}
                    </div>
                    <Text variant="caption" className="text-emerald-500 font-bold block mt-2">
                      +{formatCurrency(result - Number(principal))} in projected earnings
                    </Text>
                  </div>
                  <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 italic text-sm text-muted-foreground leading-relaxed">
                    "Based on a {rate}% annual rate, your initial capital of {formatCurrency(Number(principal))} is projected to yield high returns over {years} years."
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {result && (
          <CalculatorResultModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onReset={handleReset}
            title="Projected Future Value"
            result={formatCurrency(result)}
            description={`Starting with ${formatCurrency(Number(principal))}, your portfolio is projected to grow to ${formatCurrency(result)} over ${years} years at an annual interest rate of ${rate}%.`}
          />
        )}
      </Container>
    </main>
  );
}
