'use server';
/**
 * @fileOverview AI Analyst Engine - Sector Overview Generation Flow.
 * 
 * - generateSectorOverview - Function to identify industry-wide drivers, players, and metrics.
 * - SectorOverviewInput - Schema for the sector or industry name.
 * - SectorOverviewOutput - Structured JSON schema for the sector analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SectorOverviewInputSchema = z.object({
  sector: z.string().describe('The name of the industry or sector to analyze (e.g., Fintech, Semiconductors, Renewable Energy).'),
});
export type SectorOverviewInput = z.infer<typeof SectorOverviewInputSchema>;

const SectorOverviewOutputSchema = z.object({
  overview: z.string().describe('Brief description of the sector and its current market environment.'),
  key_players: z.array(z.string()).describe('List of major companies or assets within the sector.'),
  performance_metrics: z.object({
    sector_index: z.string().describe('Relevant sector indices or benchmarks.'),
    growth_rate: z.string().describe('Estimated or historical growth rate for the sector.'),
    recent_trends: z.array(z.string()).describe('Summary of recent changes or trends in the sector.'),
  }),
  opportunities: z.array(z.string()).describe('Emerging trends, growth drivers, and potential investment opportunities.'),
  risks: z.array(z.string()).describe('Sector-specific risks, regulatory challenges, or market pressures.'),
  confidence_score: z.number().min(0).max(100).describe('AI conviction in this analysis (0-100).'),
});
export type SectorOverviewOutput = z.infer<typeof SectorOverviewOutputSchema>;

export async function generateSectorOverview(input: SectorOverviewInput): Promise<SectorOverviewOutput> {
  return generateSectorOverviewFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSectorOverviewPrompt',
  input: { schema: SectorOverviewInputSchema },
  output: { schema: SectorOverviewOutputSchema },
  prompt: `You are an Advanced AI Sector Strategist specialized in industry lifecycle analysis.
Your task is to generate a comprehensive, structured Sector Overview for the following:

Sector/Industry: {{{sector}}}

Instructions:
1. Provide a professional Overview of the sector's current stance in the global economy.
2. Identify 3-5 Key Players (leading corporations or institutional-grade assets).
3. Extract Performance Metrics: Relevant Index performance, Growth Rates (YoY), and 3-5 Recent Trends.
4. Explain 3-5 Strategic Opportunities (emerging tech, underserved markets).
5. Explain 3-5 Sector Risks (regulatory shifts, supply chain vulnerabilities, competitive displacement).
6. Provide a numerical Confidence Score for the data synthesis.

Maintain a sophisticated, institutional-grade tone. Focus on structural drivers rather than short-term noise.`,
});

const generateSectorOverviewFlow = ai.defineFlow(
  {
    name: 'generateSectorOverviewFlow',
    inputSchema: SectorOverviewInputSchema,
    outputSchema: SectorOverviewOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI Engine failed to generate a valid sector assessment.');
    }
    return output;
  }
);
