'use server';
/**
 * @fileOverview An AI-assisted tool to generate initial article outlines and suggested key topics for financial content.
 *
 * - generateArticleOutline - A function that handles the generation of article outlines and key topics.
 * - AIContentOutlineToolInput - The input type for the generateArticleOutline function.
 * - AIContentOutlineToolOutput - The return type for the generateArticleOutline function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIContentOutlineToolInputSchema = z.object({
  financialSubject: z.string().describe('The financial subject for which to generate an article outline and key topics.'),
});
export type AIContentOutlineToolInput = z.infer<typeof AIContentOutlineToolInputSchema>;

const AIContentOutlineToolOutputSchema = z.object({
  articleTitle: z.string().describe('A suggested, SEO-friendly title for the article.'),
  outline: z
    .array(
      z.object({
        heading: z.string().describe('The main heading for this section of the article.'),
        subSections: z.array(z.string()).describe('A list of sub-sections or key points to cover within this main heading.'),
      })
    )
    .describe('A structured outline for the financial article, broken down into main headings and sub-sections.'),
  keyTopics: z.array(z.string()).describe('A list of SEO-optimized keywords and key topics relevant to the financial subject.'),
});
export type AIContentOutlineToolOutput = z.infer<typeof AIContentOutlineToolOutputSchema>;

export async function generateArticleOutline(input: AIContentOutlineToolInput): Promise<AIContentOutlineToolOutput> {
  return aiContentOutlineToolFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiContentOutlineToolPrompt',
  input: {schema: AIContentOutlineToolInputSchema},
  output: {schema: AIContentOutlineToolOutputSchema},
  prompt: `You are an expert financial content creator and SEO specialist. Your task is to generate a comprehensive, SEO-optimized article outline and a list of key topics for a given financial subject.

Generate a suggested article title, a detailed article outline with main headings and relevant sub-sections, and a list of key topics that should be covered to ensure high-quality and discoverable content.

Financial Subject: {{{financialSubject}}}`,
});

const aiContentOutlineToolFlow = ai.defineFlow(
  {
    name: 'aiContentOutlineToolFlow',
    inputSchema: AIContentOutlineToolInputSchema,
    outputSchema: AIContentOutlineToolOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
