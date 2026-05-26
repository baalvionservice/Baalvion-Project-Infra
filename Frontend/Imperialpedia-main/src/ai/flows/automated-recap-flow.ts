'use server';
/**
 * @fileOverview AI Analyst Engine - Automated Recap Generator Flow.
 * 
 * - generateAutomatedRecap - Function to synthesize a market recap for a specific period.
 * - AutomatedRecapInput - Schema for the period and subject.
 * - AutomatedRecapOutput - Structured JSON schema for the recap intelligence.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AutomatedRecapInputSchema = z.object({
  period: z.enum(['Day', 'Week', 'Month']).describe('The timeframe for the recap.'),
  subject: z.string().describe('The asset, sector, or portfolio to summarize (e.g., TSLA, Tech Sector, My Portfolio).'),
});
export type AutomatedRecapInput = z.infer<typeof AutomatedRecapInputSchema>;

const KeyMovementSchema = z.object({
  asset: z.string().describe('Name or symbol of the asset.'),
  change: z.string().describe('Percentage or value change (e.g., "+8%").'),
});

const SocialSentimentRecapSchema = z.object({
  positive: z.string().describe('Summary of positive sentiment trends.'),
  negative: z.string().describe('Summary of negative sentiment trends.'),
  neutral: z.string().describe('Summary of neutral or informational trends.'),
});

const AutomatedRecapOutputSchema = z.object({
  overview: z.string().describe('High-level summary of the period’s market performance.'),
  key_movements: z.array(KeyMovementSchema).describe('Major price/volume changes for tracked assets.'),
  notable_events: z.array(z.string()).describe('Critical news, announcements, or macro updates.'),
  social_sentiment_recap: SocialSentimentRecapSchema.describe('Summary of emotional market shifts.'),
  ai_recommendations: z.array(z.string()).describe('Suggested actions based on analysis.'),
  confidence_score: z.number().min(0).max(100).describe('AI conviction in the recap accuracy (0-100).'),
});
export type AutomatedRecapOutput = z.infer<typeof AutomatedRecapOutputSchema>;

export async function generateAutomatedRecap(input: AutomatedRecapInput): Promise<AutomatedRecapOutput> {
  return generateAutomatedRecapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAutomatedRecapPrompt',
  input: { schema: AutomatedRecapInputSchema },
  output: { schema: AutomatedRecapOutputSchema },
  prompt: `You are a Senior AI Market Research Director.
Your task is to generate a concise, high-fidelity Automated Recap for the following:

Period: {{{period}}}
Subject: {{{subject}}}

Instructions:
1. Provide a professional Overview summarizing the market performance during this period.
2. Identify 3-5 Key Movements (price/volume) for assets relevant to the subject.
3. Summarize 3-5 Notable Events (earnings, policy, geopolitical) that occurred.
4. Provide a Social Sentiment Recap (Positive, Negative, Neutral summaries).
5. Extract 3-5 Actionable AI Recommendations/Insights based on the data.
6. Assign a numerical Confidence Score based on data density and source reliability.

Maintain an institutional-grade, objective tone. Focus on high-impact developments.`,
});

const generateAutomatedRecapFlow = ai.defineFlow(
  {
    name: 'generateAutomatedRecapFlow',
    inputSchema: AutomatedRecapInputSchema,
    outputSchema: AutomatedRecapOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI Engine failed to generate a valid automated recap.');
    }
    return output;
  }
);
