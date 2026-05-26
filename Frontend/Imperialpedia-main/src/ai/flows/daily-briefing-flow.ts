'use server';
/**
 * @fileOverview AI Analyst Engine - Daily AI Briefing Flow.
 * 
 * - generateDailyBriefing - Function to generate a structured daily market summary.
 * - DailyBriefingInput - Schema for the briefing scope (e.g., Global, Crypto, Tech).
 * - DailyBriefingOutput - Structured JSON schema for the briefing digest.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DailyBriefingInputSchema = z.object({
  scope: z.string().describe('The scope of the briefing (e.g., "Global Markets", "Crypto & Web3", "S&P 500").'),
});
export type DailyBriefingInput = z.infer<typeof DailyBriefingInputSchema>;

const AssetChangeSchema = z.object({
  asset: z.string().describe('Name or symbol of the asset.'),
  change: z.string().describe('Percentage or value change (e.g., "+8%").'),
});

const DailyBriefingOutputSchema = z.object({
  overview: z.string().describe('Brief summary of overall market conditions.'),
  top_gainers: z.array(AssetChangeSchema).describe('List of top performing assets.'),
  top_losers: z.array(AssetChangeSchema).describe('List of bottom performing assets.'),
  key_news_events: z.array(z.string()).describe('Summary of major news, announcements, or macro events.'),
  social_sentiment_highlights: z.array(z.string()).describe('Key sentiment trends from social media and forums.'),
  ai_recommendations: z.array(z.string()).describe('Suggested actions based on analysis and risk flags.'),
  confidence_score: z.number().min(0).max(100).describe('Confidence level in the briefing (0-100).'),
});
export type DailyBriefingOutput = z.infer<typeof DailyBriefingOutputSchema>;

export async function generateDailyBriefing(input: DailyBriefingInput): Promise<DailyBriefingOutput> {
  return generateDailyBriefingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailyBriefingPrompt',
  input: { schema: DailyBriefingInputSchema },
  output: { schema: DailyBriefingOutputSchema },
  prompt: `You are an Advanced AI Market Strategist.
Your task is to generate a structured Daily AI Briefing for the following scope:

Scope: {{{scope}}}

Instructions:
1. Provide a professional Overview of the current market state (volatility, sector leaders, macro backdrop).
2. Identify 3-5 Top Gainers and 3-5 Top Losers with realistic percentage shifts.
3. Summarize 3-5 Key News/Events impacting the market (earnings, partnerships, regulatory shifts).
4. Extract 2-3 Social Sentiment Highlights (trending narratives, FUD, bull-posting).
5. Provide 3-5 Actionable AI Recommendations (buy/sell/hold/hedge) with rationale.
6. Assign a numerical Confidence Score based on data density.

Maintain a sophisticated, institutional-grade tone. Ensure all insights are concise and data-driven.`,
});

const generateDailyBriefingFlow = ai.defineFlow(
  {
    name: 'generateDailyBriefingFlow',
    inputSchema: DailyBriefingInputSchema,
    outputSchema: DailyBriefingOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI Engine failed to generate a valid daily briefing.');
    }
    return output;
  }
);
