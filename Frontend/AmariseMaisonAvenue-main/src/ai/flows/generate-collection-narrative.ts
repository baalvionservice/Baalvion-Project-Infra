
'use server';
/**
 * @fileOverview A Genkit flow for generating immersive luxury collection narratives.
 *
 * - generateCollectionNarrative - A function that handles the narrative generation process.
 * - GenerateCollectionNarrativeInput - The input type for the function.
 * - GenerateCollectionNarrativeOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCollectionNarrativeInputSchema = z.object({
  collectionName: z.string().describe('The name of the luxury collection.'),
  baseDescription: z.string().describe('The core theme or short description.'),
});
export type GenerateCollectionNarrativeInput = z.infer<
  typeof GenerateCollectionNarrativeInputSchema
>;

const GenerateCollectionNarrativeOutputSchema = z.object({
  narrative: z.string().describe('The long-form immersive luxury narrative.'),
});
export type GenerateCollectionNarrativeOutput = z.infer<
  typeof GenerateCollectionNarrativeOutputSchema
>;

/**
 * Enhanced wrapper with fallback logic for quota resilience.
 */
export async function generateCollectionNarrative(
  input: GenerateCollectionNarrativeInput
): Promise<GenerateCollectionNarrativeOutput> {
  try {
    return await generateCollectionNarrativeFlow(input);
  } catch (error) {
    console.warn("AI Collection Narrative Quota Exceeded. Returning curated narrative.");
    return {
      narrative: `The ${input.collectionName} series at Maison Amarisé represents a profound dialogue between the archives of 1924 and the contemporary vision of our master artisans. ${input.baseDescription}. Each piece serves as a testament to the pursuit of perfection, hand-selected for the world's most discerning connoisseurs.`
    };
  }
}

const collectionNarrativePrompt = ai.definePrompt({
  name: 'collectionNarrativePrompt',
  input: {schema: GenerateCollectionNarrativeInputSchema},
  output: {schema: GenerateCollectionNarrativeOutputSchema},
  prompt: `You are the lead storyteller for AMARISÉ Luxe, a prestigious global luxury house.
Your task is to write an immersive, poetic, and sophisticated narrative for a new collection.
The narrative should evoke emotion, heritage, and the pursuit of perfection.
Use sophisticated vocabulary and an elegant tone.

Collection: {{{collectionName}}}
Theme: {{{baseDescription}}}

Write a multi-paragraph narrative that invites the reader into the world of this collection:`,
});

const generateCollectionNarrativeFlow = ai.defineFlow(
  {
    name: 'generateCollectionNarrativeFlow',
    inputSchema: GenerateCollectionNarrativeInputSchema,
    outputSchema: GenerateCollectionNarrativeOutputSchema,
  },
  async input => {
    const {output} = await collectionNarrativePrompt(input);
    return output!;
  }
);
