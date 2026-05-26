'use server';
/**
 * @fileOverview AI Analyst Engine - Macro Summary Generation Flow.
 * 
 * - generateMacroSummary - Function to identify macroeconomic drivers for a subject.
 * - MacroSummaryInput - Schema for the asset, sector, or portfolio.
 * - MacroSummaryOutput - Structured JSON schema for the economic analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MacroSummaryInputSchema = z.object({
  subject: z.string().describe('The asset, sector, or portfolio to analyze (e.g., S&P 500, Tech Sector, BTC).'),
});
export type MacroSummaryInput = z.infer<typeof MacroSummaryInputSchema>;

const MacroSummaryOutputSchema = z.object({
  overview: z.string().describe('Brief description of the macroeconomic environment affecting the subject.'),
  key_indicators: z.object({
    GDP_growth: z.string().describe('Current GDP growth metrics.'),
    inflation: z.string().describe('Current inflation rates and benchmarks.'),
    interest_rate: z.string().describe('Current interest rate levels and policy state.'),
    unemployment: z.string().describe('Current unemployment data.'),
    sector_indexes: z.array(z.string()).describe('Relevant sector-specific indexes or benchmarks.'),
  }),
  recent_trends: z.array(z.string()).describe('Summary of recent changes in economic indicators.'),
  potential_impacts: z.array(z.string()).describe('How these macro trends may affect the subject’s performance.'),
  confidence_score: z.number().min(0).max(100).describe('AI conviction in this analysis (0-100).'),
});
export type MacroSummaryOutput = z.infer<typeof MacroSummaryOutputSchema>;

export async function generateMacroSummary(input: MacroSummaryInput): Promise<MacroSummaryOutput> {
  return generateMacroSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMacroSummaryPrompt',
  input: { schema: MacroSummaryInputSchema },
  output: { schema: MacroSummaryOutputSchema },
  prompt: `You are an Advanced AI Macro Strategist specialized in global economic cycles.
Your task is to generate a comprehensive, structured Macroeconomic Summary for the following:

Subject: {{{subject}}}

Instructions:
1. Provide a professional Overview of the macro environment relative to the subject.
2. Extract Key Indicators: GDP Growth, Inflation, Interest Rates, Unemployment, and Sector Indexes.
3. Summarize 3-5 Recent Trends (e.g., hawkish Fed, supply chain easing, consumer spending shifts).
4. Explain 3-5 Potential Impacts on the subject's future performance.
5. Provide a numerical Confidence Score for the data synthesis.

Maintain a sophisticated, analytical, and data-driven tone. Focus on institutional-grade economic signals.`,
});

const generateMacroSummaryFlow = ai.defineFlow(
  {
    name: 'generateMacroSummaryFlow',
    inputSchema: MacroSummaryInputSchema,
    outputSchema: MacroSummaryOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI Engine failed to generate a valid macroeconomic assessment.');
    }
    return output;
  }
);
