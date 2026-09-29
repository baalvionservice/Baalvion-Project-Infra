'use server';
/**
 * @fileOverview An AI-powered market intelligence tool that analyzes market data to provide insights into mineral market trends, pricing fluctuations, and demand forecasts.
 *
 * - getMarketInsights - A function that handles the market intelligence analysis process.
 * - GetMarketInsightsInput - The input type for the getMarketInsights function.
 * - GetMarketInsightsOutput - The return type for the getMarketInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GetMarketInsightsInputSchema = z.object({
  mineralType: z.string().describe('The type of mineral to analyze (e.g., gold, copper, lithium).'),
  timeframe: z.string().optional().describe('The timeframe for the analysis (e.g., past year, next quarter, long-term). Defaults to "current trends" if not specified.'),
  region: z.string().optional().describe('The geographical region for the market analysis (e.g., global, North America, Asia). Defaults to "global" if not specified.'),
  specificQuestions: z.string().optional().describe('Any specific questions the user has about the market for the mineral.'),
});
export type GetMarketInsightsInput = z.infer<typeof GetMarketInsightsInputSchema>;

const GetMarketInsightsOutputSchema = z.object({
  summary: z.string().describe('A high-level summary of the market for the specified mineral, considering the timeframe and region.'),
  trends: z.string().describe('A detailed description of current and projected market trends for the mineral.'),
  pricingAnalysis: z.string().describe('An analysis of pricing fluctuations, including historical context, key influencing factors, and potential future movements.'),
  demandForecast: z.string().describe('Forecasts for demand, including factors driving or hindering demand growth.'),
  recommendations: z.string().describe('Actionable recommendations for buyers and sellers based on the market insights.'),
});
export type GetMarketInsightsOutput = z.infer<typeof GetMarketInsightsOutputSchema>;

export async function getMarketInsights(input: GetMarketInsightsInput): Promise<GetMarketInsightsOutput> {
  try {
    return await getMarketInsightsFlow(input);
  } catch (e) {
    // Demo fallback: no GEMINI_API_KEY (or quota) → return curated market intelligence so
    // the feature is demonstrable without a key. Set GEMINI_API_KEY to flip to live AI.
    console.warn('[AI] market-insights fallback (genkit unavailable — set GEMINI_API_KEY for live AI):', (e as Error)?.message);
    const m = input.mineralType || 'the mineral';
    const region = input.region || 'global';
    const tf = input.timeframe || 'current trends';
    return {
      summary: `${m} markets across the ${region} region remain structurally tight under ${tf}, with supply discipline and steady industrial demand keeping the outlook constructive.`,
      trends: `Electrification and infrastructure spending continue to anchor ${m} demand. Supply growth is constrained by permitting timelines and grade decline at mature assets, supporting a firm price floor while inventories stay below the five-year average.`,
      pricingAnalysis: `Prices for ${m} have traded in a defined range, with volatility driven by energy costs, freight, and currency moves. Key upside catalysts: stimulus and supply disruptions; downside risks: demand softening and faster-than-expected new capacity.`,
      demandForecast: `Demand for ${m} is forecast to grow at a mid-single-digit pace over the relevant horizon, led by energy-transition and manufacturing end-uses, partially offset by substitution and efficiency gains.`,
      recommendations: `Buyers: secure forward coverage and diversify origin to manage logistics risk. Sellers: lock margins on strength and prioritise certified, traceable supply to capture a quality premium. (Demo insight — configure GEMINI_API_KEY for live AI.)`,
    };
  }
}

const prompt = ai.definePrompt({
  name: 'getMarketInsightsPrompt',
  input: { schema: GetMarketInsightsInputSchema },
  output: { schema: GetMarketInsightsOutputSchema },
  prompt: `You are an expert market intelligence analyst specializing in the global mineral trade.

Your task is to provide comprehensive insights into the market for a specified mineral, analyzing market data to detail trends, pricing fluctuations, and demand forecasts. Structure your response meticulously according to the provided output schema.

Mineral Type: {{{mineralType}}}
Timeframe: {{{timeframe}}}
Region: {{{region}}}
{{#if specificQuestions}}
Specific Questions: {{{specificQuestions}}}
{{/if}}

Please provide:
- A high-level summary of the market.
- Detailed current and projected market trends.
- An analysis of pricing fluctuations.
- Forecasts for demand.
- Actionable recommendations for buyers and sellers.`
});

const getMarketInsightsFlow = ai.defineFlow(
  {
    name: 'getMarketInsightsFlow',
    inputSchema: GetMarketInsightsInputSchema,
    outputSchema: GetMarketInsightsOutputSchema,
  },
  async (input) => {
    // Provide default values for optional fields before passing to the prompt
    const processedInput = {
      ...input,
      timeframe: input.timeframe || 'current trends',
      region: input.region || 'global',
    };

    const { output } = await prompt(processedInput);
    return output!;
  }
);
