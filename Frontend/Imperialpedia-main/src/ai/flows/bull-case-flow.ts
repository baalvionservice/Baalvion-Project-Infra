'use server';
/**
 * @fileOverview AI Analyst Engine - Bull Case Generation Flow.
 * 
 * - generateBullCase - Function to generate structured bullish analysis for an asset.
 * - BullCaseInput - Schema for the asset symbol/name.
 * - BullCaseOutput - Structured JSON schema for the analytical output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BullCaseInputSchema = z.object({
  asset: z.string().describe('The name or symbol of the asset (e.g., AAPL, BTC, Gold).'),
});
export type BullCaseInput = z.infer<typeof BullCaseInputSchema>;

const BullCaseOutputSchema = z.object({
  overview: z.string().describe('A brief summary of the asset and current market conditions.'),
  catalysts: z.array(z.string()).describe('Key factors or events driving positive growth.'),
  expected_price_range: z.object({
    short_term: z.string().describe('Short-term bullish price target with rationale.'),
    medium_term: z.string().describe('Medium-term bullish price target with rationale.'),
  }),
  confidence_score: z.number().min(0).max(100).describe('Confidence level in the bull case (0-100).'),
  supporting_metrics: z.object({
    social_sentiment: z.string().describe('Current market sentiment overview.'),
    volume_trend: z.string().describe('Recent trading volume trends.'),
    key_kpis: z.array(z.string()).describe('Relevant KPIs supporting the thesis.'),
  }),
});
export type BullCaseOutput = z.infer<typeof BullCaseOutputSchema>;

export async function generateBullCase(input: BullCaseInput): Promise<BullCaseOutput> {
  return generateBullCaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBullCasePrompt',
  input: { schema: BullCaseInputSchema },
  output: { schema: BullCaseOutputSchema },
  prompt: `You are an Advanced AI Analyst specialized in financial markets.
Your task is to generate a comprehensive, data-driven Bull Case for the following asset:

Asset: {{{asset}}}

Include:
1. Overview: Professional summary of the asset and its current stance.
2. Catalysts: At least 3-5 specific growth drivers (earnings, tech shifts, macro events).
3. Price Targets: Specific ranges for short-term (1-3 months) and medium-term (6-12 months) with brief rationale.
4. Confidence: A numerical score representing your conviction.
5. Metrics: Synthesize likely social sentiment, volume trends, and relevant financial KPIs (e.g., Revenue growth, hash rate, inventory levels).

Maintain a professional, objective, yet bullish tone. Ensure all figures and trends are realistic based on current market knowledge.`,
});

const generateBullCaseFlow = ai.defineFlow(
  {
    name: 'generateBullCaseFlow',
    inputSchema: BullCaseInputSchema,
    outputSchema: BullCaseOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI Engine failed to generate a valid bull case scenario.');
    }
    return output;
  }
);
