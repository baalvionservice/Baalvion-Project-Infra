"use server";
/**
 * @fileOverview A Genkit flow for generating mock product recommendations.
 *
 * - generateProductRecommendations - A function that handles the generation of product recommendations.
 * - GenerateProductRecommendationsInput - The input type for the function.
 * - GenerateProductRecommendationsOutput - The return type for the function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const GenerateProductRecommendationsInputSchema = z.object({
  scenario: z
    .string()
    .describe(
      "A description of the user scenario or preferences for recommendations."
    ),
  currentProductId: z
    .string()
    .optional()
    .describe("The ID of the product currently being viewed, if any."),
});
export type GenerateProductRecommendationsInput = z.infer<
  typeof GenerateProductRecommendationsInputSchema
>;

const RecommendedProductSchema = z.object({
  id: z.string().describe("Unique identifier for the recommended product."),
  name: z.string().describe("Name of the recommended product."),
  description: z
    .string()
    .describe("Brief description of the recommended product."),
  basePrice: z.number().describe("Mock base price of the product."),
  currency: z
    .string()
    .describe('Currency of the mock price (e.g., "USD", "GBP", "AED").'),
  imageUrl: z.string().url().describe("URL to a mock image of the product."),
  category: z.string().describe("Category of the recommended product."),
  departmentId: z
    .string()
    .describe("The department ID (women, men, jewelry, watches)."),
  categoryId: z.string().describe("The category ID."),
  subcategoryId: z.string().describe("The subcategory slug."),
  isVip: z.boolean().describe("Whether it is a VIP artifact."),
  rating: z.number().describe("Mock rating from 4.0 to 5.0."),
  reviewsCount: z.number().describe("Mock review count."),
});

const GenerateProductRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(RecommendedProductSchema)
    .describe("A list of recommended products."),
});
export type GenerateProductRecommendationsOutput = z.infer<
  typeof GenerateProductRecommendationsOutputSchema
>;

/**
 * Enhanced wrapper with fallback logic for quota resilience.
 * Uses existing registry IDs to ensure functional navigation.
 */
export async function generateProductRecommendations(
  input: GenerateProductRecommendationsInput
): Promise<GenerateProductRecommendationsOutput> {
  try {
    return await generateProductRecommendationsFlow(input);
  } catch (error) {
    console.warn(
      "AI Recommendation Quota Exceeded. Returning curated registry fallback."
    );
    return {
      recommendations: [
        {
          id: "prod-11",
          name: "Hermès Special Order Birkin 25",
          description:
            "A masterpiece of the archive in White and Etoupe Clemence.",
          basePrice: 31741.89,
          currency: "EUR",
          imageUrl: "https://picsum.photos/seed/hermes-birkin-ai/1000/1200",
          category: "Handbags",
          departmentId: "women",
          categoryId: "hermes",
          subcategoryId: "birkin-25cm",
          isVip: true,
          rating: 5.0,
          reviewsCount: 12,
        },
        {
          id: "prod-1",
          name: "Amarisé Heritage Silk Scarf",
          description: "Hand-painted archival silk from our 1924 collection.",
          basePrice: 1200,
          currency: "USD",
          imageUrl: "https://picsum.photos/seed/amarise-fallback-1/800/800",
          category: "Accessories",
          departmentId: "women",
          categoryId: "w-accessories",
          subcategoryId: "silk-scarves",
          isVip: false,
          rating: 4.9,
          reviewsCount: 42,
        },
        {
          id: "prod-10",
          name: "Maison Grand Complication",
          description:
            "Swiss-engineered marvel with hand-polished heritage movements.",
          basePrice: 18500,
          currency: "USD",
          imageUrl: "https://picsum.photos/seed/amarise-fallback-2/800/800",
          category: "Watches",
          departmentId: "watches",
          categoryId: "wa-complications",
          subcategoryId: "tourbillons",
          isVip: true,
          rating: 5.0,
          reviewsCount: 18,
        },
      ],
    };
  }
}

const productRecommendationPrompt = ai.definePrompt({
  name: "productRecommendationPrompt",
  input: { schema: GenerateProductRecommendationsInputSchema },
  output: { schema: GenerateProductRecommendationsOutputSchema },
  prompt: `You are an expert luxury product curator for AMARISÉ Luxe. Your task is to generate a list of personalized product recommendations.

User Scenario: {{{scenario}}}
{{#if currentProductId}}
Currently viewing product ID: {{{currentProductId}}}. Consider this in your curation.
{{/if}}

Please recommend 3 luxury products. Use sophisticated vocabulary.

CRITICAL: You must provide the following fields exactly:
- id: unique string starting with 'rec-'
- name: concise product name
- description: brief narrative
- basePrice: a number (e.g. 15000)
- currency: USD, GBP, or AED
- imageUrl: https://picsum.photos/seed/<unique_id>/800/800
- category: human-readable category name
- departmentId: one of [women, men, jewelry, watches]
- categoryId: e.g., w-bags, wa-complications
- subcategoryId: slug-style subcategory
- isVip: boolean
- rating: number between 4.0 and 5.0
- reviewsCount: integer`,
});

const generateProductRecommendationsFlow = ai.defineFlow(
  {
    name: "generateProductRecommendationsFlow",
    inputSchema: GenerateProductRecommendationsInputSchema,
    outputSchema: GenerateProductRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await productRecommendationPrompt(input);
    return output!;
  }
);
