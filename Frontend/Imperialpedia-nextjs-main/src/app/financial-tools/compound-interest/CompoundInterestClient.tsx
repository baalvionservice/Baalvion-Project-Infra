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
import { CalculatorHeader } from '@/components/financial-tools/CalculatorHeader';
import { TrendingUp, CheckCircle2, Loader2, HelpCircle } from 'lucide-react';
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
    <main className="min-h-screen bg-background pt-12 pb-32">
      <Container isNarrow>
        <CalculatorHeader
          category="Wealth Building"
          title="Compound Interest Calculator"
          description="Determine the future value of your capital by modeling how time and compounding frequency affect your principal."
          icon={TrendingUp}
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
                      className="h-12"
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
                      className="h-12"
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
                      className="h-12"
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
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
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
                    <Text variant="label" className="text-gray-400 uppercase tracking-widest text-xs">Estimated Future Value</Text>
                    <div className="text-5xl font-bold tracking-tighter text-primary">
                      {formatCurrency(result)}
                    </div>
                    <Text variant="caption" className="text-emerald-600 font-bold block mt-2">
                      +{formatCurrency(result - Number(principal))} in projected earnings
                    </Text>
                  </div>
                  <div className="p-6 rounded-xl bg-gray-50 border border-gray-100 italic text-sm text-gray-500 leading-relaxed">
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
