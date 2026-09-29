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
  try {
    return await generatePitchFlow(input);
  } catch (e) {
    // Demo fallback: no GEMINI_API_KEY (or quota) → return a curated pitch so the
    // feature is demonstrable without a key. Set GEMINI_API_KEY to flip to live AI.
    console.warn('[AI] pitch fallback (genkit unavailable — set GEMINI_API_KEY for live AI):', (e as Error)?.message);
    const niche = input.creatorNiche || 'your';
    return {
      pitch: `Hi! As a creator focused on ${niche}, I'm genuinely excited about "${input.campaignTitle}". ${input.campaignBrief ? `Your brief — ${input.campaignBrief} — ` : 'Your campaign '}aligns perfectly with my audience, who trust me for authentic ${niche} recommendations. My vision is a story-driven series that frames your brand as the natural centerpiece of a real ${niche} moment, paired with a clear, high-converting call-to-action. I'd love to collaborate and bring a fresh, high-impact creative angle to this partnership.`,
      suggestedHooks: [
        `The one ${niche} upgrade I wish I'd made sooner…`,
        `I tested this for 30 days — here's what actually happened.`,
        `If you're into ${niche}, stop scrolling for a second.`,
      ],
    };
  }
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
