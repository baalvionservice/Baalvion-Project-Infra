'use server';
/**
 * @fileOverview AI Analyst Engine - Multi-Asset Comparison Flow.
 * 
 * - compareMultiAssets - Function to perform a simultaneous analysis of 3 or more assets.
 * - MultiAssetComparisonInput - Schema for the comparison targets.
 * - MultiAssetComparisonOutput - Structured JSON schema for the multi-asset audit.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MultiAssetComparisonInputSchema = z.object({
  assets: z.array(z.string().describe('An asset symbol or name (e.g., AAPL, BTC, GLD).')).min(3).describe('List of at least 3 assets to compare.'),
});
export type MultiAssetComparisonInput = z.infer<typeof MultiAssetComparisonInputSchema>;

const MetricRowSchema = z.object({
  asset: z.string(),
  price: z.string(),
  market_cap: z.string(),
  PE_ratio: z.string().describe('Price to Earnings ratio or equivalent valuation metric.'),
  volume: z.string(),
  sentiment_score: z.string().describe('Net social sentiment score.'),
  performance_trends: z.string(),
  risk_score: z.string().describe('AI-assigned risk level (Low, Medium, High).'),
});

const StrengthWeaknessRowSchema = z.object({
  asset: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
});

const MultiAssetComparisonOutputSchema = z.object({
  overview: z.string().describe('Brief description of all selected assets and comparison purpose.'),
  key_metrics_table: z.array(MetricRowSchema).describe('Comparison table of key metrics for all selected assets.'),
  strengths_weaknesses: z.array(StrengthWeaknessRowSchema).describe('Summarized relative advantages and disadvantages for each asset.'),
  portfolio_recommendation: z.string().describe('Suggested allocation or preference for users based on comparison (e.g., "Allocate 40% X, 30% Y, 30% Z").'),
  confidence_score: z.number().min(0).max(100).describe('AI conviction in the comparison data accuracy.'),
});
export type MultiAssetComparisonOutput = z.infer<typeof MultiAssetComparisonOutputSchema>;

export async function compareMultiAssets(input: MultiAssetComparisonInput): Promise<MultiAssetComparisonOutput> {
  return compareMultiAssetsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'compareMultiAssetsPrompt',
  input: { schema: MultiAssetComparisonInputSchema },
  output: { schema: MultiAssetComparisonOutputSchema },
  prompt: `You are a Senior AI Portfolio Architect.
Your task is to provide a simultaneous comparative analysis of the following assets:

Assets: {{#each assets}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Instructions:
1. Provide a professional Overview explaining the context of this multi-asset comparison (e.g., sector rotation, correlated growth, or risk-parity audit).
2. Generate a Key Metrics Table: Include Price, Market Cap, Valuation (P/E or equiv), Volume, Sentiment, Performance Trends, and a categorical Risk Score (Low/Medium/High) for EACH asset.
3. Summarize Strengths & Weaknesses: Identify 2-3 specific pros and cons for each asset relative to the rest of the group.
4. Provide a Portfolio Recommendation: Suggest a strategic capital allocation or a clear preference if one asset dominates.
5. Assign a Confidence Score (0-100) for the analysis.

Maintain an institutional-grade, analytical tone. Ensure data across all assets is compared consistently.`,
});

const compareMultiAssetsFlow = ai.defineFlow(
  {
    name: 'compareMultiAssetsFlow',
    inputSchema: MultiAssetComparisonInputSchema,
    outputSchema: MultiAssetComparisonOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI Engine failed to generate a valid multi-asset comparison matrix.');
    }
    return output;
  }
);
