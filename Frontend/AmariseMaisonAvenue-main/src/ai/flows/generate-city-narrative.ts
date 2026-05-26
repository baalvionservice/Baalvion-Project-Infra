
'use server';
/**
 * @fileOverview A Genkit flow for generating immersive luxury city destination narratives.
 *
 * - generateCityNarrative - A function that handles the narrative generation process.
 * - GenerateCityNarrativeInput - The input type for the function.
 * - GenerateCityNarrativeOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCityNarrativeInputSchema = z.object({
  cityName: z.string().describe('The name of the city destination.'),
  country: z.string().describe('The country context.'),
});
export type GenerateCityNarrativeInput = z.infer<typeof GenerateCityNarrativeInputSchema>;

const GenerateCityNarrativeOutputSchema = z.object({
  narrative: z.string().describe('The immersive luxury narrative for the city.'),
});
export type GenerateCityNarrativeOutput = z.infer<typeof GenerateCityNarrativeOutputSchema>;

export async function generateCityNarrative(
  input: GenerateCityNarrativeInput
): Promise<GenerateCityNarrativeOutput> {
  try {
    return await generateCityNarrativeFlow(input);
  } catch (error) {
    console.warn("AI City Narrative Quota Exceeded. Returning archive entry.");
    return {
      narrative: `The presence of Maison Amarisé in ${input.cityName} represents a dialogue between global excellence and local heritage. In the heart of ${input.country}, our destination serves as a sanctuary for the discerning, where time-honored craft meets the vibrant pulse of the contemporary urban landscape.`
    };
  }
}

const cityNarrativePrompt = ai.definePrompt({
  name: 'cityNarrativePrompt',
  input: {schema: GenerateCityNarrativeInputSchema},
  output: {schema: GenerateCityNarrativeOutputSchema},
  prompt: `You are the Global Editor for the AMARISÉ Journal.
Your task is to write a poetic, sophisticated, and evocative introduction to a luxury city destination.
The tone should be intellectual and highlight the unique "spirit" of the city and its relationship with the Maison.

City: {{{cityName}}}
Country: {{{country}}}

Write a single, powerful paragraph (approx 3-4 sentences) that defines the spirit of this destination:`,
});

const generateCityNarrativeFlow = ai.defineFlow(
  {
    name: 'generateCityNarrativeFlow',
    inputSchema: GenerateCityNarrativeInputSchema,
    outputSchema: GenerateCityNarrativeOutputSchema,
  },
  async input => {
    const {output} = await cityNarrativePrompt(input);
    return output!;
  }
);
