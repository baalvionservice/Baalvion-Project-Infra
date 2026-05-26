"use server";

import {
  generatePerformanceInsights,
  type AiPerformanceInsightsInput,
} from "@/ai/flows/ai-performance-insights-flow";
import businesses from "@/lib/data/businesses";
import type { Business } from "@/lib/types";

export async function getAiSummaryAction(
  businessId: string
): Promise<{ summary?: string; error?: string }> {
  try {
    const business = businesses.find((b) => b.id === businessId) as
      | Business
      | undefined;
    if (!business) {
      throw new Error("Business not found");
    }

    const input: AiPerformanceInsightsInput = {
      businessName: business.name,
      country: business.country,
      currency: business.currency,
      currentMetrics: {
        revenue: business.currentMetrics.revenue,
        profit: business.currentMetrics.profit,
        employees: business.currentMetrics.employees,
        domainsCount: business.currentMetrics.domains,
      },
      notableEvents: business.notableEvents,
      equitySplit: business.equitySplit
        .map((e) => `${e.name}: ${e.percentage}%`)
        .join(", "),
    };

    const result = await generatePerformanceInsights(input);
    return { summary: result.summary };
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return { error: `Failed to generate AI insights: ${message}` };
  }
}
