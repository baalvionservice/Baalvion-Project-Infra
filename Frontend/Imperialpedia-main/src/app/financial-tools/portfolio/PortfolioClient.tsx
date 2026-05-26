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
import { 
  Layers, 
  RefreshCcw, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  PieChart as PieChartIcon,
  TrendingUp,
  CheckCircle2,
  Database,
  Loader2,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { useCalculatorStore, PortfolioAsset } from '@/lib/state/calculator-store';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip as RechartsTooltip,
} from 'recharts';

export default function PortfolioClient() {
  const { portfolio, updatePortfolio, resetCalculator } = useCalculatorStore();
  const { assets, result: results } = portfolio;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const addAsset = () => {
    updatePortfolio({ 
      assets: [...assets, { id: Math.random().toString(), name: '', investment: '0', returnRate: '0' }] 
    });
  };

  const removeAsset = (id: string) => {
    if (assets.length > 1) {
      updatePortfolio({ 
        assets: assets.filter(a => a.id !== id) 
      });
    }
  };

  const updateAsset = (id: string, field: keyof PortfolioAsset, value: string) => {
    updatePortfolio({ 
      assets: assets.map(a => a.id === id ? { ...a, [field]: value, error: '' } : a) 
    });
  };

  const validate = () => {
    let isValid = true;
    const newAssets = assets.map(asset => {
      let error = "";
      const inv = Number(asset.investment);
      const ret = Number(asset.returnRate);

      if (!asset.name.trim()) error = "Name Required";
      else if (isNaN(inv) || inv < 0) error = "Amount >= 0";
      else if (isNaN(ret) || ret < 0 || ret > 100) error = "Yield 0-100%";
      
      if (error) isValid = false;
      return { ...asset, error };
    });
    updatePortfolio({ assets: newAssets });
    return isValid;
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setCalculating(true);
    try {
      const formattedAssets = assets.map(a => ({
        name: a.name || 'Unnamed Asset',
        investment: Number(a.investment),
        returnRate: Number(a.returnRate)
      }));

      const response = await calculatorsService.calculatePortfolio(formattedAssets);
      
      if (response.data) {
        updatePortfolio({ result: response.data });
        setIsModalOpen(true);
      }
    } finally {
      setCalculating(false);
    }
  };

  const handleReset = () => {
    resetCalculator('portfolio');
    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const COLORS = ['#8272F2', '#69B9FF', '#10b981', '#f59e0b', '#ef4444'];

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
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
              <Layers className="h-7 w-7" />
            </div>
            <Badge variant="outline" className="text-primary border-primary/30 uppercase tracking-widest text-[10px] font-bold px-3 py-1">
              Multi-Asset Modeling
            </Badge>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold mb-4 tracking-tight">Portfolio ROI Architect</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Architect a diversified investment matrix by assigning capital and yield expectations to individual asset nodes.
          </Text>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-8">
            <Card className="glass-card border-none shadow-2xl">
              <CardHeader className="bg-card/30 border-b border-white/5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/5 text-primary">
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Asset Matrix</CardTitle>
                    <CardDescription>Define your allocation nodes.</CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={addAsset} className="h-9 rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold" disabled={calculating}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Node
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleCalculate} className="space-y-6">
                  <div className="space-y-4">
                    {assets.map((asset) => (
                      <div key={asset.id} className="p-4 rounded-xl bg-background/40 border border-white/5 space-y-4 hover:border-primary/20 transition-colors group/node">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                          <div className="sm:col-span-4 space-y-2">
                            <div className="flex items-center gap-1.5">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Node Label</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="w-48 text-[10px]">The name of the asset class or specific security (e.g., Growth Stocks, BTC).</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Input 
                              value={asset.name} 
                              onChange={(e) => updateAsset(asset.id, 'name', e.target.value)}
                              placeholder="e.g. Equities"
                              className="bg-background/50 h-10 border-white/5"
                              error={asset.error && asset.error.includes('Name') ? asset.error : undefined}
                              disabled={calculating}
                            />
                          </div>
                          <div className="sm:col-span-4 space-y-2">
                            <div className="flex items-center gap-1.5">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Investment ($)</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="w-48 text-[10px]">Capital amount allocated specifically to this portfolio node.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Input 
                              type="number"
                              value={asset.investment} 
                              onChange={(e) => updateAsset(asset.id, 'investment', e.target.value)}
                              className="bg-background/50 h-10 border-white/5"
                              error={asset.error && asset.error.includes('Amount') ? asset.error : undefined}
                              disabled={calculating}
                            />
                          </div>
                          <div className="sm:col-span-3 space-y-2">
                            <div className="flex items-center gap-1.5">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Yield (%)</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="w-48 text-[10px]">The expected annual growth rate for this specific asset.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Input 
                              type="number"
                              step="0.1"
                              value={asset.returnRate} 
                              onChange={(e) => updateAsset(asset.id, 'returnRate', e.target.value)}
                              className="bg-background/50 h-10 border-white/5"
                              error={asset.error && asset.error.includes('Yield') ? asset.error : undefined}
                              disabled={calculating}
                            />
                          </div>
                          <div className="sm:col-span-1 flex justify-center">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="text-muted-foreground hover:text-destructive h-10 w-10 opacity-40 group-hover/node:opacity-100 transition-opacity"
                              onClick={() => removeAsset(asset.id)}
                              disabled={assets.length === 1 || calculating}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button type="submit" disabled={calculating} className="flex-1 h-14 bg-primary hover:bg-primary/90 rounded-2xl font-bold shadow-xl shadow-primary/20 scale-[1.02] active:scale-100 transition-all">
                      {calculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Analyze Performance
                    </Button>
                    <Button type="button" variant="outline" onClick={handleReset} className="h-14 px-8 rounded-2xl border-white/10" disabled={calculating}>
                      <RefreshCcw className="h-5 w-5" />
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

            {results && !calculating && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="glass-card border-none bg-emerald-500/5 border-emerald-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Text variant="label" className="text-emerald-500">Aggregate Value</Text>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-3xl font-bold">{formatCurrency(results.totalValue)}</div>
                    <Text variant="caption" className="text-muted-foreground">Portfolio maturity target.</Text>
                  </CardContent>
                </Card>
                <Card className="glass-card border-none">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Text variant="label" className="text-primary">Weighted ROI</Text>
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-3xl font-bold">{results.weightedReturn.toFixed(2)}%</div>
                    <Text variant="caption" className="text-muted-foreground">Overall return velocity.</Text>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-8">
            {calculating ? (
              <Skeleton className="h-[450px] w-full rounded-[3rem]" />
            ) : results ? (
              <Card className="glass-card border-none shadow-2xl overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-primary" /> Allocation Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={results.breakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="investment"
                        nameKey="name"
                      >
                        {results.breakdown.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }} formatter={(value: number) => formatCurrency(value)} />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-[3rem] opacity-30 text-center space-y-4">
                <div className="p-6 rounded-full bg-muted/20">
                  <Layers className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <Text variant="h4">Awaiting Node Logic</Text>
                  <Text variant="bodySmall">Define your asset allocation matrix to visualize your intelligence nodes.</Text>
                </div>
              </div>
            )}
          </div>
        </div>

        {results && (
          <CalculatorResultModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onReset={handleReset}
            title="Projected Capital Growth"
            result={formatCurrency(results.totalValue)}
            description={`Your diversified strategy is projected to grow by ${formatCurrency(results.totalProfit)} (+${results.weightedReturn.toFixed(2)}%) across all nodes.`}
          />
        )}
      </Container>
    </main>
  );
}
