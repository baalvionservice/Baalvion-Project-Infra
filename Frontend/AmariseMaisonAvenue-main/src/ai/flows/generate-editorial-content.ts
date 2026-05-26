
'use server';
/**
 * @fileOverview A Genkit flow for generating luxury editorial journal content.
 *
 * - generateEditorialContent - A function that handles the storytelling process.
 * - GenerateEditorialContentInput - The input type for the function.
 * - GenerateEditorialContentOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEditorialContentInputSchema = z.object({
  topic: z.string().describe('The core theme of the editorial article.'),
  category: z.enum(['Seasonal', 'City Edit', 'VIP Exclusive', 'Artisanal']).describe('The category of the story.'),
  country: z.string().describe('The regional context for the story.'),
  isVip: z.boolean().describe('Whether the story is for VIP clients.'),
});
export type GenerateEditorialContentInput = z.infer<typeof GenerateEditorialContentInputSchema>;

const GenerateEditorialContentOutputSchema = z.object({
  title: z.string().describe('An evocative, sophisticated title.'),
  excerpt: z.string().describe('A compelling 1-sentence summary.'),
  content: z.string().describe('The full multi-paragraph editorial narrative.'),
});
export type GenerateEditorialContentOutput = z.infer<typeof GenerateEditorialContentOutputSchema>;

/**
 * Enhanced wrapper with fallback logic for quota resilience.
 */
export async function generateEditorialContent(
  input: GenerateEditorialContentInput
): Promise<GenerateEditorialContentOutput> {
  try {
    return await generateEditorialContentFlow(input);
  } catch (error) {
    console.warn("AI Editorial Content Quota Exceeded. Returning archive article.");
    return {
      title: `${input.topic}: The Maison Perspective`,
      excerpt: `An exploration of ${input.topic} within the context of the ${input.country} hub.`,
      content: `In the heart of our ${input.country} atelier, the dialogue between heritage and human brilliance remains our guiding light. The study of ${input.topic} reveals a deeper commitment to the artisanal standard that has defined the Maison since 1924. As we continue to curate the world's most significant artifacts, we find that rarity is not merely an attribute, but a philosophy. This volume of the AMARISÉ Journal serves as an invitation to the connoisseur seeking to master the art of acquisition.`
    };
  }
}

const editorialPrompt = ai.definePrompt({
  name: 'editorialPrompt',
  input: {schema: GenerateEditorialContentInputSchema},
  output: {schema: GenerateEditorialContentOutputSchema},
  prompt: `You are the Lead Storyteller for the AMARISÉ Journal, the prestigious digital editorial of a global luxury house.
Your task is to write a poetic, immersive, and intellectual editorial piece.

Topic: {{{topic}}}
Category: {{{category}}}
Market: {{{country}}}
Target: {{#if isVip}}Bespoke Private Clients{{else}}Global Connoisseurs{{/if}}

Style Guidelines:
- Tone: Intellectual, exclusive, evocative, and timeless.
- Vocabulary: Sophisticated, architectural, artisanal.
- Structure: Start with a powerful title. The content should be 3-4 deep paragraphs that invite the reader into a world of craft and heritage.

Focus on the spirit of the market ({{{country}}}) and how it intertwines with the topic.`,
});

const generateEditorialContentFlow = ai.defineFlow(
  {
    name: 'generateEditorialContentFlow',
    inputSchema: GenerateEditorialContentInputSchema,
    outputSchema: GenerateEditorialContentOutputSchema,
  },
  async input => {
    const {output} = await editorialPrompt(input);
    return output!;
  }
);
