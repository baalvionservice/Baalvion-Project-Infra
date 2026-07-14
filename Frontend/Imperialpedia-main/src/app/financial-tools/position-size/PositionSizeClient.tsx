'use client';

import React, { useState } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ruler, RefreshCcw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { financialMath } from '@/modules/calculators/utils/calculations';

export default function PositionSizeClient() {
  const [accountSize, setAccountSize] = useState('');
  const [riskPercent, setRiskPercent] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [result, setResult] = useState<{ riskAmount: number; perShareRisk: number; shares: number; positionValue: number } | null>(null);
  const [error, setError] = useState('');

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const a = Number(accountSize);
    const r = Number(riskPercent);
    const entry = Number(entryPrice);
    const stop = Number(stopLoss);
    if (!a || a <= 0 || !r || r <= 0 || !entry || entry <= 0 || !stop || stop <= 0 || entry === stop) {
      setError('Enter a positive account size, risk %, and different entry/stop-loss prices.');
      setResult(null);
      return;
    }
    setError('');
    setResult(financialMath.calculatePositionSize(a, r, entry, stop));
  };

  const handleReset = () => {
    setAccountSize('');
    setRiskPercent('');
    setEntryPrice('');
    setStopLoss('');
    setResult(null);
    setError('');
  };

  return (
    <main className="min-h-screen bg-background pt-20 pb-32">
      <Container isNarrow>
        <Button variant="ghost" size="sm" className="mb-8 p-0 hover:bg-transparent text-muted-foreground hover:text-primary group" asChild>
          <Link href="/financial-tools"><ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Dashboard</Link>
        </Button>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
              <Ruler className="h-7 w-7" />
            </div>
            <Badge variant="outline" className="text-primary border-primary/30 uppercase tracking-widest text-[10px] font-bold px-3 py-1">
              Stocks
            </Badge>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold mb-4 tracking-tight">Position Size Calculator</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Work out how many shares to buy so a single trade never risks more than a fixed percentage of your account.
          </Text>
        </header>

        <Card className="glass-card border-none shadow-2xl overflow-hidden">
          <CardContent className="p-8">
            <form onSubmit={handleCalculate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="accountSize" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account Size ($)</Label>
                  <Input id="accountSize" type="number" value={accountSize} onChange={(e) => setAccountSize(e.target.value)} className="h-12 rounded-xl" placeholder="e.g. 25000" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="riskPercent" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Risk Per Trade (%)</Label>
                  <Input id="riskPercent" type="number" step="0.1" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} className="h-12 rounded-xl" placeholder="e.g. 1" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="entryPrice" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Entry Price ($)</Label>
                  <Input id="entryPrice" type="number" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className="h-12 rounded-xl" placeholder="e.g. 50" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="stopLoss" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stop-Loss Price ($)</Label>
                  <Input id="stopLoss" type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="h-12 rounded-xl" placeholder="e.g. 46" />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button type="button" variant="outline" onClick={handleReset} className="h-14 flex-1 rounded-2xl font-bold">
                  <RefreshCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button type="submit" className="h-14 flex-1 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold">
                  Calculate Position Size
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className="glass-card border-none shadow-2xl overflow-hidden mt-8">
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 text-emerald-500 mb-2 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4" /> Shares to Buy
                </div>
                <div className="text-5xl font-bold tracking-tighter text-foreground">{result.shares.toLocaleString()}</div>
              </div>
              <div>
                <Text variant="label" className="text-muted-foreground">Dollar Risk at Stop-Loss</Text>
                <div className="text-xl font-bold text-foreground">{formatCurrency(result.riskAmount)}</div>
              </div>
              <div>
                <Text variant="label" className="text-muted-foreground">Position Value</Text>
                <div className="text-xl font-bold text-foreground">{formatCurrency(result.positionValue)}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </Container>
    </main>
  );
}
