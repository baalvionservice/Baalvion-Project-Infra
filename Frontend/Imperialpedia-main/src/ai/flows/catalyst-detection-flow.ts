'use server';
/**
 * @fileOverview AI Analyst Engine - Catalyst Detection Flow.
 * 
 * - detectCatalysts - Function to identify key events and drivers for an asset.
 * - CatalystDetectionInput - Schema for the asset symbol/name.
 * - CatalystDetectionOutput - Structured JSON schema for the catalyst analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CatalystDetectionInputSchema = z.object({
  asset: z.string().describe('The name or symbol of the asset (e.g., AAPL, BTC, Crude Oil).'),
});
export type CatalystDetectionInput = z.infer<typeof CatalystDetectionInputSchema>;

const CatalystSchema = z.object({
  description: z.string().describe('Description of the upcoming or recent event/factor.'),
  impact: z.enum(['Positive', 'Negative', 'Neutral']).describe('The expected impact on the asset performance.'),
  confidence_score: z.number().min(0).max(100).describe('AI conviction in this catalyst’s influence (0-100).'),
  recommended_action: z.string().describe('Suggested action for the user based on this catalyst.'),
});

const CatalystDetectionOutputSchema = z.object({
  overview: z.string().describe('Brief description of the asset and its current market context.'),
  catalysts: z.array(CatalystSchema).describe('List of identified catalysts and their impact assessments.'),
});
export type CatalystDetectionOutput = z.infer<typeof CatalystDetectionOutputSchema>;

export async function detectCatalysts(input: CatalystDetectionInput): Promise<CatalystDetectionOutput> {
  return detectCatalystsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectCatalystsPrompt',
  input: { schema: CatalystDetectionInputSchema },
  output: { schema: CatalystDetectionOutputSchema },
  prompt: `You are an Advanced AI Analyst specialized in detecting market drivers and catalysts.
Your task is to identify key events, structural shifts, or macro factors that could impact the following asset:

Asset: {{{asset}}}

Instructions:
1. Analyze upcoming events (earnings, product launches, regulatory deadlines).
2. Evaluate recent macro-economic shifts (rate changes, geopolitical events).
3. For each catalyst, assign an Impact Assessment (Positive/Negative/Neutral) and a Confidence Score.
4. Provide a clear, professional Recommended Action for each catalyst.
5. Provide a summary Overview of the asset's current context.

Maintain a professional, objective, and analytical tone. Focus on high-impact events likely to affect performance in the short-to-medium term.`,
});

const detectCatalystsFlow = ai.defineFlow(
  {
    name: 'detectCatalystsFlow',
    inputSchema: CatalystDetectionInputSchema,
    outputSchema: CatalystDetectionOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI Engine failed to generate a valid catalyst assessment.');
    }
    return output;
  }
);
