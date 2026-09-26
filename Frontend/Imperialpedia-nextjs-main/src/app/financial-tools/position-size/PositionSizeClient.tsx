'use client';

import React, { useState } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CalculatorHeader } from '@/components/financial-tools/CalculatorHeader';
import { Ruler, CheckCircle2 } from 'lucide-react';
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
    <main className="min-h-screen bg-background pt-12 pb-32">
      <Container isNarrow>
        <CalculatorHeader
          category="Stocks"
          title="Position Size Calculator"
          description="Work out how many shares to buy so a single trade never risks more than a fixed percentage of your account."
          icon={Ruler}
        />

        <Card className="border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-8 py-4 border-b border-gray-100">
            <Text variant="caption" className="text-gray-400 font-bold uppercase tracking-widest text-xs">Enter Your Numbers</Text>
          </div>
          <CardContent className="p-8">
            <form onSubmit={handleCalculate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="accountSize" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account Size ($)</Label>
                  <Input id="accountSize" type="number" value={accountSize} onChange={(e) => setAccountSize(e.target.value)} className="h-12" placeholder="e.g. 25000" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="riskPercent" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Risk Per Trade (%)</Label>
                  <Input id="riskPercent" type="number" step="0.1" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} className="h-12" placeholder="e.g. 1" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="entryPrice" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Entry Price ($)</Label>
                  <Input id="entryPrice" type="number" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className="h-12" placeholder="e.g. 50" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="stopLoss" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stop-Loss Price ($)</Label>
                  <Input id="stopLoss" type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="h-12" placeholder="e.g. 46" />
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
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <Text variant="label" className="text-gray-400 uppercase tracking-widest text-xs">Shares to Buy</Text>
                <div className="text-5xl font-bold tracking-tighter text-primary">{result.shares.toLocaleString()}</div>
              </div>
              <div>
                <Text variant="label" className="text-gray-400 uppercase tracking-widest text-xs">Dollar Risk at Stop-Loss</Text>
                <div className="text-xl font-bold text-foreground">{formatCurrency(result.riskAmount)}</div>
              </div>
              <div>
                <Text variant="label" className="text-gray-400 uppercase tracking-widest text-xs">Position Value</Text>
                <div className="text-xl font-bold text-foreground">{formatCurrency(result.positionValue)}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </Container>
    </main>
  );
}
