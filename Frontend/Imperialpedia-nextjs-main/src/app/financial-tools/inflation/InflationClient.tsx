'use client';

import React, { useState } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { calculatorsService } from '@/services/data';
import { CalculatorResultModal } from '@/modules/calculators/components/CalculatorResultModal';
import { CalculatorHeader } from '@/components/financial-tools/CalculatorHeader';
import { ArrowUpRight, Info, CheckCircle2, Loader2, HelpCircle } from 'lucide-react';
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
    <main className="min-h-screen bg-background pt-12 pb-32">
      <Container isNarrow>
        <CalculatorHeader
          category="Economics"
          title="Inflation Calculator"
          description="See how inflation erodes purchasing power over time, and what a fixed amount today will need to be worth in the future."
          icon={ArrowUpRight}
        />

        <div className="space-y-8">
          <Card className="border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-8 py-4 border-b border-gray-100">
              <Text variant="caption" className="text-gray-400 font-bold uppercase tracking-widest text-xs">Enter Your Numbers</Text>
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
                      className="h-12"
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
                      className="h-12"
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
                      className="h-12"
                      placeholder="e.g. 10"
                      disabled={calculating}
                    />
                  </div>

                  <div className="flex items-center p-4 rounded-xl bg-gray-50 border border-gray-100 mt-6">
                    <Info className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
                    <Text variant="caption" className="text-gray-500 italic leading-relaxed">
                      Projects the future capital required to maintain equivalent purchasing power.
                    </Text>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={handleReset} className="h-12 flex-1" disabled={calculating}>
                    Reset
                  </Button>
                  <Button type="submit" disabled={calculating} className="h-12 flex-1 font-semibold">
                    {calculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Calculate
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {calculating && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          )}

          {result && !calculating && (
            <Card className="border-gray-100 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="border-b border-gray-100 py-4 px-8">
                <Text variant="caption" className="text-gray-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Result
                </Text>
              </div>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-2">
                    <Text variant="label" className="text-gray-400 uppercase tracking-widest text-xs">Future Equivalent Value</Text>
                    <div className="text-5xl font-bold tracking-tighter text-primary">
                      {formatCurrency(result)}
                    </div>
                    <Text variant="caption" className="text-gray-500 font-semibold block mt-2">
                      +{((result / Number(amount)) * 100 - 100).toFixed(1)}% relative cost increase
                    </Text>
                  </div>
                  <div className="p-6 rounded-xl bg-gray-50 border border-gray-100 italic text-sm text-gray-500 leading-relaxed">
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
