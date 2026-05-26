/**
 * @fileOverview AI Intelligence Service Orchestrator
 * Provides strategic insights, lawyer recommendations, and co-pilot chat.
 */

import * as mockService from './ai.mock';
import * as firebaseService from './ai.firebase';
import { rankLawyersForCase } from '@/services/matching/matchingService';
import { getAllLawyers } from '@/services/lawyers/lawyerService';

const USE_MOCK = true;

export const getCaseInsights = async (caseData: any) => {
  const caseId = caseData.id || caseData.caseId;

  if (!USE_MOCK) {
    const cached = await firebaseService.firebaseGetCachedInsights(caseId);
    if (cached) return cached;
  }

  const insights = await mockService.mockGenerateCaseInsights(caseData);

  const lawyers = await getAllLawyers();
  const rankedLawyers = await rankLawyersForCase(lawyers, caseData);
  
  insights.recommendedLawyers = rankedLawyers.slice(0, 3).map((l, index) => ({
    ...l,
    isBestMatch: index === 0
  }));

  if (!USE_MOCK) {
    await firebaseService.firebaseSaveInsights(caseId, insights);
  }

  return insights;
};

export const analyzeDocument = async (documentId: string, fileText: string) => {
  if (!USE_MOCK) {
    const insights = await mockService.mockAnalyzeDocument(fileText);
    await firebaseService.firebaseSaveDocumentInsights(documentId, insights);
    return insights;
  }
  
  const insights = await mockService.mockAnalyzeDocument(fileText);
  return insights;
};

export const getDocumentInsights = async (documentId: string) => {
  if (!USE_MOCK) {
    return await firebaseService.firebaseGetDocumentInsights(documentId);
  }
  return await mockService.mockAnalyzeDocument("");
};

export const chatWithAI = async (message: string, context?: any) => {
  return await mockService.mockChatWithAI(message, context);
};