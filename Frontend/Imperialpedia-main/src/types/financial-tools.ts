import { ID, Slug } from './common';

/**
 * @fileOverview Type definitions for the Financial Tools and Calculators platform.
 */

export type CalculatorType = 
  | "compound" 
  | "loan" 
  | "investment" 
  | "retirement" 
  | "portfolio" 
  | "inflation";

export interface FinancialCalculator {
  id: ID;
  slug: Slug;
  type: CalculatorType;
  name: string;
  description: string;
  category: string;
  icon: string;
}

export interface CalculationResult {
  value: number;
  formattedValue: string;
  details?: Record<string, any>;
}
