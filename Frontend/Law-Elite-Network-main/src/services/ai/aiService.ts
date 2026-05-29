/**
 * @fileOverview AI Intelligence Service — no Firebase.
 * Real lawyer recommendations come from the live ranking engine; narrative AI analysis
 * (case insights, document analysis, co-pilot chat) is served by the local AI placeholder
 * until the Genkit model integration (src/ai/*) is wired with provider keys.
 */
import * as aiPlaceholder from './ai.mock';
import { rankLawyersForCase } from '@/services/matching/matchingService';
import { getAllLawyers } from '@/services/lawyers/lawyerService';

export const getCaseInsights = async (caseData: any) => {
  const insights = await aiPlaceholder.mockGenerateCaseInsights(caseData);
  // Real recommendations: rank the live directory against the case.
  const lawyers = await getAllLawyers();
  const rankedLawyers = await rankLawyersForCase(lawyers, caseData);
  insights.recommendedLawyers = rankedLawyers.slice(0, 3).map((l: any, index: number) => ({ ...l, isBestMatch: index === 0 }));
  return insights;
};

export const analyzeDocument = async (_documentId: string, fileText: string) => aiPlaceholder.mockAnalyzeDocument(fileText);

export const getDocumentInsights = async (_documentId: string) => aiPlaceholder.mockAnalyzeDocument('');

export const chatWithAI = async (message: string, context?: any) => aiPlaceholder.mockChatWithAI(message, context);
