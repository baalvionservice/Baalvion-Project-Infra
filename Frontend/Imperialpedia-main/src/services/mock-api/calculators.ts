/**
 * @deprecated Use real API calls via `@/lib/api-client` instead.
 * This file is kept for backwards compatibility with existing imports.
 */
import { ApiResponse } from '@/types';
import { FinancialCalculator } from '@/types/financial-tools';
import { financialMath } from '@/modules/calculators/utils/calculations';

/**
 * @fileOverview Mock service for managing financial calculator metadata and logic.
 */

export interface Calculator extends FinancialCalculator {}

export const mockCalculators: Calculator[] = [
  {
    id: 'calc-compound',
    name: 'Compound Interest',
    slug: 'compound-interest',
    type: 'compound',
    description: 'Visualize the exponential growth of your savings through compounding interest and regular contributions.',
    category: 'Wealth Building',
    icon: 'TrendingUp'
  },
  {
    id: 'calc-loan',
    name: 'Loan Repayment',
    slug: 'loan',
    type: 'loan',
    description: 'Calculate monthly payments, total interest, and payoff timelines for mortgages, auto loans, or personal debt.',
    category: 'Debt Management',
    icon: 'CreditCard'
  },
  {
    id: 'calc-investment',
    name: 'Investment ROI',
    slug: 'investment',
    type: 'investment',
    description: 'Estimate the potential return on investment for stocks, real estate, or business ventures.',
    category: 'Investing',
    icon: 'PieChart'
  },
  {
    id: 'calc-retirement',
    name: 'Retirement Planner',
    slug: 'retirement',
    type: 'retirement',
    description: 'Determine if you are on track for your retirement goals based on current savings and expected returns.',
    category: 'Retirement',
    icon: 'Sunrise'
  },
  {
    id: 'calc-portfolio',
    name: 'Portfolio ROI Architect',
    slug: 'portfolio',
    type: 'portfolio',
    description: 'Architect a diversified portfolio and analyze aggregate returns across multiple asset classes.',
    category: 'Investing',
    icon: 'Layers'
  },
  {
    id: 'calc-inflation',
    name: 'Inflation Impact',
    slug: 'inflation',
    type: 'inflation',
    description: 'Understand how purchasing power changes over time and how inflation affects your long-term goals.',
    category: 'Economics',
    icon: 'ArrowUpRight'
  },
];

export const getCalculatorList = async (): Promise<ApiResponse<Calculator[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    data: mockCalculators,
    status: 200,
  };
};

/**
 * MOCK CALCULATION ENGINE
 * Centralized logic for all financial instruments.
 */

export const calculateCompoundInterest = async (principal: number, rate: number, years: number, monthly: number, frequency: number): Promise<ApiResponse<number>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const result = financialMath.calculateCompoundInterest(principal, rate, years, monthly, frequency);
  return { data: result, status: 200 };
};

export const calculateLoanSummary = async (principal: number, rate: number, years: number): Promise<ApiResponse<any>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const result = financialMath.getLoanSummary(principal, rate, years);
  return { data: result, status: 200 };
};

export const calculateInvestmentGrowth = async (principal: number, monthly: number, rate: number, years: number): Promise<ApiResponse<any>> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const result = financialMath.calculateInvestmentGrowth(principal, monthly, rate, years);
  return { data: result, status: 200 };
};

export const calculateRetirementCorpus = async (savings: number, monthly: number, rate: number, currentAge: number, retirementAge: number): Promise<ApiResponse<any>> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const result = financialMath.calculateRetirementCorpus(savings, monthly, rate, currentAge, retirementAge);
  return { data: result, status: 200 };
};

export const calculatePortfolioSummary = async (assets: any[]): Promise<ApiResponse<any>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const result = financialMath.calculatePortfolioSummary(assets);
  return { data: result, status: 200 };
};

export const calculateInflationImpact = async (amount: number, rate: number, years: number): Promise<ApiResponse<number>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const result = financialMath.calculateInflationImpact(amount, rate, years);
  return { data: result, status: 200 };
};
