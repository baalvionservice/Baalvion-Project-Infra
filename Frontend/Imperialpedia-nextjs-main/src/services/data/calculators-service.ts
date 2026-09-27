import * as mockApi from '@/services/mock-api/calculators';
import { ApiResponse } from '@/types';
import { Calculator } from '@/services/mock-api/calculators';
import { errorHandler } from '@/lib/errors/error-handler';

/**
 * @fileOverview Abstraction layer for calculator-related data fetching and logic with error handling.
 */

export const calculatorsService = {
  async getCalculatorList(): Promise<ApiResponse<Calculator[]>> {
    try {
      return await mockApi.getCalculatorList();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async calculateCompound(principal: number, rate: number, years: number, monthly: number = 0, frequency: number = 12): Promise<ApiResponse<number | null>> {
    try {
      return await mockApi.calculateCompoundInterest(principal, rate, years, monthly, frequency);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return { data: null, status: appError.statusCode, error: appError.message };
    }
  },

  async calculateLoan(principal: number, rate: number, years: number): Promise<ApiResponse<any>> {
    try {
      return await mockApi.calculateLoanSummary(principal, rate, years);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return { data: null, status: appError.statusCode, error: appError.message };
    }
  },

  async calculateInvestment(principal: number, monthly: number, rate: number, years: number): Promise<ApiResponse<any>> {
    try {
      return await mockApi.calculateInvestmentGrowth(principal, monthly, rate, years);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return { data: null, status: appError.statusCode, error: appError.message };
    }
  },

  async calculateRetirement(savings: number, monthly: number, rate: number, currentAge: number, retirementAge: number): Promise<ApiResponse<any>> {
    try {
      return await mockApi.calculateRetirementCorpus(savings, monthly, rate, currentAge, retirementAge);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return { data: null, status: appError.statusCode, error: appError.message };
    }
  },

  async calculatePortfolio(assets: any[]): Promise<ApiResponse<any>> {
    try {
      return await mockApi.calculatePortfolioSummary(assets);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return { data: null, status: appError.statusCode, error: appError.message };
    }
  },

  async calculateInflation(amount: number, rate: number, years: number): Promise<ApiResponse<number | null>> {
    try {
      return await mockApi.calculateInflationImpact(amount, rate, years);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return { data: null, status: appError.statusCode, error: appError.message };
    }
  }
};
