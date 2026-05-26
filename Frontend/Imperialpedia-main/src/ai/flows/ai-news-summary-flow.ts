'use server';
/**
 * @fileOverview AI Analyst Engine - News Summary Flow.
 * 
 * - generateNewsSummary - Function to synthesize news landscape for an asset or sector.
 * - NewsSummaryInput - Schema for the search subject.
 * - NewsSummaryOutput - Structured JSON schema for the news intelligence.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NewsSummaryInputSchema = z.object({
  subject: z.string().describe('The asset, sector, or portfolio to analyze (e.g., AAPL, Semiconductors, Tech Portfolio).'),
});
export type NewsSummaryInput = z.infer<typeof NewsSummaryInputSchema>;

const HeadlineSchema = z.object({
  headline: z.string().describe('The news article title or main hook.'),
  source: z.string().describe('The credible source of the news (e.g., Bloomberg, Reuters).'),
  sentiment: z.enum(['Positive', 'Negative', 'Neutral']).describe('The sentiment of the headline relative to the subject.'),
  potential_impact: z.string().describe('Short explanation of how this item affects performance.'),
});

const NewsSummaryOutputSchema = z.object({
  overview: z.string().describe('Brief description of the news landscape affecting the subject.'),
  top_headlines: z.array(HeadlineSchema).describe('List of key news items with analysis.'),
  confidence_score: z.number().min(0).max(100).describe('AI conviction in the summary accuracy (0-100).'),
});
export type NewsSummaryOutput = z.infer<typeof NewsSummaryOutputSchema>;

export async function generateNewsSummary(input: NewsSummaryInput): Promise<NewsSummaryOutput> {
  return generateNewsSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNewsSummaryPrompt',
  input: { schema: NewsSummaryInputSchema },
  output: { schema: NewsSummaryOutputSchema },
  prompt: `You are an Advanced AI Financial News Editor.
Your task is to provide a structured, analytical summary of the news landscape for the following:

Subject: {{{subject}}}

Instructions:
1. Provide a professional Overview of the news landscape (regulatory environment, earnings cycle, macro trends).
2. Identify 3-5 Top Headlines from credible financial sources.
3. For each headline, provide a Sentiment Analysis (Positive/Negative/Neutral) and a clear Potential Impact explanation.
4. Assign a numerical Confidence Score based on data density and source reliability.

Maintain an institutional-grade, objective tone. Focus on high-impact developments that affect short-to-medium term performance.`,
});

const generateNewsSummaryFlow = ai.defineFlow(
  {
    name: 'generateNewsSummaryFlow',
    inputSchema: NewsSummaryInputSchema,
    outputSchema: NewsSummaryOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI Engine failed to generate a valid news intelligence report.');
    }
    return output;
  }
);
