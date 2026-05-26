'use server';
/**
 * @fileOverview AI Analyst Engine - Earnings Summary Generation Flow.
 * 
 * - generateEarningsSummary - Function to generate structured earnings analysis for a company.
 * - EarningsSummaryInput - Schema for the company symbol/name.
 * - EarningsSummaryOutput - Structured JSON schema for the earnings audit.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EarningsSummaryInputSchema = z.object({
  asset: z.string().describe('The name or symbol of the company (e.g., AAPL, TSLA, MSFT).'),
});
export type EarningsSummaryInput = z.infer<typeof EarningsSummaryInputSchema>;

const EarningsSummaryOutputSchema = z.object({
  overview: z.string().describe('Brief description of the company and recent performance context.'),
  earnings_highlights: z.object({
    revenue: z.string().describe('Reported revenue with YoY change.'),
    net_income: z.string().describe('Reported net income with YoY change.'),
    EPS: z.string().describe('Earnings Per Share vs Expectations.'),
    YoY_change: z.string().describe('Overall year-over-year growth metric.'),
  }),
  performance_vs_estimates: z.string().describe('Detailed comparison of results against analyst expectations.'),
  key_drivers: z.array(z.string()).describe('Factors influencing earnings results (products, costs, macro).'),
  forward_guidance: z.string().describe('Company outlook and projected performance for the next cycle.'),
  confidence_score: z.number().min(0).max(100).describe('AI conviction in summary accuracy (0-100).'),
});
export type EarningsSummaryOutput = z.infer<typeof EarningsSummaryOutputSchema>;

export async function generateEarningsSummary(input: EarningsSummaryInput): Promise<EarningsSummaryOutput> {
  return generateEarningsSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEarningsSummaryPrompt',
  input: { schema: EarningsSummaryInputSchema },
  output: { schema: EarningsSummaryOutputSchema },
  prompt: `You are an Advanced AI Financial Auditor specialized in corporate earnings analysis.
Your task is to generate a comprehensive, structured Earnings Summary for the following company:

Company/Asset: {{{asset}}}

Instructions:
1. Analyze the most recent quarterly earnings report.
2. Extract key highlights: Revenue, Net Income, EPS, and YoY changes.
3. Compare performance directly against analyst estimates (Beats/Misses).
4. Identify 3-5 primary drivers of the performance (e.g., cost cutting, new product adoption, currency headwinds).
5. Summarize the management's Forward Guidance and outlook.
6. Provide a confidence score for the data synthesis.

Maintain a professional, objective, and analytical tone. Focus on high-impact financial data points.`,
});

const generateEarningsSummaryFlow = ai.defineFlow(
  {
    name: 'generateEarningsSummaryFlow',
    inputSchema: EarningsSummaryInputSchema,
    outputSchema: EarningsSummaryOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI Engine failed to generate a valid earnings summary.');
    }
    return output;
  }
);
