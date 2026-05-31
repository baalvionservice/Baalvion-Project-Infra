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
  try {
    return await generateContentIdeasFlow(input);
  } catch (e) {
    // Demo fallback: no GEMINI_API_KEY (or quota) → return curated ideas so the feature
    // is demonstrable without a key. Set GEMINI_API_KEY to flip to live AI.
    console.warn('[AI] content-ideas fallback (genkit unavailable — set GEMINI_API_KEY for live AI):', (e as Error)?.message);
    const niche = input.creatorNiche || 'lifestyle';
    return {
      ideas: [
        { title: `${input.campaignTitle}: First Impressions`, format: 'Reel', hook: 'You asked, so I finally tried it…', keyMessage: `Why this is made for the ${niche} audience`, engagementTip: 'Ask viewers to comment their #1 question.' },
        { title: 'A Day In My Life, Featuring…', format: 'Story Series', hook: 'POV: the upgrade nobody told you about', keyMessage: 'Natural, authentic brand integration', engagementTip: 'Use a poll sticker for instant interaction.' },
        { title: 'The Honest Review', format: 'Long-form Video', hook: 'I was skeptical. Here is the truth.', keyMessage: 'Build trust through transparency', engagementTip: 'Pin a comment inviting follow-up questions.' },
        { title: 'Before & After', format: 'Carousel', hook: 'Swipe to see the difference', keyMessage: 'Tangible, visual results', engagementTip: 'End on a "save this for later" prompt.' },
        { title: `3 Things You Didn't Know About ${niche}`, format: 'Reel', hook: 'Number 2 surprised me', keyMessage: 'Educational value plus brand fit', engagementTip: 'Ask "which one shocked you?" in the caption.' },
      ],
    };
  }
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
