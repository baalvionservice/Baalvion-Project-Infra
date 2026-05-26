/**
 * @fileOverview Mock Recommendation Intelligence Implementation
 */

import { Recommendation } from "@/types/recommendation";

export const mockGenerateRecommendations = async (userId: string): Promise<Recommendation[]> => {
  // Simulate heavy-duty analytical processing
  await new Promise((resolve) => setTimeout(resolve, 700));

  return [
    {
      id: "rec_1",
      type: "action",
      title: "Complete your case details",
      description: "Add missing information to improve legal analysis for your active matter.",
      actionLink: "/cases",
      priority: "high",
      createdAt: Date.now()
    },
    {
      id: "rec_2",
      type: "suggestion",
      title: "Book a consultation",
      description: "Connect with a verified lawyer for guidance on your latest brief.",
      actionLink: "/lawyers",
      priority: "medium",
      createdAt: Date.now()
    },
    {
      id: "rec_3",
      type: "alert",
      title: "Upload required documents",
      description: "Your dossier is missing important supporting records for verification.",
      actionLink: "/dashboard",
      priority: "high",
      createdAt: Date.now()
    }
  ];
};
