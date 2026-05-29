'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft } from 'lucide-react';
import type { Currency } from '@/lib/types';
import { useFxRates } from '@/hooks/use-fx-rates';

const currencies: Currency[] = ["USD", "INR", "GBP", "AED", "SGD"];

export default function CurrencyConverter() {
  const { map: rates } = useFxRates();
  const [amount, setAmount] = useState<number | string>(100);
  const [fromCurrency, setFromCurrency] = useState<Currency>('USD');
  const [toCurrency, setToCurrency] = useState<Currency>('INR');

  useEffect(() => {
    const savedFrom = localStorage.getItem('fromCurrency') as Currency | null;
    const savedTo = localStorage.getItem('toCurrency') as Currency | null;
    if (savedFrom && currencies.includes(savedFrom)) {
      setFromCurrency(savedFrom);
    }
    if (savedTo && currencies.includes(savedTo)) {
      setToCurrency(savedTo);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fromCurrency', fromCurrency);
    localStorage.setItem('toCurrency', toCurrency);
  }, [fromCurrency, toCurrency]);

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };
  
  let result: number | null = null;
  if (typeof amount === 'number' && amount >= 0 && rates[fromCurrency] && rates[toCurrency]) {
    const amountInUsd = amount / rates[fromCurrency];
    result = amountInUsd * rates[toCurrency];
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Currency Converter</CardTitle>
        <CardDescription>Quickly convert between currencies.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="amount" className="text-sm font-medium">Amount</label>
          <Input 
            id="amount" 
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || '')}
            placeholder="Enter amount"
          />
        </div>
        <div className="flex items-center gap-2">
            <div className="flex-1 space-y-1">
                <label className="text-sm font-medium">From</label>
                <Select value={fromCurrency} onValueChange={(v) => setFromCurrency(v as Currency)}>
                    <SelectTrigger>
                        <SelectValue placeholder="From" />
                    </SelectTrigger>
                    <SelectContent>
                        {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <Button variant="ghost" size="icon" className="mt-6" onClick={handleSwap}>
                <ArrowRightLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 space-y-1">
                 <label className="text-sm font-medium">To</label>
                <Select value={toCurrency} onValueChange={(v) => setToCurrency(v as Currency)}>
                    <SelectTrigger>
                        <SelectValue placeholder="To" />
                    </SelectTrigger>
                    <SelectContent>
                        {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
        
        {result !== null && (
            <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">{Number(amount).toLocaleString()} {fromCurrency} =</p>
                <p className="text-3xl font-bold">{result.toLocaleString(undefined, { maximumFractionDigits: 2 })} {toCurrency}</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
