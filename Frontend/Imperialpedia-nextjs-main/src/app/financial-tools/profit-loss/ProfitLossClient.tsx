'use client';

import React, { useState } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CalculatorHeader } from '@/components/financial-tools/CalculatorHeader';
import { Calculator, CheckCircle2 } from 'lucide-react';
import { financialMath } from '@/modules/calculators/utils/calculations';

export default function ProfitLossClient() {
  const [shares, setShares] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [fees, setFees] = useState('');
  const [result, setResult] = useState<{ costBasis: number; proceeds: number; profitLoss: number; percentReturn: number } | null>(null);
  const [error, setError] = useState('');

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const s = Number(shares);
    const b = Number(buyPrice);
    const sp = Number(sellPrice);
    const f = fees ? Number(fees) : 0;
    if (!s || s <= 0 || !b || b <= 0 || !sp || sp <= 0 || f < 0) {
      setError('Enter a positive share count, buy price, and sell price.');
      setResult(null);
      return;
    }
    setError('');
    setResult(financialMath.calculateProfitLoss(s, b, sp, f));
  };

  const handleReset = () => {
    setShares('');
    setBuyPrice('');
    setSellPrice('');
    setFees('');
    setResult(null);
    setError('');
  };

  const isProfit = result ? result.profitLoss >= 0 : true;

  return (
    <main className="min-h-screen bg-background pt-12 pb-32">
      <Container isNarrow>
        <CalculatorHeader
          category="Stocks"
          title="Profit/Loss Calculator"
          description="Calculate the realized profit or loss on a closed stock trade, after fees."
          icon={Calculator}
        />

        <Card className="border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-8 py-4 border-b border-gray-100">
            <Text variant="caption" className="text-gray-400 font-bold uppercase tracking-widest text-xs">Enter Your Numbers</Text>
          </div>
          <CardContent className="p-8">
            <form onSubmit={handleCalculate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="shares" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Shares</Label>
                  <Input id="shares" type="number" value={shares} onChange={(e) => setShares(e.target.value)} className="h-12" placeholder="e.g. 100" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="fees" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trading Fees ($, optional)</Label>
                  <Input id="fees" type="number" value={fees} onChange={(e) => setFees(e.target.value)} className="h-12" placeholder="e.g. 5" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="buyPrice" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Buy Price ($)</Label>
                  <Input id="buyPrice" type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} className="h-12" placeholder="e.g. 40" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="sellPrice" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sell Price ($)</Label>
                  <Input id="sellPrice" type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} className="h-12" placeholder="e.g. 55" />
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
              <CheckCircle2 className={`h-4 w-4 ${isProfit ? 'text-emerald-600' : 'text-destructive'}`} />
              <Text variant="caption" className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                {isProfit ? 'Net Profit' : 'Net Loss'}
              </Text>
            </div>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <div className={`text-5xl font-bold tracking-tighter ${isProfit ? 'text-primary' : 'text-destructive'}`}>
                  {formatCurrency(result.profitLoss)} <span className="text-2xl">({result.percentReturn.toFixed(2)}%)</span>
                </div>
              </div>
              <div>
                <Text variant="label" className="text-gray-400 uppercase tracking-widest text-xs">Cost Basis</Text>
                <div className="text-xl font-bold text-foreground">{formatCurrency(result.costBasis)}</div>
              </div>
              <div>
                <Text variant="label" className="text-gray-400 uppercase tracking-widest text-xs">Proceeds</Text>
                <div className="text-xl font-bold text-foreground">{formatCurrency(result.proceeds)}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </Container>
    </main>
  );
}
