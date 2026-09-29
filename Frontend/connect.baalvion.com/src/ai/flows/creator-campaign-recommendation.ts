'use server';
/**
 * @fileOverview An AI agent for recommending campaigns to creators.
 *
 * - creatorCampaignRecommendation - A function that handles the campaign recommendation process for a creator.
 * - CreatorCampaignRecommendationInput - The input type for the creatorCampaignRecommendation function.
 * - CreatorCampaignRecommendationOutput - The return type for the creatorCampaignRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SocialMediaStatsSchema = z.object({
  followers: z.number().describe('Number of followers on this platform.'),
  engagementRate: z.number().describe('Average engagement rate (0-1) on this platform.'),
});

const AvailableCampaignSchema = z.object({
  id: z.string().describe('The ID of the campaign.'),
  name: z.string().describe('The name of the campaign.'),
  description: z.string().describe('A detailed description of the campaign, including objectives, requirements, deliverables, and target audience.'),
  brandGuidelinesSummary: z.string().optional().describe('A summary of the brand guidelines for this campaign.'),
  requiredNiches: z.array(z.string()).optional().describe('Specific niches required by the campaign.'),
  minFollowers: z.number().optional().describe('Minimum follower count required for creators.'),
  minEngagementRate: z.number().optional().describe('Minimum engagement rate required for creators.'),
});

const CreatorCampaignRecommendationInputSchema = z.object({
  creatorId: z.string().describe('The ID of the creator.'),
  creatorNiches: z.array(z.string()).describe('The primary niches the creator operates in.'),
  creatorPortfolioDescription: z.string().describe('A summary description of the creator\'s portfolio and work style.'),
  creatorSocialMediaStats: z.record(z.string(), SocialMediaStatsSchema).describe('Social media statistics for the creator across various platforms.'),
  creatorPastCampaignIds: z.array(z.string()).describe('List of campaign IDs the creator has already participated in or applied to. Campaigns with these IDs must NOT be recommended.'),
  availableCampaigns: z.array(AvailableCampaignSchema).describe('A list of active campaigns available for recommendation.'),
});
export type CreatorCampaignRecommendationInput = z.infer<typeof CreatorCampaignRecommendationInputSchema>;

const RecommendedCampaignSchema = z.object({
  campaignId: z.string().describe('The ID of the recommended campaign.'),
  campaignName: z.string().describe('The name of the recommended campaign.'),
  matchScore: z.number().min(0).max(100).describe('A score (0-100) indicating how well this campaign matches the creator\'s profile.'),
  reasoning: z.string().describe('A brief explanation of why this campaign is a good match for the creator, referencing their niches, portfolio, and engagement.'),
});

const CreatorCampaignRecommendationOutputSchema = z.object({
  recommendations: z.array(RecommendedCampaignSchema).describe('A list of recommended campaigns for the creator, ordered by match score (highest first).'),
});
export type CreatorCampaignRecommendationOutput = z.infer<typeof CreatorCampaignRecommendationOutputSchema>;

export async function creatorCampaignRecommendation(
  input: CreatorCampaignRecommendationInput
): Promise<CreatorCampaignRecommendationOutput> {
  return creatorCampaignRecommendationFlow(input);
}

const creatorCampaignRecommendationPrompt = ai.definePrompt({
  name: 'creatorCampaignRecommendationPrompt',
  input: {schema: CreatorCampaignRecommendationInputSchema},
  output: {schema: CreatorCampaignRecommendationOutputSchema},
  prompt: `You are an expert AI-powered campaign matching tool for creators. Your goal is to identify the most suitable campaigns for a given creator based on their profile and available campaign details.\n\nHere is the creator's profile:\nCreator ID: {{{creatorId}}}\nNiches: {{#each creatorNiches}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}\nPortfolio Summary: {{{creatorPortfolioDescription}}}\nSocial Media Statistics:\n{{#each creatorSocialMediaStats}}\n  - Platform: {{ @key }}, Followers: {{this.followers}}, Engagement Rate: {{this.engagementRate}}\n{{/each}}\nPast Campaign IDs (do NOT recommend these): {{#each creatorPastCampaignIds}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}\n\nHere are the available campaigns to consider. You MUST NOT recommend campaigns that are in the creator's Past Campaign IDs list.\n{{#each availableCampaigns}}\n--- Campaign: {{{name}}} (ID: {{{id}}}) ---\nDescription: {{{description}}}\n{{#if brandGuidelinesSummary}}Brand Guidelines Summary: {{{brandGuidelinesSummary}}}{{/if}}\n{{#if requiredNiches}}Required Niches: {{#each requiredNiches}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}\n{{#if minFollowers}}Minimum Followers: {{{minFollowers}}}{{/if}}\n{{#if minEngagementRate}}Minimum Engagement Rate: {{{minEngagementRate}}}{{/if}}\n----------------------------------------\n{{/each}}\n\nAnalyze the creator's profile against each available campaign. For each campaign, evaluate:\n1.  **Niche Alignment**: How well do the creator's niches match the campaign's requirements?\n2.  **Portfolio Suitability**: Does the creator's portfolio description suggest they can meet the campaign's creative needs?\n3.  **Engagement Metrics**: Does the creator meet or exceed any minimum follower/engagement rate requirements?\n4.  **Exclusion**: Is the campaign NOT in the creator's \`creatorPastCampaignIds\`? If it is, DO NOT recommend it.\n\nProvide a list of 3-5 top recommended campaigns, ordered by their match score (highest first). For each recommendation, include the \`campaignId\`, \`campaignName\`, a \`matchScore\` (0-100), and a concise \`reasoning\` explaining the match. If no suitable campaigns are found, return an empty array.\n`,
});

const creatorCampaignRecommendationFlow = ai.defineFlow(
  {
    name: 'creatorCampaignRecommendationFlow',
    inputSchema: CreatorCampaignRecommendationInputSchema,
    outputSchema: CreatorCampaignRecommendationOutputSchema,
  },
  async (input) => {
    const {output} = await creatorCampaignRecommendationPrompt(input);
    return output!;
  }
);
