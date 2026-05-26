'use server';
/**
 * @fileOverview An AI assistant that generates clear, concise, and comprehensive task descriptions based on company requirements.
 *
 * - aiTaskDescriptionAssistant - A function that handles the generation of task descriptions.
 * - AiTaskDescriptionAssistantInput - The input type for the aiTaskDescriptionAssistant function.
 * - AiTaskDescriptionAssistantOutput - The return type for the aiTaskDescriptionAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const AiTaskDescriptionAssistantInputSchema = z.object({
  taskTitle: z.string().describe('The intended title of the task.'),
  keywords: z.array(z.string()).describe('Keywords related to the task, helpful for context.'),
  descriptionRequirements: z.string().describe('Specific requirements or key points to include in the description.'),
  skillsRequired: z.array(z.string()).describe('Skills expected from the candidate for this task.'),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).describe('The intended difficulty level of the task.'),
  durationEstimate: z.string().describe('An estimate of how long the task should take (e.g., "4 hours", "2 days").'),
});
export type AiTaskDescriptionAssistantInput = z.infer<typeof AiTaskDescriptionAssistantInputSchema>;

// Output Schema
const AiTaskDescriptionAssistantOutputSchema = z.object({
  generatedDescription: z.string().describe('The AI-generated comprehensive task description.'),
});
export type AiTaskDescriptionAssistantOutput = z.infer<typeof AiTaskDescriptionAssistantOutputSchema>;

// Wrapper function
export async function aiTaskDescriptionAssistant(input: AiTaskDescriptionAssistantInput): Promise<AiTaskDescriptionAssistantOutput> {
  return aiTaskDescriptionAssistantFlow(input);
}

// Prompt definition
const prompt = ai.definePrompt({
  name: 'aiTaskDescriptionAssistantPrompt',
  input: {schema: AiTaskDescriptionAssistantInputSchema},
  output: {schema: AiTaskDescriptionAssistantOutputSchema},
  prompt: `You are an expert HR and recruitment assistant specializing in creating clear, concise, and comprehensive task descriptions for skill assessment platforms.
Your goal is to generate a detailed task description based on the provided requirements, making sure it is engaging, informative, and clearly outlines what a candidate needs to do and what skills are being assessed.

Use the following information to create the task description:

Task Title: {{{taskTitle}}}
Keywords: {{#each keywords}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Description Requirements: {{{descriptionRequirements}}}
Skills Required: {{#each skillsRequired}}- {{{this}}}
{{/each}}
Difficulty: {{{difficulty}}}
Estimated Duration: {{{durationEstimate}}}

Generate a comprehensive task description that:
1. Clearly states the objective of the task.
2. Outlines the specific deliverables expected from the candidate.
3. Mentions the key skills that will be assessed.
4. Provides a brief context if necessary.
5. Is well-structured with clear headings or bullet points.
6. Is suitable for a professional hiring platform.`,
});

// Flow definition
const aiTaskDescriptionAssistantFlow = ai.defineFlow(
  {
    name: 'aiTaskDescriptionAssistantFlow',
    inputSchema: AiTaskDescriptionAssistantInputSchema,
    outputSchema: AiTaskDescriptionAssistantOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate task description.');
    }
    return output;
  }
);
