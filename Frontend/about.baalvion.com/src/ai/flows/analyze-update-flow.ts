'use server';
/**
 * @fileOverview AI analysis flow for operational updates.
 * 
 * - analyzeUpdate - Suggests impact level and tags based on update description.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeUpdateInputSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string(),
});

const AnalyzeUpdateOutputSchema = z.object({
  suggestedImpactLevel: z.enum(['Low', 'Medium', 'High']),
  suggestedTags: z.array(z.string()),
  suggestedUpdateId: z.string().describe('The next Update ID in sequence, e.g., U003'),
});

export async function analyzeUpdate(input: z.infer<typeof AnalyzeUpdateInputSchema>) {
  try {
    return await analyzeUpdateFlow(input);
  } catch (e) {
    // Demo fallback: no GEMINI_API_KEY (or quota) → return a heuristic analysis so the
    // feature is demonstrable without a key. Set GEMINI_API_KEY to flip to live AI.
    console.warn('[AI] analyze-update fallback (genkit unavailable — set GEMINI_API_KEY for live AI):', (e as Error)?.message);
    const cat = (input.category || 'general').toLowerCase();
    const level: 'Low' | 'Medium' | 'High' =
      /trade|finance|launch|integration|security/.test(cat) ? 'High'
      : /partner|feature|operation|product/.test(cat) ? 'Medium'
      : 'Low';
    return {
      suggestedImpactLevel: level,
      suggestedTags: Array.from(new Set([input.category || 'update', 'operations', 'baalvion'])),
      suggestedUpdateId: 'U' + String(Math.floor(100 + Math.random() * 900)),
    };
  }
}

const analyzeUpdateFlow = ai.defineFlow(
  {
    name: 'analyzeUpdateFlow',
    inputSchema: AnalyzeUpdateInputSchema,
    outputSchema: AnalyzeUpdateOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      output: { schema: AnalyzeUpdateOutputSchema },
      prompt: `You are a strategic operations analyst for Baalvion Industries.
Analyze the following operational update and suggest its impact level, relevant tags, and a candidate Update ID.

Context:
Title: ${input.title}
Category: ${input.category}
Description: ${input.description}

Guidelines:
- High Impact: Direct effect on global trade, large finance integration, or critical system launch.
- Medium Impact: Operational improvements, partner onboarding, or minor feature updates.
- Low Impact: Internal documentation, routine HR updates, or small UI tweaks.
- Tags: Generate 3-5 concise, searchable technical tags.
- Update ID: Suggest a professional sequential ID starting with 'U' followed by 3 digits.`,
    });
    return output!;
  }
);