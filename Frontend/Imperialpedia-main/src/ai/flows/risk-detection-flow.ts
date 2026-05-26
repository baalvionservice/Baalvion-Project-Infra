'use server';
/**
 * @fileOverview AI Analyst Engine - Risk Flag Detection Flow.
 * 
 * - detectRiskFlags - Function to identify anomalies and risks for an asset.
 * - RiskDetectionInput - Schema for the asset symbol/name.
 * - RiskDetectionOutput - Structured JSON schema for the risk analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RiskDetectionInputSchema = z.object({
  asset: z.string().describe('The name or symbol of the asset (e.g., NVDA, SOL, Gold).'),
});
export type RiskDetectionInput = z.infer<typeof RiskDetectionInputSchema>;

const RiskFlagSchema = z.object({
  description: z.string().describe('Detailed description of the detected risk or anomaly.'),
  severity: z.enum(['Low', 'Medium', 'High']).describe('The impact level of the risk.'),
  confidence_score: z.number().min(0).max(100).describe('AI conviction in this specific flag (0-100).'),
  recommendation: z.string().describe('Actionable advice or next steps for the user.'),
});

const RiskDetectionOutputSchema = z.object({
  overview: z.string().describe('Brief description of the asset’s current market conditions and volatility state.'),
  risk_flags: z.array(RiskFlagSchema).describe('List of detected risks or anomalies.'),
  overall_confidence: z.number().min(0).max(100).describe('Average confidence score for the entire risk audit.'),
});
export type RiskDetectionOutput = z.infer<typeof RiskDetectionOutputSchema>;

export async function detectRiskFlags(input: RiskDetectionInput): Promise<RiskDetectionOutput> {
  return detectRiskFlagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectRiskFlagsPrompt',
  input: { schema: RiskDetectionInputSchema },
  output: { schema: RiskDetectionOutputSchema },
  prompt: `You are an Advanced AI Integrity Auditor specialized in financial market anomalies.
Your task is to detect and flag potential risks, unusual activity, or structural vulnerabilities for the following asset:

Asset: {{{asset}}}

Instructions:
1. Analyze historical price action, volume distribution, and social sentiment trends.
2. Identify specific anomalies such as:
   - "Flash" price swings (e.g., 5%+ move in < 1hr).
   - Abnormal volume spikes (distribution vs accumulation).
   - Regulatory warnings or legal headwinds.
   - Drastic social sentiment decay.
3. For each flag, assign a Severity (Low/Medium/High) and a Confidence Score.
4. Provide a clear, professional Recommendation for each flag.
5. Provide a summary Overview of the current volatility state.

Maintain a professional, objective, and cautious tone. If no high-confidence risks are detected, focus on standard market volatility markers.`,
});

const detectRiskFlagsFlow = ai.defineFlow(
  {
    name: 'detectRiskFlagsFlow',
    inputSchema: RiskDetectionInputSchema,
    outputSchema: RiskDetectionOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI Engine failed to generate a valid risk assessment.');
    }
    return output;
  }
);
