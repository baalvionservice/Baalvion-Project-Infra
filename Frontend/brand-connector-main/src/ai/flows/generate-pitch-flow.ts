'use server';
/**
 * @fileOverview AI Writing Assistant for creator application pitches.
 *
 * - generatePitch - A function that handles the pitch generation process.
 * - GeneratePitchInput - The input type for the pitch generation.
 * - GeneratePitchOutput - The return type for the pitch generation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GeneratePitchInputSchema = z.object({
  creatorNiche: z.string().describe('The primary niche of the creator.'),
  campaignTitle: z.string().describe('The title of the campaign being applied to.'),
  campaignBrief: z.string().describe('A summary of the campaign requirements and goals.'),
  creatorName: z.string().optional().describe('The name of the creator.'),
});
export type GeneratePitchInput = z.infer<typeof GeneratePitchInputSchema>;

const GeneratePitchOutputSchema = z.object({
  pitch: z.string().describe('The generated pitch draft.'),
  suggestedHooks: z.array(z.string()).describe('A few alternate opening hooks for the creator to consider.'),
});
export type GeneratePitchOutput = z.infer<typeof GeneratePitchOutputSchema>;

export async function generatePitch(input: GeneratePitchInput): Promise<GeneratePitchOutput> {
  return generatePitchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePitchPrompt',
  input: { schema: GeneratePitchInputSchema },
  output: { schema: GeneratePitchOutputSchema },
  prompt: `You are an elite talent manager and copywriter helping a creator apply for a high-value brand campaign.

CONTEXT:
Creator Niche: {{{creatorNiche}}}
Campaign: {{{campaignTitle}}}
Brief Summary: {{{campaignBrief}}}
Creator Name: {{{creatorName}}}

TASK:
Generate a professional, persuasive, and authentic application pitch (approx 150-250 words). 
The pitch should:
1. Show genuine interest in the specific campaign.
2. Explain why the creator's audience in the {{{creatorNiche}}} niche is perfect for this brand.
3. Mention a creative vision or "hook" for the content.
4. Maintain a collaborative and professional tone.

OUTPUT:
Provide the full pitch text and 3 alternative high-impact opening hooks.`,
});

const generatePitchFlow = ai.defineFlow(
  {
    name: 'generatePitchFlow',
    inputSchema: GeneratePitchInputSchema,
    outputSchema: GeneratePitchOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('Failed to generate pitch');
    return output;
  }
);
