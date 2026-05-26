
'use server';
/**
 * @fileOverview A Genkit flow for generating luxury buying guide narratives.
 *
 * - generateBuyingGuideNarrative - A function that handles the guide generation process.
 * - GenerateBuyingGuideInput - The input type for the function.
 * - GenerateBuyingGuideOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBuyingGuideInputSchema = z.object({
  category: z.string().describe('The luxury category (e.g., Watches, Jewelry).'),
  country: z.string().describe('The market context.'),
});
export type GenerateBuyingGuideInput = z.infer<typeof GenerateBuyingGuideInputSchema>;

const GenerateBuyingGuideOutputSchema = z.object({
  narrative: z.string().describe('The multi-paragraph buying guide narrative.'),
  tips: z.array(z.string()).describe('A list of artisanal buying tips.'),
});
export type GenerateBuyingGuideOutput = z.infer<typeof GenerateBuyingGuideOutputSchema>;

export async function generateBuyingGuideNarrative(
  input: GenerateBuyingGuideInput
): Promise<GenerateBuyingGuideOutput> {
  try {
    return await generateBuyingGuideNarrativeFlow(input);
  } catch (error) {
    console.warn("AI Buying Guide Quota Exceeded. Returning archive guide.");
    return {
      narrative: `In the heart of the ${input.category} department at Maison Amarisé, we believe that the acquisition of an artifact is a journey of the soul. Whether in the bustling avenues of New York or the golden markets of Dubai, our connoisseurs seek only the pinnacle of excellence.`,
      tips: [
        "Seek the hallmark of the master artisan.",
        "Consider the heritage significance of the material.",
        "Prioritize artifacts with a documented provenance."
      ]
    };
  }
}

const buyingGuidePrompt = ai.definePrompt({
  name: 'buyingGuidePrompt',
  input: {schema: GenerateBuyingGuideInputSchema},
  output: {schema: GenerateBuyingGuideOutputSchema},
  prompt: `You are the Lead Curator for AMARISÉ Luxe.
Your task is to write a sophisticated, intellectual, and evocative buying guide for a specific category.
The tone must be exclusive, highlighting heritage and artisanal depth.

Category: {{{category}}}
Market: {{{country}}}

Style Guidelines:
- Tone: Poetic, authoritative, and timeless.
- Vocabulary: Sophisticated, horological, artisanal.
- Structure: Start with a powerful 3-paragraph narrative. Follow with a list of 3-5 specific expert tips.

Focus on how to identify true quality and the "spirit" of the category within the {{{country}}} market.`,
});

const generateBuyingGuideNarrativeFlow = ai.defineFlow(
  {
    name: 'generateBuyingGuideNarrativeFlow',
    inputSchema: GenerateBuyingGuideInputSchema,
    outputSchema: GenerateBuyingGuideOutputSchema,
  },
  async input => {
    const {output} = await buyingGuidePrompt(input);
    return output!;
  }
);
