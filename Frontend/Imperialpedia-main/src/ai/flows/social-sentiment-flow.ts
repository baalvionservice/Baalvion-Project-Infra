'use server';
/**
 * @fileOverview AI Analyst Engine - Social Sentiment Summary Flow.
 * 
 * - generateSocialSentiment - Function to analyze social perception for an asset.
 * - SocialSentimentInput - Schema for the asset symbol/name.
 * - SocialSentimentOutput - Structured JSON schema for the sentiment audit.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SocialSentimentInputSchema = z.object({
  asset: z.string().describe('The name or symbol of the asset (e.g., TSLA, BTC, Gold).'),
});
export type SocialSentimentInput = z.infer<typeof SocialSentimentInputSchema>;

const SocialSentimentOutputSchema = z.object({
  overview: z.string().describe('Brief description of current social sentiment for the asset.'),
  positive_sentiment: z.array(z.string()).describe('Key positive drivers, popular mentions, or hashtags.'),
  negative_sentiment: z.array(z.string()).describe('Criticisms, concerns, or negative mentions.'),
  neutral_sentiment: z.array(z.string()).describe('Balanced discussions or mixed opinions.'),
  overall_sentiment_score: z.number().min(-100).max(100).describe('Net sentiment score between -100 and +100.'),
  confidence_score: z.number().min(0).max(100).describe('AI conviction in the sentiment analysis (0-100).'),
});
export type SocialSentimentOutput = z.infer<typeof SocialSentimentOutputSchema>;

export async function generateSocialSentiment(input: SocialSentimentInput): Promise<SocialSentimentOutput> {
  return generateSocialSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSocialSentimentPrompt',
  input: { schema: SocialSentimentInputSchema },
  output: { schema: SocialSentimentOutputSchema },
  prompt: `You are an Advanced AI Sentiment Strategist specialized in social listening and market psychology.
Your task is to generate a comprehensive, structured Social Sentiment Summary for the following asset:

Asset: {{{asset}}}

Instructions:
1. Analyze sentiment across social media (X/Twitter, Reddit, Discord) and financial news headlines.
2. Identify specific Positive drivers (e.g., product excitement, bull-posting, influencer support).
3. Identify specific Negative drivers (e.g., fear, uncertainty, doubt, criticisms of management).
4. Summarize Neutral discussions (e.g., technical analysis, macro correlations).
5. Assign an Overall Sentiment Score (-100 to +100).
6. Provide a Confidence Score based on the density of recent social mentions.

Maintain a professional, objective, yet psychologically astute tone. Focus on trending narratives.`,
});

const generateSocialSentimentFlow = ai.defineFlow(
  {
    name: 'generateSocialSentimentFlow',
    inputSchema: SocialSentimentInputSchema,
    outputSchema: SocialSentimentOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI Engine failed to generate a valid social sentiment assessment.');
    }
    return output;
  }
);
