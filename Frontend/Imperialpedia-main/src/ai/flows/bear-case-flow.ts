'use server';
/**
 * @fileOverview AI Analyst Engine - Bear Case Generation Flow.
 * 
 * - generateBearCase - Function to generate structured bearish analysis for an asset.
 * - BearCaseInput - Schema for the asset symbol/name.
 * - BearCaseOutput - Structured JSON schema for the analytical output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BearCaseInputSchema = z.object({
  asset: z.string().describe('The name or symbol of the asset (e.g., TSLA, ETH, Crude Oil).'),
});
export type BearCaseInput = z.infer<typeof BearCaseInputSchema>;

const BearCaseOutputSchema = z.object({
  overview: z.string().describe('A brief summary of the asset and its current vulnerabilities or market headwinds.'),
  risks: z.array(z.string()).describe('Key risks or negative catalysts (regulatory shifts, competitive threats, poor guidance).'),
  expected_price_range: z.object({
    short_term: z.string().describe('Short-term bearish price target with rationale.'),
    medium_term: z.string().describe('Medium-term bearish price target with rationale.'),
  }),
  confidence_score: z.number().min(0).max(100).describe('Confidence level in the bear case (0-100).'),
  supporting_metrics: z.object({
    social_sentiment: z.string().describe('Current market fear or skepticism overview.'),
    volume_trend: z.string().describe('Recent trading volume trends or distribution patterns.'),
    key_kpis: z.array(z.string()).describe('Negative KPIs or underperforming metrics.'),
  }),
});
export type BearCaseOutput = z.infer<typeof BearCaseOutputSchema>;

export async function generateBearCase(input: BearCaseInput): Promise<BearCaseOutput> {
  return generateBearCaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBearCasePrompt',
  input: { schema: BearCaseInputSchema },
  output: { schema: BearCaseOutputSchema },
  prompt: `You are an Advanced AI Risk Analyst specialized in financial markets.
Your task is to generate a comprehensive, data-driven Bear Case for the following asset:

Asset: {{{asset}}}

Include:
1. Overview: Professional summary of the asset's current vulnerabilities and the primary bearish thesis.
2. Risks: At least 3-5 specific negative catalysts (regulatory crackdowns, earnings misses, competitive displacement, macro headwinds).
3. Price Targets: Specific ranges for short-term (1-3 months) and medium-term (6-12 months) with brief rationale for the downside.
4. Confidence: A numerical score representing your conviction in the bearish outlook.
5. Metrics: Synthesize social fear/skepticism, volume distribution trends, and deteriorating financial KPIs.

Maintain a professional, objective, yet bearish tone. Ensure all figures and trends are realistic based on potential downside scenarios.`,
});

const generateBearCaseFlow = ai.defineFlow(
  {
    name: 'generateBearCaseFlow',
    inputSchema: BearCaseInputSchema,
    outputSchema: BearCaseOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI Engine failed to generate a valid bear case scenario.');
    }
    return output;
  }
);
