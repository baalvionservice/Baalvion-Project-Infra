"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PortfolioAsset {
  id: string;
  name: string;
  investment: string;
  returnRate: string;
  error?: string;
}

export interface CompoundState {
  principal: string;
  rate: string;
  years: string;
  frequency: string;
  result: number | null;
  errors: Record<string, string>;
}

export interface LoanState {
  principal: string;
  rate: string;
  years: string;
  result: { monthly: number; total: number; interest: number } | null;
  errors: Record<string, string>;
}

export interface InvestmentState {
  principal: string;
  monthly: string;
  rate: string;
  years: string;
  result: number | null;
  chartData: any[];
  errors: Record<string, string>;
}

export interface RetirementState {
  currentAge: string;
  retirementAge: string;
  savings: string;
  monthly: string;
  rate: string;
  result: number | null;
  chartData: any[];
  errors: Record<string, string>;
}

export interface PortfolioState {
  assets: PortfolioAsset[];
  result: any | null;
  errors: Record<string, string>;
}

export interface InflationState {
  amount: string;
  rate: string;
  years: string;
  result: number | null;
  errors: Record<string, string>;
}

interface CalculatorState {
  compound: CompoundState;
  loan: LoanState;
  investment: InvestmentState;
  retirement: RetirementState;
  portfolio: PortfolioState;
  inflation: InflationState;
}

interface CalculatorContextType extends CalculatorState {
  updateCompound: (data: Partial<CompoundState>) => void;
  updateLoan: (data: Partial<LoanState>) => void;
  updateInvestment: (data: Partial<InvestmentState>) => void;
  updateRetirement: (data: Partial<RetirementState>) => void;
  updatePortfolio: (data: Partial<PortfolioState>) => void;
  updateInflation: (data: Partial<InflationState>) => void;
  resetCalculator: (key: keyof CalculatorState) => void;
}

const INITIAL_STATE: CalculatorState = {
  compound: { principal: '10000', rate: '7', years: '10', frequency: '12', result: null, errors: {} },
  loan: { principal: '250000', rate: '6.5', years: '30', result: null, errors: {} },
  investment: { principal: '5000', monthly: '500', rate: '8', years: '20', result: null, chartData: [], errors: {} },
  retirement: { currentAge: '30', retirementAge: '65', savings: '50000', monthly: '1000', rate: '7', result: null, chartData: [], errors: {} },
  portfolio: { 
    assets: [
      { id: '1', name: 'Stocks', investment: '10000', returnRate: '10' },
      { id: '2', name: 'Bonds', investment: '5000', returnRate: '4' },
      { id: '3', name: 'Real Estate', investment: '20000', returnRate: '7' },
    ], 
    result: null, 
    errors: {} 
  },
  inflation: { amount: '5000', rate: '3', years: '10', result: null, errors: {} },
};

const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined);

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CalculatorState>(INITIAL_STATE);

  const updateCompound = (data: Partial<CompoundState>) => 
    setState(prev => ({ ...prev, compound: { ...prev.compound, ...data } }));

  const updateLoan = (data: Partial<LoanState>) => 
    setState(prev => ({ ...prev, loan: { ...prev.loan, ...data } }));

  const updateInvestment = (data: Partial<InvestmentState>) => 
    setState(prev => ({ ...prev, investment: { ...prev.investment, ...data } }));

  const updateRetirement = (data: Partial<RetirementState>) => 
    setState(prev => ({ ...prev, retirement: { ...prev.retirement, ...data } }));

  const updatePortfolio = (data: Partial<PortfolioState>) => 
    setState(prev => ({ ...prev, portfolio: { ...prev.portfolio, ...data } }));

  const updateInflation = (data: Partial<InflationState>) => 
    setState(prev => ({ ...prev, inflation: { ...prev.inflation, ...data } }));

  const resetCalculator = (key: keyof CalculatorState) => 
    setState(prev => ({ ...prev, [key]: INITIAL_STATE[key] }));

  return (
    <CalculatorContext.Provider value={{ 
      ...state, 
      updateCompound, 
      updateLoan, 
      updateInvestment, 
      updateRetirement, 
      updatePortfolio, 
      updateInflation, 
      resetCalculator 
    }}>
      {children}
    </CalculatorContext.Provider>
  );
}

export function useCalculatorStore() {
  const context = useContext(CalculatorContext);
  if (context === undefined) {
    throw new Error('useCalculatorStore must be used within a CalculatorProvider');
  }
  return context;
}
