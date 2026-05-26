'use server';
/**
 * @fileOverview AI Analyst Engine - Model Performance Tracking Flow.
 * 
 * - reportModelPerformance - Function to audit and report on AI model accuracy and reliability.
 * - ModelPerformanceInput - Schema for the audit period.
 * - ModelPerformanceOutput - Structured JSON schema for the integrity report.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ModelPerformanceInputSchema = z.object({
  period: z.enum(['Week', 'Month']).describe('The timeframe for the performance audit.'),
});
export type ModelPerformanceInput = z.infer<typeof ModelPerformanceInputSchema>;

const PredictionPerformanceSchema = z.object({
  asset: z.string().describe('The asset symbol or name.'),
  predicted: z.string().describe('The AI predicted movement/value.'),
  actual: z.string().describe('The actual market outcome.'),
});

const RecommendationAccuracySchema = z.object({
  recommendation: z.string().describe('The specific strategic directive given by the AI.'),
  outcome: z.enum(['Positive', 'Negative', 'Neutral']).describe('The qualitative outcome of the recommendation.'),
});

const ModelPerformanceOutputSchema = z.object({
  overview: z.string().describe('Brief summary of overall AI model performance during the period.'),
  accuracy_metrics: z.object({
    prediction_accuracy: z.string().describe('Percentage of correct price/direction predictions.'),
    sentiment_accuracy: z.string().describe('Percentage of correct social sentiment classifications.'),
    error_rate: z.string().describe('System-wide model exception/error rate.'),
  }),
  recent_predictions_performance: z.array(PredictionPerformanceSchema).describe('Tracked predictions vs actual outcomes.'),
  trend_detection_performance: z.object({
    correct_trends: z.string().describe('Number of correctly identified market trends.'),
    incorrect_trends: z.string().describe('Number of false positive or incorrect trend identifications.'),
  }),
  recommendations_accuracy: z.array(RecommendationAccuracySchema).describe('Evaluation of strategic AI directives.'),
  alerts_flags: z.array(z.string()).describe('Noted anomalies, model drift, or underperforming modules.'),
  confidence_score: z.number().min(0).max(100).describe('AI conviction in the accuracy of this performance report.'),
});
export type ModelPerformanceOutput = z.infer<typeof ModelPerformanceOutputSchema>;

export async function reportModelPerformance(input: ModelPerformanceInput): Promise<ModelPerformanceOutput> {
  return reportModelPerformanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reportModelPerformancePrompt',
  input: { schema: ModelPerformanceInputSchema },
  output: { schema: ModelPerformanceOutputSchema },
  prompt: `You are a Senior AI Integrity Auditor for a high-scale financial intelligence platform.
Your task is to provide a structured, data-driven report on the performance of the platform's AI models for the following:

Period: {{{period}}}

Instructions:
1. Provide a professional Overview of model stability and accuracy.
2. Extract Accuracy Metrics for Predictions, Sentiment, and Error Rates.
3. Compare 3-5 Recent Predictions vs Actual market outcomes using realistic figures.
4. Quantify Trend Detection performance (Correct vs Incorrect counts).
5. Evaluate 3-5 specific Recommendations given by the AI and their market Outcomes.
6. Flag any Alerts (e.g., model drift, latency spikes, or low-conviction clusters).
7. Assign a numerical Confidence Score for this audit.

Maintain an institutional-grade, objective tone. Use realistic but mock historical figures that demonstrate high performance with minor, transparent anomalies.`,
});

const reportModelPerformanceFlow = ai.defineFlow(
  {
    name: 'reportModelPerformanceFlow',
    inputSchema: ModelPerformanceInputSchema,
    outputSchema: ModelPerformanceOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI Integrity Engine failed to synthesize the performance matrix.');
    }
    return output;
  }
);
