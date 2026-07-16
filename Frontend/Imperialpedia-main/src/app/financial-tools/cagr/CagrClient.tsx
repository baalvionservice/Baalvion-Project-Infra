'use client';

import React, { useState } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, RefreshCcw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { financialMath } from '@/modules/calculators/utils/calculations';

export default function CagrClient() {
  const [startValue, setStartValue] = useState('');
  const [endValue, setEndValue] = useState('');
  const [years, setYears] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const s = Number(startValue);
    const en = Number(endValue);
    const y = Number(years);
    if (!s || s <= 0 || !en || en <= 0 || !y || y <= 0) {
      setError('Enter a positive starting value, ending value, and number of years.');
      setResult(null);
      return;
    }
    setError('');
    setResult(financialMath.calculateCAGR(s, en, y));
  };

  const handleReset = () => {
    setStartValue('');
    setEndValue('');
    setYears('');
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
              <TrendingUp className="h-7 w-7" />
            </div>
            <Badge variant="outline" className="text-primary border-primary/30 uppercase tracking-widest text-[10px] font-bold px-3 py-1">
              Stocks
            </Badge>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-6xl font-bold mb-4 tracking-tight">CAGR Calculator</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Find the smoothed annual growth rate between a starting and ending investment value over any time period.
          </Text>
        </header>

        <Card className="glass-card border-none shadow-2xl overflow-hidden">
          <CardContent className="p-8">
            <form onSubmit={handleCalculate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="startValue" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Starting Value ($)</Label>
                  <Input id="startValue" type="number" value={startValue} onChange={(e) => setStartValue(e.target.value)} className="h-12 rounded-xl" placeholder="e.g. 10000" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="endValue" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ending Value ($)</Label>
                  <Input id="endValue" type="number" value={endValue} onChange={(e) => setEndValue(e.target.value)} className="h-12 rounded-xl" placeholder="e.g. 18000" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="years" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Years</Label>
                  <Input id="years" type="number" value={years} onChange={(e) => setYears(e.target.value)} className="h-12 rounded-xl" placeholder="e.g. 5" />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button type="button" variant="outline" onClick={handleReset} className="h-14 flex-1 rounded-2xl font-bold">
                  <RefreshCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button type="submit" className="h-14 flex-1 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold">
                  Calculate CAGR
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {result !== null && (
          <Card className="glass-card border-none shadow-2xl overflow-hidden mt-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 text-emerald-500 mb-4 font-bold">
                <CheckCircle2 className="h-5 w-5" /> Result
              </div>
              <Text variant="label" className="text-muted-foreground">Compound Annual Growth Rate</Text>
              <div className="text-5xl font-bold tracking-tighter text-foreground">{result.toFixed(2)}%</div>
            </CardContent>
          </Card>
        )}
      </Container>
    </main>
  );
}
