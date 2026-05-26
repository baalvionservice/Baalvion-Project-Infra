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
  return analyzeUpdateFlow(input);
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