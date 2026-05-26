'use server';
/**
 * @fileOverview AI Analyst Engine - Weekly AI Digest Flow.
 * 
 * - generateWeeklyDigest - Function to generate a structured 7-day market summary.
 * - WeeklyDigestInput - Schema for the digest scope (e.g., "Tech Sector", "Global Markets").
 * - WeeklyDigestOutput - Structured JSON schema for the weekly retrospective.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const WeeklyDigestInputSchema = z.object({
  scope: z.string().describe('The scope of the weekly digest (e.g., "Global Markets", "S&P 500").'),
});
export type WeeklyDigestInput = z.infer<typeof WeeklyDigestInputSchema>;

const AssetPerformanceSchema = z.object({
  asset: z.string().describe('Name or symbol of the asset.'),
  weekly_change: z.string().describe('Percentage change over the last 7 days (e.g., "+12%").'),
});

const WeeklyDigestOutputSchema = z.object({
  overview: z.string().describe('Brief summary of weekly market trends and key sector performance.'),
  top_performing_assets: z.array(AssetPerformanceSchema).describe('List of highest weekly gainers.'),
  worst_performing_assets: z.array(AssetPerformanceSchema).describe('List of largest weekly losers.'),
  key_news_events: z.array(z.string()).describe('Summary of significant announcements, earnings, or macro events.'),
  social_sentiment_trends: z.array(z.string()).describe('Summary of sentiment shifts and trending discussions.'),
  ai_insights_recommendations: z.array(z.string()).describe('Actionable insights based on bull/bear scenarios and catalysts.'),
  confidence_score: z.number().min(0).max(100).describe('Confidence level in the weekly synthesis (0-100).'),
});
export type WeeklyDigestOutput = z.infer<typeof WeeklyDigestOutputSchema>;

export async function generateWeeklyDigest(input: WeeklyDigestInput): Promise<WeeklyDigestOutput> {
  return generateWeeklyDigestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWeeklyDigestPrompt',
  input: { schema: WeeklyDigestInputSchema },
  output: { schema: WeeklyDigestOutputSchema },
  prompt: `You are an Advanced AI Portfolio Strategist.
Your task is to generate a structured Weekly AI Digest for the following scope:

Scope: {{{scope}}}

Instructions:
1. Provide a professional Overview of the market trends over the past 7 days.
2. Identify 3-5 Top Performing Assets and 3-5 Worst Performing Assets with realistic weekly percentage shifts.
3. Summarize the 3-5 most impactful News/Events (earnings beats, regulatory shifts, macro data).
4. Analyze 2-3 Social Sentiment Trends (how narratives shifted from Monday to Friday).
5. Provide 3-5 Actionable AI Recommendations (capital allocation, hedging, or monitoring) with rationale.
6. Assign a numerical Confidence Score based on data density and correlation strength.

Maintain a sophisticated, institutional-grade tone. Focus on longitudinal trends rather than daily noise.`,
});

const generateWeeklyDigestFlow = ai.defineFlow(
  {
    name: 'generateWeeklyDigestFlow',
    inputSchema: WeeklyDigestInputSchema,
    outputSchema: WeeklyDigestOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI Engine failed to generate a valid weekly digest.');
    }
    return output;
  }
);
