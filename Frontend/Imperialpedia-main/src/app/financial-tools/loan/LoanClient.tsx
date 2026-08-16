'use client';

import React, { useState } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { calculatorsService } from '@/services/data';
import { CalculatorResultModal } from '@/modules/calculators/components/CalculatorResultModal';
import { CalculatorHeader } from '@/components/financial-tools/CalculatorHeader';
import { Info, Landmark, Loader2, HelpCircle } from 'lucide-react';
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
    <main className="min-h-screen bg-background pt-12 pb-32">
      <Container isNarrow>
        <CalculatorHeader
          category="Debt Management"
          title="Loan Payment Calculator"
          description="Work out your monthly payment and the total cost of capital for a mortgage, auto loan, or personal loan."
          icon={Landmark}
        />

        <div className="space-y-8">
          <Card className="border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-8 py-4 border-b border-gray-100">
              <Text variant="caption" className="text-gray-400 font-bold uppercase tracking-widest text-xs">Enter Your Numbers</Text>
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
                      className="h-12"
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
                      className="h-12"
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
                      className="h-12"
                      placeholder="e.g. 30"
                      disabled={calculating}
                    />
                  </div>

                  <div className="flex items-center p-4 rounded-xl bg-gray-50 border border-gray-100 mt-6">
                    <Info className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
                    <Text variant="caption" className="text-gray-500 italic">
                      Models a standard amortized repayment schedule.
                    </Text>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={handleReset} className="h-12 flex-1" disabled={calculating}>
                    Reset
                  </Button>
                  <Button type="submit" disabled={calculating} className="h-12 flex-1 font-semibold">
                    {calculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Calculate
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
              <Card className="border-gray-100 bg-gray-50">
                <CardContent className="p-6">
                  <Text variant="label" className="text-gray-400 uppercase tracking-widest text-xs mb-1">Monthly Payment</Text>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(result.monthly)}</div>
                </CardContent>
              </Card>
              <Card className="border-gray-100">
                <CardContent className="p-6">
                  <Text variant="label" className="text-gray-400 uppercase tracking-widest text-xs mb-1">Total Interest</Text>
                  <div className="text-2xl font-bold text-foreground">{formatCurrency(result.interest)}</div>
                </CardContent>
              </Card>
              <Card className="border-gray-100">
                <CardContent className="p-6">
                  <Text variant="label" className="text-gray-400 uppercase tracking-widest text-xs mb-1">Total Repayment</Text>
                  <div className="text-2xl font-bold text-foreground">{formatCurrency(result.total)}</div>
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
