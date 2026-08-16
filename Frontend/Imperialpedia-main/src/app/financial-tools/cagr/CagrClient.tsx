'use client';

import React, { useState } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CalculatorHeader } from '@/components/financial-tools/CalculatorHeader';
import { TrendingUp, CheckCircle2 } from 'lucide-react';
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
    <main className="min-h-screen bg-background pt-12 pb-32">
      <Container isNarrow>
        <CalculatorHeader
          category="Stocks"
          title="CAGR Calculator"
          description="Find the smoothed annual growth rate between a starting and ending investment value over any time period."
          icon={TrendingUp}
        />

        <Card className="border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-8 py-4 border-b border-gray-100">
            <Text variant="caption" className="text-gray-400 font-bold uppercase tracking-widest text-xs">Enter Your Numbers</Text>
          </div>
          <CardContent className="p-8">
            <form onSubmit={handleCalculate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="startValue" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Starting Value ($)</Label>
                  <Input id="startValue" type="number" value={startValue} onChange={(e) => setStartValue(e.target.value)} className="h-12" placeholder="e.g. 10000" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="endValue" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ending Value ($)</Label>
                  <Input id="endValue" type="number" value={endValue} onChange={(e) => setEndValue(e.target.value)} className="h-12" placeholder="e.g. 18000" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="years" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Years</Label>
                  <Input id="years" type="number" value={years} onChange={(e) => setYears(e.target.value)} className="h-12" placeholder="e.g. 5" />
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

        {result !== null && (
          <Card className="border-gray-100 rounded-2xl overflow-hidden mt-8">
            <div className="px-8 py-4 border-b border-gray-100 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <Text variant="caption" className="text-gray-400 font-bold uppercase tracking-widest text-xs">Result</Text>
            </div>
            <CardContent className="p-8">
              <Text variant="label" className="text-gray-400 uppercase tracking-widest text-xs">Compound Annual Growth Rate</Text>
              <div className="text-5xl font-bold tracking-tighter text-primary">{result.toFixed(2)}%</div>
            </CardContent>
          </Card>
        )}
      </Container>
    </main>
  );
}
