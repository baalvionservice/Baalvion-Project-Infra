'use server';
/**
 * @fileOverview AI Analyst Engine - Asset Comparison Flow.
 * 
 * - compareAssets - Function to perform a side-by-side analysis of two assets.
 * - AssetComparisonInput - Schema for the comparison targets.
 * - AssetComparisonOutput - Structured JSON schema for the comparative audit.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssetComparisonInputSchema = z.object({
  assetA: z.string().describe('The first asset symbol or name (e.g., AAPL, BTC).'),
  assetB: z.string().describe('The second asset symbol or name (e.g., MSFT, ETH).'),
});
export type AssetComparisonInput = z.infer<typeof AssetComparisonInputSchema>;

const MetricComparisonSchema = z.object({
  asset: z.string(),
  price: z.string(),
  market_cap: z.string(),
  PE_ratio: z.string().describe('Price to Earnings ratio or equivalent metric.'),
  volume: z.string(),
  sentiment_score: z.string().describe('Net social sentiment score.'),
  performance_trends: z.string(),
});

const StrengthWeaknessSchema = z.object({
  asset: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
});

const AssetComparisonOutputSchema = z.object({
  overview: z.string().describe('Executive summary of the comparison context.'),
  key_metrics_comparison: z.array(MetricComparisonSchema).length(2),
  strengths_weaknesses: z.array(StrengthWeaknessSchema).length(2),
  ai_recommendation: z.string().describe('Clear preference or neutral stance with strategic reasoning.'),
  confidence_score: z.number().min(0).max(100).describe('AI conviction in the comparison data accuracy.'),
});
export type AssetComparisonOutput = z.infer<typeof AssetComparisonOutputSchema>;

export async function compareAssets(input: AssetComparisonInput): Promise<AssetComparisonOutput> {
  return compareAssetsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'compareAssetsPrompt',
  input: { schema: AssetComparisonInputSchema },
  output: { schema: AssetComparisonOutputSchema },
  prompt: `You are an Advanced AI Investment Strategist.
Your task is to provide a side-by-side comparative analysis of the following two assets:

Asset A: {{{assetA}}}
Asset B: {{{assetB}}}

Instructions:
1. Provide a professional Overview of why these assets are being compared (e.g., sector rivals, store of value vs utility).
2. Compare Key Metrics: Price, Market Cap, Valuation (P/E or equivalent), Liquidity (Volume), Sentiment, and Trends.
3. Identify 2-3 specific Strengths and 2-3 Weaknesses for EACH asset relative to its peer.
4. Provide a clear AI Recommendation: Which asset is preferred for specific goals (Growth, Value, Risk-adjusted return)?
5. Assign a Confidence Score based on current data density.

Maintain an institutional-grade, objective tone. Use realistic figures based on current market knowledge.`,
});

const compareAssetsFlow = ai.defineFlow(
  {
    name: 'compareAssetsFlow',
    inputSchema: AssetComparisonInputSchema,
    outputSchema: AssetComparisonOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI Engine failed to generate a valid comparison matrix.');
    }
    return output;
  }
);
