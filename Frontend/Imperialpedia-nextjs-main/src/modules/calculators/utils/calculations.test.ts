import { describe, it, expect } from 'vitest';
import { financialMath } from './calculations';

/**
 * @fileOverview Unit tests for the financialMath utility.
 * Verifies precision and logic for all platform calculators.
 */

describe('financialMath', () => {
  describe('calculateCompoundInterest', () => {
    it('calculates basic compound interest correctly', () => {
      // $1000 at 5% for 10 years, compounded annually (n=1)
      const result = financialMath.calculateCompoundInterest(1000, 5, 10, 0, 1);
      expect(result).toBeCloseTo(1628.89, 2);
    });

    it('handles monthly compounding', () => {
      // $1000 at 5% for 10 years, compounded monthly (n=12)
      const result = financialMath.calculateCompoundInterest(1000, 5, 10, 0, 12);
      expect(result).toBeCloseTo(1647.01, 2);
    });

    it('handles annual contributions (via the annuity formula part)', () => {
      // $1000 principal + $100/mo ($1200/yr) at 5% for 10 years
      const result = financialMath.calculateCompoundInterest(1000, 5, 10, 100, 1);
      // principal part: 1628.89
      // contribution part: 1200 * ((1.05^10 - 1) / 0.05) = 1200 * 12.57789 = 15093.47
      // Total: 16722.36
      expect(result).toBeCloseTo(16722.36, 2);
    });

    it('returns simple sum when rate is 0', () => {
      const result = financialMath.calculateCompoundInterest(1000, 0, 10, 100, 12);
      expect(result).toBe(13000); // 1000 + (100 * 12 * 10)
    });
  });

  describe('calculateInvestmentGrowth', () => {
    it('calculates iterative monthly growth correctly', () => {
      // $1000 principal, $100 monthly, 5% rate, 1 year
      const result = financialMath.calculateInvestmentGrowth(1000, 100, 5, 1);
      // Month 1: 1000 * (1 + 0.05/12) + 100 = 1104.16
      // Month 12: approx 2282
      expect(result.finalValue).toBeCloseTo(2282.82, 2);
      expect(result.chartData).toHaveLength(2); // Year 0 and Year 1
    });
  });

  describe('calculateMonthlyLoanPayment', () => {
    it('calculates standard mortgage payment correctly', () => {
      // $250,000 at 6.5% for 30 years
      const result = financialMath.calculateMonthlyLoanPayment(250000, 6.5, 30);
      expect(result).toBeCloseTo(1580.17, 2);
    });

    it('handles 0% interest loan', () => {
      // $12,000 at 0% for 1 year
      const result = financialMath.calculateMonthlyLoanPayment(12000, 0, 1);
      expect(result).toBe(1000);
    });

    it('handles very large loans', () => {
      const result = financialMath.calculateMonthlyLoanPayment(10000000, 5, 30);
      expect(result).toBeCloseTo(53682.16, 2);
    });
  });

  describe('calculateInflationImpact', () => {
    it('calculates future equivalent cost correctly', () => {
      // $1000 today with 3% inflation over 10 years
      const result = financialMath.calculateInflationImpact(1000, 3, 10);
      expect(result).toBeCloseTo(1343.92, 2);
    });

    it('returns principal for 0% inflation', () => {
      const result = financialMath.calculateInflationImpact(1000, 0, 10);
      expect(result).toBe(1000);
    });
  });

  describe('calculatePortfolioSummary', () => {
    it('calculates weighted ROI and total values for multiple assets', () => {
      const assets = [
        { name: 'Stocks', investment: 10000, returnRate: 10 }, // Value: 11000
        { name: 'Bonds', investment: 5000, returnRate: 4 }    // Value: 5200
      ];
      const result = financialMath.calculatePortfolioSummary(assets);
      
      expect(result.totalInvestment).toBe(15000);
      expect(result.totalValue).toBe(16200);
      expect(result.totalProfit).toBe(1200);
      expect(result.weightedReturn).toBe(8); // (1200 / 15000) * 100
    });

    it('handles empty asset lists gracefully', () => {
      const result = financialMath.calculatePortfolioSummary([]);
      expect(result.totalInvestment).toBe(0);
      expect(result.totalValue).toBe(0);
      expect(result.weightedReturn).toBe(0);
    });
  });

  describe('calculateRetirementCorpus', () => {
    it('calculates corpus for a 35-year horizon', () => {
      // $50k initial, $1k monthly, 7% rate, age 30 to 65
      const result = financialMath.calculateRetirementCorpus(50000, 1000, 7, 30, 65);
      // Principal growth: 50000 * (1.07^35) approx 533,828
      // Monthly contributions part: approx 1.7M
      expect(result.finalValue).toBeGreaterThan(2000000);
      expect(result.chartData).toHaveLength(36); // Ages 30 to 65 inclusive
    });

    it('handles immediate retirement (same age)', () => {
      const result = financialMath.calculateRetirementCorpus(50000, 1000, 7, 65, 65);
      expect(result.finalValue).toBe(50000);
      expect(result.chartData).toHaveLength(1);
    });
  });
});
