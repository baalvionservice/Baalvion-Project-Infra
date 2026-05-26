'use server';
/**
 * @fileOverview An AI content drafting tool for the CMS.
 *
 * - draftContent - A function that generates initial content drafts for pages, sections, or project descriptions.
 * - DraftContentInput - The input type for the draftContent function.
 * - DraftContentOutput - The return type for the draftContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DraftContentInputSchema = z.object({
  contentType: z.string().describe('The type of content to draft (e.g., page, section, project description).'),
  keywords: z.array(z.string()).optional().describe('Keywords relevant to the content.'),
  outline: z.string().optional().describe('A brief outline or key points to include in the content.'),
});
export type DraftContentInput = z.infer<typeof DraftContentInputSchema>;

const DraftContentOutputSchema = z.object({
  draft: z.string().describe('The generated draft content.'),
});
export type DraftContentOutput = z.infer<typeof DraftContentOutputSchema>;

export async function draftContent(input: DraftContentInput): Promise<DraftContentOutput> {
  return draftContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'draftContentPrompt',
  input: { schema: DraftContentInputSchema },
  output: { schema: DraftContentOutputSchema },
  prompt: `You are an AI content writer for "Baalvion Industries Private Limited", a company building "Global trade infrastructure connecting businesses, finance, compliance, and intelligence systems."
Your task is to draft professional, clean, and realistic content for a corporate website.

The website uses a dark premium theme with blue accents and the 'Inter' sans-serif font, aiming for a professional and sophisticated feel. Your content should reflect this tone and quality.

Generate content for a {{{contentType}}}.

{{#if outline}}
Use the following outline or key points:
{{{outline}}}
{{/if}}

{{#if keywords}}
Incorporate these keywords:
{{#each keywords}}- {{{this}}}
{{/each}}
{{/if}}

Ensure the content is engaging for investors, partners, and global users, and aligns with the company's mission.

Draft:`,
});

const draftContentFlow = ai.defineFlow(
  {
    name: 'draftContentFlow',
    inputSchema: DraftContentInputSchema,
    outputSchema: DraftContentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
