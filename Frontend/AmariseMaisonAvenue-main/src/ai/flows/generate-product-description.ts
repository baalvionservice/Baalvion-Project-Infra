
'use server';
/**
 * @fileOverview A Genkit flow for generating compelling and varied mock product descriptions.
 *
 * - generateProductDescription - A function that handles the product description generation process.
 * - GenerateProductDescriptionInput - The input type for the generateProductDescription function.
 * - GenerateProductDescriptionOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  category: z.string().describe('The category of the product.'),
});
export type GenerateProductDescriptionInput = z.infer<
  typeof GenerateProductDescriptionInputSchema
>;

const GenerateProductDescriptionOutputSchema = z.object({
  description: z.string().describe('The compelling and varied product description.'),
});
export type GenerateProductDescriptionOutput = z.infer<
  typeof GenerateProductDescriptionOutputSchema
>;

/**
 * Enhanced wrapper with fallback logic for quota resilience.
 */
export async function generateProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  try {
    return await generateProductDescriptionFlow(input);
  } catch (error) {
    console.warn("AI Description Quota Exceeded. Returning archive description.");
    return {
      description: `This ${input.productName} has been authenticated in-house and graded before listing. Condition, provenance and hardware are documented in full; each ${input.category} piece is sold as a single unit.`
    };
  }
}

const generateProductDescriptionPrompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: {schema: GenerateProductDescriptionInputSchema},
  output: {schema: GenerateProductDescriptionOutputSchema},
  prompt: `You are an expert luxury product copywriter for a high-end platform called AMARISÉ Luxe.
Your task is to generate a compelling, varied, and sophisticated product description for a product.
The description should highlight the product's luxury aspects, quality, and appeal to a discerning clientele.
Ensure the tone is elegant and persuasive.

Product Name: {{{productName}}}
Product Category: {{{category}}}

Generate a detailed product description:`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async input => {
    const {output} = await generateProductDescriptionPrompt(input);
    return output!;
  }
);
