'use server';
/**
 * @fileOverview AI Content Idea Generation for creators.
 *
 * - generateContentIdeas - A function that handles the brainstorming process.
 * - ContentIdeasInput - The input type for the flow.
 * - ContentIdeasOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ContentIdeaSchema = z.object({
  title: z.string().describe('A catchy title for the content idea.'),
  format: z.string().describe('The content format (e.g., Reel, Carousel, Long-form Video).'),
  hook: z.string().describe('The opening hook to grab attention in the first 3 seconds.'),
  keyMessage: z.string().describe('The primary value proposition or message to convey.'),
  engagementTip: z.string().describe('A specific tip to increase comments or shares.'),
});

const ContentIdeasInputSchema = z.object({
  campaignTitle: z.string().describe('The title of the campaign.'),
  campaignBrief: z.string().describe('The brief or requirements of the campaign.'),
  creatorNiche: z.string().describe('The primary niche of the creator.'),
});
export type ContentIdeasInput = z.infer<typeof ContentIdeasInputSchema>;

const ContentIdeasOutputSchema = z.object({
  ideas: z.array(ContentIdeaSchema).describe('A list of 5 creative content ideas.'),
});
export type ContentIdeasOutput = z.infer<typeof ContentIdeasOutputSchema>;

export async function generateContentIdeas(input: ContentIdeasInput): Promise<ContentIdeasOutput> {
  return generateContentIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateContentIdeasPrompt',
  input: { schema: ContentIdeasInputSchema },
  output: { schema: ContentIdeasOutputSchema },
  prompt: `You are a world-class social media strategist and creative director. 
Your goal is to help a creator in the {{{creatorNiche}}} niche come up with 5 viral-ready content ideas for the following brand campaign.

CAMPAIGN: {{{campaignTitle}}}
BRIEF: {{{campaignBrief}}}

TASK:
Generate 5 distinct content ideas. For each idea, provide:
1. A catchy title.
2. The ideal format (Reel, Story, Post, etc.)
3. A high-impact opening hook.
4. The key message that aligns with the campaign brief.
5. A specific engagement tip (e.g., "Ask a question about X in the comments").

Ensure the ideas feel authentic to the {{{creatorNiche}}} niche while hitting all the brand's objectives.`,
});

const generateContentIdeasFlow = ai.defineFlow(
  {
    name: 'generateContentIdeasFlow',
    inputSchema: ContentIdeasInputSchema,
    outputSchema: ContentIdeasOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('Failed to generate content ideas');
    return output;
  }
);
