'use client';

import React, { useState } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { PieChart as PieIcon, TrendingUp, CheckCircle2, Loader2, HelpCircle } from 'lucide-react';
import { useCalculatorStore } from '@/lib/state/calculator-store';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function InvestmentClient() {
  const { investment, updateInvestment, resetCalculator } = useCalculatorStore();
  const { principal, monthly, rate, years, result, chartData, errors } = investment;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const p = Number(principal);
    const m = Number(monthly);
    const r = Number(rate);
    const y = Number(years);

    if (!principal || isNaN(p) || p < 0) newErrors.principal = "Required (>= 0)";
    if (!monthly || isNaN(m) || m < 0) newErrors.monthly = "Required (>= 0)";
    if (!rate || isNaN(r) || r < 0 || r > 100) newErrors.rate = "Required (0-100%)";
    if (!years || isNaN(y) || y <= 0) newErrors.years = "Required (> 0)";
    
    updateInvestment({ errors: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setCalculating(true);
    try {
      const response = await calculatorsService.calculateInvestment(
        Number(principal),
        Number(monthly),
        Number(rate),
        Number(years)
      );
      
      if (response.data) {
        updateInvestment({ 
          result: response.data.finalValue,
          chartData: response.data.chartData
        });
        setIsModalOpen(true);
      }
    } finally {
      setCalculating(false);
    }
  };

  const handleReset = () => {
    resetCalculator('investment');
    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <main className="min-h-screen bg-background pt-12 pb-32">
      <Container>
        <CalculatorHeader
          category="Investing"
          title="Investment Growth Calculator"
          description="Project long-term wealth accumulation by modeling recurring contributions against an expected annual return."
          icon={PieIcon}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <Card className="border-gray-100 rounded-2xl h-fit">
              <div className="px-6 py-4 border-b border-gray-100">
                <Text variant="caption" className="text-gray-400 font-bold uppercase tracking-widest text-xs">Enter Your Numbers</Text>
              </div>
              <CardContent className="p-6">
                <form onSubmit={handleCalculate} className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="principal" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Initial Principal ($)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-64">The initial sum of money you are starting with in your investment account.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input 
                      id="principal" 
                      type="number" 
                      value={principal} 
                      onChange={(e) => updateInvestment({ principal: e.target.value, errors: { ...errors, principal: '' } })}
                      error={errors.principal}
                      className="h-11"
                      placeholder="5000"
                      disabled={calculating}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="monthly" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Monthly Contribution ($)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-64">The amount you plan to add to your investment every month (Dollar-Cost Averaging).</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input 
                      id="monthly" 
                      type="number" 
                      value={monthly} 
                      onChange={(e) => updateInvestment({ monthly: e.target.value, errors: { ...errors, monthly: '' } })}
                      error={errors.monthly}
                      className="h-11"
                      placeholder="500"
                      disabled={calculating}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="rate" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expected Annual Return (%)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-64">Your targeted or expected average yearly growth rate (e.g., S&P 500 historic average is ~10%).</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input 
                      id="rate" 
                      type="number" 
                      step="0.1"
                      value={rate} 
                      onChange={(e) => updateInvestment({ rate: e.target.value, errors: { ...errors, rate: '' } })}
                      error={errors.rate}
                      className="h-11"
                      placeholder="8"
                      disabled={calculating}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="years" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Time Horizon (Years)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-64">The total number of years you plan to keep this money invested.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input 
                      id="years" 
                      type="number" 
                      value={years} 
                      onChange={(e) => updateInvestment({ years: e.target.value, errors: { ...errors, years: '' } })}
                      error={errors.years}
                      className="h-11"
                      placeholder="20"
                      disabled={calculating}
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <Button type="submit" disabled={calculating} className="h-12 w-full font-semibold">
                      {calculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Calculate
                    </Button>
                    <Button type="button" variant="ghost" onClick={handleReset} className="h-10 w-full text-muted-foreground hover:text-foreground" disabled={calculating}>
                      Reset
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {(calculating || result) && (
              <Card className="border-gray-100 bg-gray-50 animate-in fade-in duration-500">
                <CardContent className="p-6">
                  {calculating ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-32" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <Text variant="label" className="text-gray-400 uppercase tracking-widest text-xs">Summary Value</Text>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="text-3xl font-bold mb-1 text-primary">{formatCurrency(result || 0)}</div>
                      <Text variant="caption" className="text-gray-500">Projected capital in {years} years.</Text>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-8">
            <Card className="border-gray-100 rounded-2xl h-full overflow-hidden flex flex-col">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Growth Trajectory
                </CardTitle>
                <CardDescription>How your balance grows as contributions compound month over month.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 flex-grow flex flex-col justify-center min-h-[400px]">
                {calculating ? (
                  <Skeleton className="h-[350px] w-full" />
                ) : chartData.length > 0 ? (
                  <div className="h-[350px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1d4fc4" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#1d4fc4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis dataKey="year" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Years', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                        <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '12px' }} formatter={(value: number) => [formatCurrency(value), 'Capital Maturity']} />
                        <Area type="monotone" dataKey="balance" stroke="#1d4fc4" fillOpacity={1} fill="url(#colorBalance)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center space-y-4 opacity-50">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                      <TrendingUp className="h-10 w-10 text-gray-400" />
                    </div>
                    <Text variant="bodySmall" className="italic">
                      Enter your investment goals to generate a growth chart.
                    </Text>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {result && (
          <CalculatorResultModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onReset={handleReset}
            title="Projected Asset Maturity"
            result={formatCurrency(result)}
            description={`Starting with ${formatCurrency(Number(principal))} and adding ${formatCurrency(Number(monthly))} monthly, your capital is projected to reach ${formatCurrency(result)} over ${years} years.`}
          />
        )}
      </Container>
    </main>
  );
}
