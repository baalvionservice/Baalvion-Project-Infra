'use client';

import React, { useState } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Sunrise, RefreshCcw, ArrowLeft, Info, TrendingUp, Wallet, CheckCircle2, Loader2, HelpCircle } from 'lucide-react';
import Link from 'next/link';
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

export default function RetirementClient() {
  const { retirement, updateRetirement, resetCalculator } = useCalculatorStore();
  const { currentAge, retirementAge, savings, monthly, rate, result, chartData, errors } = retirement;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const ca = Number(currentAge);
    const ra = Number(retirementAge);
    const s = Number(savings);
    const m = Number(monthly);
    const r = Number(rate);

    if (!currentAge || isNaN(ca) || ca <= 0) newErrors.currentAge = "Required (> 0)";
    if (!retirementAge || isNaN(ra) || ra <= ca) newErrors.retirementAge = "Must exceed current age";
    if (!savings || isNaN(s) || s < 0) newErrors.savings = "Required (>= 0)";
    if (!monthly || isNaN(m) || m < 0) newErrors.monthly = "Required (>= 0)";
    if (!rate || isNaN(r) || r < 0 || r > 100) newErrors.rate = "Required (0-100%)";
    
    updateRetirement({ errors: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setCalculating(true);
    try {
      const response = await calculatorsService.calculateRetirement(
        Number(savings),
        Number(monthly),
        Number(rate),
        Number(currentAge),
        Number(retirementAge)
      );
      
      if (response.data) {
        updateRetirement({ 
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
    resetCalculator('retirement');
    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <main className="min-h-screen bg-background pt-20 pb-32">
      <Container>
        <Button variant="ghost" size="sm" className="mb-8 p-0 hover:bg-transparent text-muted-foreground hover:text-primary group" asChild>
          <Link href="/financial-tools">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> 
            Back to Dashboard
          </Link>
        </Button>

        <header className="mb-12 max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary shadow-sm">
              <Sunrise className="h-7 w-7" />
            </div>
            <Badge variant="outline" className="text-secondary border-secondary/30 uppercase tracking-widest text-[10px] font-bold px-3 py-1">
              Retirement Planning
            </Badge>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold mb-4 tracking-tight">Nest Egg Architect</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Project your cumulative wealth at retirement by modeling current capital reserves against future contribution velocity.
          </Text>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <Card className="glass-card border-none shadow-2xl h-fit">
              <div className="bg-secondary/5 px-6 py-4 border-b border-white/5 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-secondary" />
                <Text variant="caption" className="text-secondary font-bold uppercase tracking-widest">Financial Inputs</Text>
              </div>
              <CardContent className="p-6">
                <form onSubmit={handleCalculate} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="currentAge" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Age</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-48 text-[10px]">Your current chronological age today.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input 
                        id="currentAge" 
                        type="number" 
                        value={currentAge} 
                        onChange={(e) => updateRetirement({ currentAge: e.target.value, errors: { ...errors, currentAge: '' } })}
                        error={errors.currentAge}
                        className="h-11 bg-background/50 border-white/10"
                        disabled={calculating}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="retirementAge" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target Age</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-48 text-[10px]">The age you aim to achieve financial independence or retirement.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input 
                        id="retirementAge" 
                        type="number" 
                        value={retirementAge} 
                        onChange={(e) => updateRetirement({ retirementAge: e.target.value, errors: { ...errors, retirementAge: '' } })}
                        error={errors.retirementAge}
                        className="h-11 bg-background/50 border-white/10"
                        disabled={calculating}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="savings" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Savings ($)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-48 text-[10px]">Total capital currently held in retirement-specific vehicles (401k, IRA, etc.).</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input 
                      id="savings" 
                      type="number" 
                      value={savings} 
                      onChange={(e) => updateRetirement({ savings: e.target.value, errors: { ...errors, savings: '' } })}
                      error={errors.savings}
                      className="h-11 bg-background/50 border-white/10"
                      placeholder="50000"
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
                          <p className="w-48 text-[10px]">Total amount contributed to retirement accounts every month.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input 
                      id="monthly" 
                      type="number" 
                      value={monthly} 
                      onChange={(e) => updateRetirement({ monthly: e.target.value, errors: { ...errors, monthly: '' } })}
                      error={errors.monthly}
                      className="h-11 bg-background/50 border-white/10"
                      placeholder="1000"
                      disabled={calculating}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="rate" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Exp. Market Return (%)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-48 text-[10px]">The projected average annual return on your retirement assets.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input 
                      id="rate" 
                      type="number" 
                      step="0.1"
                      value={rate} 
                      onChange={(e) => updateRetirement({ rate: e.target.value, errors: { ...errors, rate: '' } })}
                      error={errors.rate}
                      className="h-11 bg-background/50 border-white/10"
                      placeholder="7"
                      disabled={calculating}
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <Button type="submit" disabled={calculating} className="h-12 w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl font-bold shadow-lg shadow-secondary/20 transition-all">
                      {calculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Generate Projection
                    </Button>
                    <Button type="button" variant="ghost" onClick={handleReset} className="h-10 w-full text-muted-foreground hover:text-foreground" disabled={calculating}>
                      <RefreshCcw className="mr-2 h-3.5 w-3.5" /> Reset Goals
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {(calculating || result) && (
              <Card className="glass-card border-none bg-secondary/5 border-secondary/20 animate-in fade-in duration-500">
                <CardContent className="p-6">
                  {calculating ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-32" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <Text variant="label" className="text-secondary">Corpus Analysis</Text>
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none px-3 font-bold">READY</Badge>
                      </div>
                      <div className="text-3xl font-bold mb-1">{formatCurrency(result || 0)}</div>
                      <Text variant="caption" className="text-muted-foreground">Estimated wealth at age {retirementAge}.</Text>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-8">
            <Card className="glass-card border-none shadow-2xl h-full overflow-hidden flex flex-col">
              <CardHeader className="bg-card/30 border-b border-white/5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-secondary" /> Corpus Growth Trajectory
                </CardTitle>
                <CardDescription>Visualizing the accumulation phase from age {currentAge} to {retirementAge}.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 flex-grow flex flex-col justify-center min-h-[400px]">
                {calculating ? (
                  <Skeleton className="h-[350px] w-full" />
                ) : chartData.length > 0 ? (
                  <div className="h-[350px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#69B9FF" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#69B9FF" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="age" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Target Age', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                        <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }} formatter={(value: number) => [formatCurrency(value), 'Projected Corpus']} />
                        <Area type="monotone" dataKey="balance" stroke="#69B9FF" fillOpacity={1} fill="url(#colorCorpus)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center space-y-4 opacity-50">
                    <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
                      <Sunrise className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <Text variant="bodySmall" className="italic">
                      Define your retirement parameters to generate a visual accumulation roadmap.
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
            title="Projected Retirement Corpus"
            result={formatCurrency(result)}
            description={`Based on your current trajectory, you are on track to have an estimated nest egg of ${formatCurrency(result)} by age ${retirementAge}.`}
          />
        )}
      </Container>
    </main>
  );
}
