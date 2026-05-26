'use server';
/**
 * @fileOverview An AI agent that generates a concise summary of a business's key performance trends, anomalies, and noteworthy events.
 *
 * - generatePerformanceInsights - A function that handles the generation of performance insights.
 * - AiPerformanceInsightsInput - The input type for the generatePerformanceInsights function.
 * - AiPerformanceInsightsOutput - The return type for the generatePerformanceInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiPerformanceInsightsInputSchema = z.object({
  businessName: z.string().describe('The name of the business.'),
  country: z.string().describe('The primary country of operation for the business.'),
  currency: z.string().describe('The primary currency used by the business (e.g., USD, INR).'),
  currentMetrics: z.object({
    revenue: z.number().describe('The most recent revenue figure.'),
    profit: z.number().describe('The most recent profit figure.'),
    employees: z.number().describe('The current number of employees.'),
    domainsCount: z.number().describe('The number of domains owned by the business.'),
  }).describe('Current key performance indicators for the business.'),
  notableEvents: z.array(z.string()).describe('A list of recent significant events or achievements for the business.'),
  equitySplit: z.string().describe(
    "A summary of the business's equity distribution (e.g., 'Founder A: 50%, Founder B: 30%')."
  ),
});
export type AiPerformanceInsightsInput = z.infer<typeof AiPerformanceInsightsInputSchema>;

const AiPerformanceInsightsOutputSchema = z.object({
  summary: z.string().describe(
    "A concise summary of the business's key performance trends, anomalies, and notable events."
  ),
});
export type AiPerformanceInsightsOutput = z.infer<typeof AiPerformanceInsightsOutputSchema>;

export async function generatePerformanceInsights(
  input: AiPerformanceInsightsInput
): Promise<AiPerformanceInsightsOutput> {
  return aiPerformanceInsightsFlow(input);
}

const aiPerformanceInsightsPrompt = ai.definePrompt({
  name: 'aiPerformanceInsightsPrompt',
  input: { schema: AiPerformanceInsightsInputSchema },
  output: { schema: AiPerformanceInsightsOutputSchema },
  prompt: `You are an expert business analyst for Baalvion, a global business operating system. Your task is to provide a concise, context-aware summary of a business's key performance trends, potential anomalies, and noteworthy events based on the provided data. Aim for a summary that helps a business owner quickly grasp the overall health and identify areas needing attention.\n\nBusiness Name: {{{businessName}}}\nCountry: {{{country}}}\nCurrency: {{{currency}}}\n\nCurrent Key Metrics:\n- Revenue: {{{currency}}} {{{currentMetrics.revenue}}}\n- Profit: {{{currency}}} {{{currentMetrics.profit}}}\n- Employees: {{{currentMetrics.employees}}}\n- Domains: {{{currentMetrics.domainsCount}}}\n\nEquity Split: {{{equitySplit}}}\n\nNotable Events:\n{{#if notableEvents}}\n{{#each notableEvents}}\n- {{{this}}}\n{{/each}}\n{{else}}\nNone reported.\n{{/if}}\n\nProvide your analysis and summary below, focusing on trends (even implied ones from current metrics), anomalies, and the impact of notable events.`,
});

const aiPerformanceInsightsFlow = ai.defineFlow(
  {
    name: 'aiPerformanceInsightsFlow',
    inputSchema: AiPerformanceInsightsInputSchema,
    outputSchema: AiPerformanceInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await aiPerformanceInsightsPrompt(input);
    return output!;
  }
);
