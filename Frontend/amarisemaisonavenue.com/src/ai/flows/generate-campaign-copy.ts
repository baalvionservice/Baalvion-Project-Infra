'use server';
/**
 * @fileOverview A Genkit flow for generating luxury marketing campaign copy.
 *
 * - generateCampaignCopy - A function that handles the copy generation process.
 * - GenerateCampaignCopyInput - The input type for the function.
 * - GenerateCampaignCopyOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCampaignCopyInputSchema = z.object({
  campaignType: z.enum(['email', 'push']).describe('The type of marketing campaign.'),
  productName: z.string().describe('The name of the featured product.'),
  category: z.string().describe('The luxury category.'),
  country: z.string().describe('The target market/country.'),
});
export type GenerateCampaignCopyInput = z.infer<typeof GenerateCampaignCopyInputSchema>;

const GenerateCampaignCopyOutputSchema = z.object({
  subjectLine: z.string().describe('An evocative, sophisticated subject line.'),
  bodyText: z.string().describe('The core message or push body text.'),
});
export type GenerateCampaignCopyOutput = z.infer<typeof GenerateCampaignCopyOutputSchema>;

/**
 * Enhanced wrapper with fallback logic for quota resilience.
 */
export async function generateCampaignCopy(
  input: GenerateCampaignCopyInput
): Promise<GenerateCampaignCopyOutput> {
  try {
    return await generateCampaignCopyFlow(input);
  } catch (error) {
    console.warn("AI Campaign Copy Quota Exceeded or API Error. Returning archive copy.");
    if (input.campaignType === 'email') {
      return {
        subjectLine: `An Invitation to the ${input.category} Archive`,
        bodyText: `The presence of the ${input.productName} in our ${input.country} atelier marks a significant moment for the Maison. We invite you to explore this artifact of human brilliance.`
      };
    } else {
      return {
        subjectLine: "Maison Alert",
        bodyText: `The ${input.productName} has arrived in the ${input.country} registry. Discover the absolute standard.`
      };
    }
  }
}

const campaignCopyPrompt = ai.definePrompt({
  name: 'campaignCopyPrompt',
  input: {
    schema: GenerateCampaignCopyInputSchema.extend({
      isEmail: z.boolean().describe('True if campaign type is email'),
    }),
  },
  output: {schema: GenerateCampaignCopyOutputSchema},
  prompt: `You are the Global Marketing Director for AMARISÉ Luxe.
Your task is to write high-end marketing copy for a new campaign in the {{{country}}} market.
The tone must be exclusive, sophisticated, and evocative. Use vocabulary that suggests heritage, craft, and rarity.

Type: {{{campaignType}}}
Product: {{{productName}}} ({{{category}}})
Region: {{{country}}}

{{#if isEmail}}
Write a subject line that invites curiosity and a brief 2-sentence opening body. Ensure the subject line is high-authority and exclusive.
{{else}}
Write a punchy, ultra-luxury push notification (max 120 chars). Focus on rarity and immediate action for the connoisseur.
{{/if}}`,
});

const generateCampaignCopyFlow = ai.defineFlow(
  {
    name: 'generateCampaignCopyFlow',
    inputSchema: GenerateCampaignCopyInputSchema,
    outputSchema: GenerateCampaignCopyOutputSchema,
  },
  async input => {
    const {output} = await campaignCopyPrompt({
      ...input,
      isEmail: input.campaignType === 'email',
    });
    return output!;
  }
);