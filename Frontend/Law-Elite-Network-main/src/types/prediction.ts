/**
 * @fileOverview Core Prediction Type definitions for the Law Elite Network.
 */

export type ComplexityLevel = 'low' | 'medium' | 'high';

export interface CasePrediction {
  caseId: string;
  riskScore: number; // 0-100
  successProbability: number; // 0-100
  complexity: ComplexityLevel;
  insights: string[];
  generatedAt: any;
}
