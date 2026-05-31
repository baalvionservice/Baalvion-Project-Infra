'use server';
/**
 * @fileOverview An AI agent that generates concise and standardized product descriptions for minerals.
 *
 * - generateProductDescription - A function that handles the product description generation process.
 * - GenerateProductDescriptionInput - The input type for the generateProductDescription function.
 * - GenerateProductDescriptionOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDescriptionInputSchema = z.object({
  mineralType: z.string().describe('The type of mineral (e.g., Iron Ore, Copper Concentrate).'),
  grade: z.string().describe('The grade or quality of the mineral (e.g., 62% Fe, 30% Cu).'),
  purity: z.string().describe('The purity level of the mineral (e.g., 99.9% pure, Standard Commercial).'),
  quantity: z.string().describe('The available quantity of the mineral (e.g., 10,000 metric tons, 500 MT).'),
  origin: z.string().describe('The country or region of origin for the mineral (e.g., Brazil, Chile).'),
  certifications: z.array(z.string()).optional().describe('A list of relevant certifications (e.g., ISO 9001, Responsible Sourcing Initiative).'),
  additionalDetails: z.string().optional().describe('Any other relevant free-form details about the product.'),
});
export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

const GenerateProductDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated concise and standardized product description.'),
});
export type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;

export async function generateProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  try {
    return await generateProductDescriptionFlow(input);
  } catch (e) {
    // Demo fallback: no GEMINI_API_KEY (or quota) → return a standardized description so
    // the feature is demonstrable without a key. Set GEMINI_API_KEY to flip to live AI.
    console.warn('[AI] product-description fallback (genkit unavailable — set GEMINI_API_KEY for live AI):', (e as Error)?.message);
    const certs = input.certifications?.length ? ` Certified to ${input.certifications.join(', ')}.` : '';
    const extra = input.additionalDetails ? ` ${input.additionalDetails}` : '';
    return {
      description: `${input.mineralType} (${input.grade}, ${input.purity}) sourced from ${input.origin}. Available quantity: ${input.quantity}. This consignment meets standard B2B commercial specifications with consistent grade and verified provenance, suited for industrial offtake and long-term supply agreements.${certs}${extra} (Demo description — configure GEMINI_API_KEY for live AI.)`,
    };
  }
}

const generateProductDescriptionPrompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: {schema: GenerateProductDescriptionInputSchema},
  output: {schema: GenerateProductDescriptionOutputSchema},
  prompt: `You are an expert product description writer for a B2B mineral trading platform.
Your task is to generate a concise, professional, and standardized product description based on the provided mineral specifications.
Focus on clarity, accuracy, and highlighting key attributes relevant to B2B buyers.

Specifications:
Mineral Type: {{{mineralType}}}
Grade: {{{grade}}}
Purity: {{{purity}}}
Quantity: {{{quantity}}}
Origin: {{{origin}}}
{{#if certifications}}Certifications: {{#each certifications}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if additionalDetails}}Additional Details: {{{additionalDetails}}}{{/if}}

Please generate a professional product description for this mineral.`,
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
