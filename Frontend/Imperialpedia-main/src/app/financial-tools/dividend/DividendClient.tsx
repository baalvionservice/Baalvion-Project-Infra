'use client';

import React, { useState } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Landmark, RefreshCcw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { financialMath } from '@/modules/calculators/utils/calculations';

export default function DividendClient() {
  const [shares, setShares] = useState('');
  const [price, setPrice] = useState('');
  const [yieldPct, setYieldPct] = useState('');
  const [result, setResult] = useState<{ positionValue: number; annualIncome: number; monthlyIncome: number } | null>(null);
  const [error, setError] = useState('');

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const s = Number(shares);
    const p = Number(price);
    const y = Number(yieldPct);
    if (!s || s <= 0 || !p || p <= 0 || !y || y < 0) {
      setError('Enter a positive share count, share price, and a dividend yield of 0% or higher.');
      setResult(null);
      return;
    }
    setError('');
    setResult(financialMath.calculateDividendIncome(s, p, y));
  };

  const handleReset = () => {
    setShares('');
    setPrice('');
    setYieldPct('');
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
              <Landmark className="h-7 w-7" />
            </div>
            <Badge variant="outline" className="text-primary border-primary/30 uppercase tracking-widest text-[10px] font-bold px-3 py-1">
              Stocks
            </Badge>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-6xl font-bold mb-4 tracking-tight">Dividend Calculator</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Estimate the annual and monthly income a dividend-paying stock position would generate at its current yield.
          </Text>
        </header>

        <Card className="glass-card border-none shadow-2xl overflow-hidden">
          <CardContent className="p-8">
            <form onSubmit={handleCalculate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="shares" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Shares Owned</Label>
                  <Input id="shares" type="number" value={shares} onChange={(e) => setShares(e.target.value)} className="h-12 rounded-xl" placeholder="e.g. 100" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="price" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price Per Share ($)</Label>
                  <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="h-12 rounded-xl" placeholder="e.g. 50" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="yieldPct" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dividend Yield (%)</Label>
                  <Input id="yieldPct" type="number" step="0.1" value={yieldPct} onChange={(e) => setYieldPct(e.target.value)} className="h-12 rounded-xl" placeholder="e.g. 2.5" />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button type="button" variant="outline" onClick={handleReset} className="h-14 flex-1 rounded-2xl font-bold">
                  <RefreshCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button type="submit" className="h-14 flex-1 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold">
                  Calculate Income
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className="glass-card border-none shadow-2xl overflow-hidden mt-8">
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 text-emerald-500 mb-2 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4" /> Position Value
                </div>
                <div className="text-2xl font-bold tracking-tighter text-foreground">{formatCurrency(result.positionValue)}</div>
              </div>
              <div>
                <Text variant="label" className="text-muted-foreground">Annual Dividend Income</Text>
                <div className="text-2xl font-bold tracking-tighter text-foreground">{formatCurrency(result.annualIncome)}</div>
              </div>
              <div>
                <Text variant="label" className="text-muted-foreground">Monthly Dividend Income</Text>
                <div className="text-2xl font-bold tracking-tighter text-foreground">{formatCurrency(result.monthlyIncome)}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </Container>
    </main>
  );
}
