'use client';

import React, { useState } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { RefreshCcw, ArrowLeft, Info, Landmark, CheckCircle2, Loader2, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useCalculatorStore } from '@/lib/state/calculator-store';

export default function LoanClient() {
  const { loan, updateLoan, resetCalculator } = useCalculatorStore();
  const { principal, rate, years, result, errors } = loan;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const p = Number(principal);
    const r = Number(rate);
    const y = Number(years);

    if (!principal || isNaN(p) || p <= 0) newErrors.principal = "Required (> 0)";
    if (!rate || isNaN(r) || r < 0 || r > 100) newErrors.rate = "Required (0-100%)";
    if (!years || isNaN(y) || y <= 0) newErrors.years = "Required (> 0)";

    updateLoan({ errors: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setCalculating(true);
    try {
      const response = await calculatorsService.calculateLoan(
        Number(principal),
        Number(rate),
        Number(years)
      );

      if (response.data) {
        updateLoan({
          result: {
            monthly: response.data.monthlyPayment,
            total: response.data.totalRepayment,
            interest: response.data.totalInterest
          }
        });
        setIsModalOpen(true);
      }
    } finally {
      setCalculating(false);
    }
  };

  const handleReset = () => {
    resetCalculator('loan');
    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <main className="min-h-screen bg-background pt-20 pb-32">
      <Container isNarrow>
        <Button variant="ghost" size="sm" className="mb-8 p-0 hover:bg-transparent text-muted-foreground hover:text-primary group" asChild>
          <Link href="/financial-tools">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
        </Button>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary shadow-sm">
              <Landmark className="h-7 w-7" />
            </div>
            <Badge variant="outline" className="text-secondary border-secondary/30 uppercase tracking-widest text-[10px] font-bold px-3 py-1">
              Debt Management
            </Badge>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold mb-4 tracking-tight">Loan Repayment Engine</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Analyze your monthly obligations and the total cost of capital for mortgages, personal financing, or auto loans.
          </Text>
        </header>

        <div className="space-y-8">
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <div className="bg-secondary/5 px-8 py-4 border-b border-white/5 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-secondary" />
              <Text variant="caption" className="text-secondary font-bold uppercase tracking-widest">Financing Parameters</Text>
            </div>
            <CardContent className="p-8">
              <form onSubmit={handleCalculate} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="principal" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Loan Amount ($)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-64">The total amount of money you are borrowing (Principal).</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="principal"
                      type="number"
                      value={principal}
                      onChange={(e) => updateLoan({ principal: e.target.value, errors: { ...errors, principal: '' } })}
                      error={errors.principal}
                      className="h-12 bg-background/50 rounded-xl border-white/10"
                      placeholder="e.g. 250000"
                      disabled={calculating}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="rate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Annual Interest Rate (%)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-64">The annual percentage rate (APR) charged by the lender for the loan.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      value={rate}
                      onChange={(e) => updateLoan({ rate: e.target.value, errors: { ...errors, rate: '' } })}
                      error={errors.rate}
                      className="h-12 bg-background/50 rounded-xl border-white/10"
                      placeholder="e.g. 6.5"
                      disabled={calculating}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="years" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Loan Tenure (Years)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-64">The total duration of the loan agreement, usually expressed in years (e.g., 30 for a standard mortgage).</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="years"
                      type="number"
                      value={years}
                      onChange={(e) => updateLoan({ years: e.target.value, errors: { ...errors, years: '' } })}
                      error={errors.years}
                      className="h-12 bg-background/50 rounded-xl border-white/10"
                      placeholder="e.g. 30"
                      disabled={calculating}
                    />
                  </div>

                  <div className="flex items-center p-4 rounded-xl bg-secondary/5 border border-secondary/10 mt-6">
                    <Info className="h-5 w-5 text-secondary mr-3 shrink-0" />
                    <Text variant="caption" className="text-muted-foreground italic">
                      Models a standard amortized repayment schedule based on target market rates.
                    </Text>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={handleReset} className="h-14 flex-1 rounded-2xl font-bold border-white/10 hover:bg-white/5 transition-all" disabled={calculating}>
                    <RefreshCcw className="mr-2 h-4 w-4" /> Reset Tool
                  </Button>
                  <Button type="submit" disabled={calculating} className="h-14 flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-2xl font-bold shadow-xl shadow-secondary/20 transition-all scale-[1.02] active:scale-100">
                    {calculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Analyze Repayment
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {calculating && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          )}

          {result && !calculating && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="glass-card border-none bg-secondary/5 border-secondary/20">
                <CardContent className="p-6">
                  <Text variant="label" className="text-secondary mb-1">Monthly Payment</Text>
                  <div className="text-2xl font-bold">{formatCurrency(result.monthly)}</div>
                </CardContent>
              </Card>
              <Card className="glass-card border-none">
                <CardContent className="p-6">
                  <Text variant="label" className="text-muted-foreground mb-1">Total Interest</Text>
                  <div className="text-2xl font-bold text-amber-500">{formatCurrency(result.interest)}</div>
                </CardContent>
              </Card>
              <Card className="glass-card border-none">
                <CardContent className="p-6">
                  <Text variant="label" className="text-muted-foreground mb-1">Total Repayment</Text>
                  <div className="text-2xl font-bold">{formatCurrency(result.total)}</div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>

        {result && (
          <CalculatorResultModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onReset={handleReset}
            title="Estimated Monthly Payment"
            result={formatCurrency(result.monthly)}
            description={`For a ${formatCurrency(Number(principal))} loan at ${rate}% over ${years} years, your fixed monthly commitment is ${formatCurrency(result.monthly)}.`}
          />
        )}
      </Container>
    </main>
  );
}
