'use server';
/**
 * @fileOverview AI Analyst Engine - Trend Explanation Flow.
 * 
 * - explainTrend - Function to analyze and explain key trends for a subject.
 * - TrendExplanationInput - Schema for the trend subject.
 * - TrendExplanationOutput - Structured JSON schema for the trend intelligence.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TrendExplanationInputSchema = z.object({
  subject: z.string().describe('The asset, sector, or portfolio to analyze (e.g., TSLA, AI Sector, Crypto Portfolio).'),
});
export type TrendExplanationInput = z.infer<typeof TrendExplanationInputSchema>;

const QuantitativeMetricsSchema = z.object({
  metric_name: z.string().describe('Name of the metric (e.g., Price Growth).'),
  value: z.string().describe('Current absolute value.'),
  change: z.string().describe('Percentage or relative change (e.g., +8%).'),
});

const TrendExplanationOutputSchema = z.object({
  overview: z.string().describe('Brief summary of the trend being analyzed.'),
  key_drivers: z.array(z.string()).describe('Factors influencing the trend.'),
  trend_direction: z.enum(['Bullish', 'Bearish', 'Neutral']).describe('Current directional trajectory.'),
  quantitative_metrics: QuantitativeMetricsSchema.describe('Key performance data points.'),
  potential_impact: z.string().describe('Explanation of how this trend affects performance.'),
  confidence_score: z.number().min(0).max(100).describe('AI conviction in the analysis accuracy.'),
});
export type TrendExplanationOutput = z.infer<typeof TrendExplanationOutputSchema>;

export async function explainTrend(input: TrendExplanationInput): Promise<TrendExplanationOutput> {
  return explainTrendFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainTrendPrompt',
  input: { schema: TrendExplanationInputSchema },
  output: { schema: TrendExplanationOutputSchema },
  prompt: `You are a Senior AI Market Strategist.
Your task is to analyze and explain the primary market trends for the following:

Subject: {{{subject}}}

Instructions:
1. Provide a professional Overview of the current trend environment.
2. Identify at least 3 Key Drivers (market data, sentiment, news, macro).
3. Determine the Trend Direction (Bullish/Bearish/Neutral).
4. Provide Quantitative Metrics (e.g., YTD growth, volume change).
5. Explain the Potential Impact on the subject's future performance.
6. Assign a numerical Confidence Score (0-100).

Maintain an institutional-grade, analytical tone. Focus on structural shifts and actionable data.`,
});

const explainTrendFlow = ai.defineFlow(
  {
    name: 'explainTrendFlow',
    inputSchema: TrendExplanationInputSchema,
    outputSchema: TrendExplanationOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI Engine failed to generate a valid trend explanation.');
    }
    return output;
  }
);
