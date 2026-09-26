'use client';

import React, { useState } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CalculatorHeader } from '@/components/financial-tools/CalculatorHeader';
import { Landmark, CheckCircle2 } from 'lucide-react';
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
    <main className="min-h-screen bg-background pt-12 pb-32">
      <Container isNarrow>
        <CalculatorHeader
          category="Stocks"
          title="Dividend Calculator"
          description="Estimate the annual and monthly income a dividend-paying stock position would generate at its current yield."
          icon={Landmark}
        />

        <Card className="border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-8 py-4 border-b border-gray-100">
            <Text variant="caption" className="text-gray-400 font-bold uppercase tracking-widest text-xs">Enter Your Numbers</Text>
          </div>
          <CardContent className="p-8">
            <form onSubmit={handleCalculate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="shares" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Shares Owned</Label>
                  <Input id="shares" type="number" value={shares} onChange={(e) => setShares(e.target.value)} className="h-12" placeholder="e.g. 100" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="price" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price Per Share ($)</Label>
                  <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="h-12" placeholder="e.g. 50" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="yieldPct" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dividend Yield (%)</Label>
                  <Input id="yieldPct" type="number" step="0.1" value={yieldPct} onChange={(e) => setYieldPct(e.target.value)} className="h-12" placeholder="e.g. 2.5" />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button type="button" variant="outline" onClick={handleReset} className="h-12 flex-1">
                  Reset
                </Button>
                <Button type="submit" className="h-12 flex-1 font-semibold">
                  Calculate
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-gray-100 rounded-2xl overflow-hidden mt-8">
            <div className="px-8 py-4 border-b border-gray-100 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <Text variant="caption" className="text-gray-400 font-bold uppercase tracking-widest text-xs">Result</Text>
            </div>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <Text variant="label" className="text-gray-400 uppercase tracking-widest text-xs">Position Value</Text>
                <div className="text-2xl font-bold tracking-tight text-foreground">{formatCurrency(result.positionValue)}</div>
              </div>
              <div>
                <Text variant="label" className="text-gray-400 uppercase tracking-widest text-xs">Annual Dividend Income</Text>
                <div className="text-2xl font-bold tracking-tight text-primary">{formatCurrency(result.annualIncome)}</div>
              </div>
              <div>
                <Text variant="label" className="text-gray-400 uppercase tracking-widest text-xs">Monthly Dividend Income</Text>
                <div className="text-2xl font-bold tracking-tight text-foreground">{formatCurrency(result.monthlyIncome)}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </Container>
    </main>
  );
}
