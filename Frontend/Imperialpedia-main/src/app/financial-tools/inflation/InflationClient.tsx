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
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { calculatorsService } from '@/services/data';
import { CalculatorResultModal } from '@/modules/calculators/components/CalculatorResultModal';
import { ArrowUpRight, RefreshCcw, ArrowLeft, Info, Gauge, CheckCircle2, Loader2, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useCalculatorStore } from '@/lib/state/calculator-store';

export default function InflationClient() {
  const { inflation, updateInflation, resetCalculator } = useCalculatorStore();
  const { amount, rate, years, result, errors } = inflation;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const a = Number(amount);
    const r = Number(rate);
    const y = Number(years);

    if (!amount || isNaN(a) || a <= 0) newErrors.amount = "Required (> 0)";
    if (!rate || isNaN(r) || r < 0 || r > 100) newErrors.rate = "Required (0-100%)";
    if (!years || isNaN(y) || y <= 0) newErrors.years = "Required (> 0)";
    
    updateInflation({ errors: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setCalculating(true);
    try {
      const response = await calculatorsService.calculateInflation(
        Number(amount),
        Number(rate),
        Number(years)
      );
      
      if (response.data) {
        updateInflation({ result: response.data });
        setIsModalOpen(true);
      }
    } finally {
      setCalculating(false);
    }
  };

  const handleReset = () => {
    resetCalculator('inflation');
    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <main className="min-h-screen bg-background pt-20 pb-32">
      <Container isNarrow>
        <Button variant="ghost" size="sm" className="mb-8 p-0 hover:bg-transparent text-muted-foreground hover:text-primary group" asChild>
          <Link href="/financial-tools">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> 
            Back to Dashboard
          </Link>
        </Button>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
              <ArrowUpRight className="h-7 w-7" />
            </div>
            <Badge variant="outline" className="text-primary border-primary/30 uppercase tracking-widest text-[10px] font-bold px-3 py-1">
              Economic Analysis
            </Badge>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold mb-4 tracking-tight">Inflation Impact Engine</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Visualize the eroding effects of inflation on your purchasing power and calculate the future equivalent value of today's currency.
          </Text>
        </header>

        <div className="space-y-8">
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <div className="bg-primary/5 px-8 py-4 border-b border-white/5 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              <Text variant="caption" className="text-primary font-bold uppercase tracking-widest">Economic Parameters</Text>
            </div>
            <CardContent className="p-8">
              <form onSubmit={handleCalculate} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Present Value ($)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-64">The current amount of money you want to evaluate for future purchasing power.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input 
                      id="amount" 
                      type="number" 
                      value={amount} 
                      onChange={(e) => updateInflation({ amount: e.target.value, errors: { ...errors, amount: '' } })}
                      error={errors.amount}
                      className="h-12 bg-background/50 rounded-xl border-white/10"
                      placeholder="e.g. 5000"
                      disabled={calculating}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="rate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Inflation Benchmark (%)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-64">The expected average annual inflation rate (e.g., target 2% or recent 3.5%).</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input 
                      id="rate" 
                      type="number" 
                      step="0.1"
                      value={rate} 
                      onChange={(e) => updateInflation({ rate: e.target.value, errors: { ...errors, rate: '' } })}
                      error={errors.rate}
                      className="h-12 bg-background/50 rounded-xl border-white/10"
                      placeholder="e.g. 3.2"
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
                          <p className="w-64">The number of years into the future you are projecting.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input 
                      id="years" 
                      type="number" 
                      value={years} 
                      onChange={(e) => updateInflation({ years: e.target.value, errors: { ...errors, years: '' } })}
                      error={errors.years}
                      className="h-12 bg-background/50 rounded-xl border-white/10"
                      placeholder="e.g. 10"
                      disabled={calculating}
                    />
                  </div>

                  <div className="flex items-center p-4 rounded-xl bg-primary/5 border border-primary/10 mt-6">
                    <Info className="h-5 w-5 text-primary mr-3 shrink-0" />
                    <Text variant="caption" className="text-muted-foreground italic leading-relaxed">
                      Models the necessary future capital required to maintain equivalent purchasing power.
                    </Text>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={handleReset} className="h-14 flex-1 rounded-2xl font-bold border-white/10 hover:bg-white/5 transition-all" disabled={calculating}>
                    <RefreshCcw className="mr-2 h-4 w-4" /> Reset Tool
                  </Button>
                  <Button type="submit" disabled={calculating} className="h-14 flex-1 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all scale-[1.02] active:scale-100">
                    {calculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Analyze Impact
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {calculating && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-32 w-full rounded-3xl" />
              <Skeleton className="h-32 w-full rounded-3xl" />
            </div>
          )}

          {result && !calculating && (
            <Card className="glass-card border-none shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="bg-primary/10 border-b border-primary/20 py-4 px-8">
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-5 w-5" /> Erosion Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-2">
                    <Text variant="label" className="text-muted-foreground">Future Equivalent Value</Text>
                    <div className="text-5xl font-bold tracking-tighter">
                      {formatCurrency(result)}
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold mt-2">
                      {((result / Number(amount)) * 100 - 100).toFixed(1)}% Relative Cost Increase
                    </Badge>
                  </div>
                  <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 italic text-sm text-muted-foreground leading-relaxed">
                    "At a {rate}% annual benchmark, you will require {formatCurrency(result)} in {years} years to match the current value of {formatCurrency(Number(amount))}."
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
            title="Future Equivalent Power"
            result={formatCurrency(result)}
            description={`With a ${rate}% average annual inflation rate, you will need ${formatCurrency(result)} in ${years} years to possess today's ${formatCurrency(Number(amount))} in buying capacity.`}
          />
        )}
      </Container>
    </main>
  );
}
