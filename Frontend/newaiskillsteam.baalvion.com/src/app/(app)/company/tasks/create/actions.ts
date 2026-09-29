'use server';

import { aiTaskDescriptionAssistant, type AiTaskDescriptionAssistantInput } from '@/ai/flows/ai-task-description-assistant-flow';
import { z } from 'zod';

const actionInputSchema = z.object({
  taskTitle: z.string(),
  keywords: z.array(z.string()),
  descriptionRequirements: z.string(),
  skillsRequired: z.array(z.string()),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  durationEstimate: z.string(),
});

export async function generateTaskDescriptionAction(
  input: AiTaskDescriptionAssistantInput
) {
  const parsedInput = actionInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: 'Invalid input.' };
  }

  try {
    const output = await aiTaskDescriptionAssistant(parsedInput.data);
    return { success: true, data: output };
  } catch (error) {
    console.error('AI Task Description Assistant failed:', error);
    return { success: false, error: 'Failed to generate description from AI.' };
  }
}
