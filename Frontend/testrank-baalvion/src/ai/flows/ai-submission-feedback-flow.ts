'use server';
/**
 * @fileOverview This file implements a Genkit flow to provide AI-generated preliminary feedback on candidate submissions.
 *
 * - aiSubmissionFeedback - A function that generates feedback for a candidate's submission.
 * - SubmissionFeedbackInput - The input type for the aiSubmissionFeedback function.
 * - SubmissionFeedbackOutput - The return type for the aiSubmissionFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SubmissionFeedbackInputSchema = z.object({
  taskDescription: z
    .string()
    .describe(
      'The detailed description of the task that the candidate completed.'
    ),
  submissionContent: z
    .string()
    .describe(
      'The content of the candidate\'s submission (e.g., text, code, or a summary of a linked project).'
    ),
  submissionType: z
    .enum(['text', 'code', 'link_summary'])
    .describe(
      'The type of submission content provided (e.g., "text", "code", "link_summary").'
    ),
});
export type SubmissionFeedbackInput = z.infer<
  typeof SubmissionFeedbackInputSchema
>;

const SubmissionFeedbackOutputSchema = z.object({
  strengths: z
    .array(z.string())
    .describe('An array of identified strengths in the submission.'),
  weaknesses: z
    .array(z.string())
    .describe('An array of identified weaknesses or areas for improvement in the submission.'),
  suggestions: z
    .array(z.string())
    .describe('An array of actionable suggestions for the candidate to improve.'),
  overallScore: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe('An overall score for the submission, ranging from 0 to 100.'),
  overallFeedback: z
    .string()
    .describe(
      'A comprehensive summary of the feedback, integrating strengths, weaknesses, and suggestions.'
    ),
});
export type SubmissionFeedbackOutput = z.infer<
  typeof SubmissionFeedbackOutputSchema
>;

export async function aiSubmissionFeedback(
  input: SubmissionFeedbackInput
): Promise<SubmissionFeedbackOutput> {
  try {
    return await aiSubmissionFeedbackFlow(input);
  } catch (e) {
    // Demo fallback: no GEMINI_API_KEY (or quota) → return illustrative feedback so the
    // feature is demonstrable without a key. Set GEMINI_API_KEY to flip to live AI.
    console.warn('[AI] submission-feedback fallback (genkit unavailable — set GEMINI_API_KEY for live AI):', (e as Error)?.message);
    return {
      strengths: [
        'Addresses the core requirements of the task',
        'Submission is structured and readable',
      ],
      weaknesses: [
        'Edge cases and error handling could be more thorough',
        'Could include more explanation of the approach taken',
      ],
      suggestions: [
        'Add tests or examples that cover boundary conditions',
        'Document key decisions and trade-offs',
        'Tighten naming and formatting for clarity',
      ],
      overallScore: 70,
      overallFeedback:
        'A solid submission that meets the main objectives, with room to strengthen robustness and documentation. (Demo feedback — configure GEMINI_API_KEY for live, evidence-based AI evaluation.)',
    };
  }
}

const submissionFeedbackPrompt = ai.definePrompt({
  name: 'submissionFeedbackPrompt',
  input: {schema: SubmissionFeedbackInputSchema},
  output: {schema: SubmissionFeedbackOutputSchema},
  prompt: `You are an expert hiring manager and technical evaluator for a company. Your role is to provide preliminary, unbiased, and constructive feedback on candidate submissions for a specific task.

Carefully review the provided task description and the candidate's submission. Based on these, identify the strengths, weaknesses, and provide actionable suggestions for improvement. Assign an overall score from 0 to 100.

Task Description:
{{{taskDescription}}}

Candidate Submission (Type: {{{submissionType}}}):
{{{submissionContent}}}

Provide your feedback in a structured JSON format.`,
});

const aiSubmissionFeedbackFlow = ai.defineFlow(
  {
    name: 'aiSubmissionFeedbackFlow',
    inputSchema: SubmissionFeedbackInputSchema,
    outputSchema: SubmissionFeedbackOutputSchema,
  },
  async (input) => {
    const {output} = await submissionFeedbackPrompt(input);
    return output!;
  }
);
