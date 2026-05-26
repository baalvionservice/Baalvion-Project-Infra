'use client';

/**
 * @fileOverview REST AI Caching Implementation
 * Replaces the previous Firebase/Firestore caching implementation.
 * AI insights are fetched from the law-service AI endpoints.
 */

import { apiClient } from '@/lib/api/client';

export const firebaseGetCachedInsights = async (caseId: string) => {
  try {
    const res = await apiClient.get(`/cases/${caseId}/insights`);
    return res.data?.data ?? null;
  } catch {
    return null;
  }
};

export const firebaseSaveInsights = async (caseId: string, insights: any) => {
  try {
    await apiClient.post(`/cases/${caseId}/insights`, insights);
  } catch (error) {
    console.error('Insight caching failure:', error);
  }
};

export const firebaseGetDocumentInsights = async (documentId: string) => {
  try {
    const res = await apiClient.get(`/documents/${documentId}/insights`);
    return res.data?.data ?? null;
  } catch {
    return null;
  }
};

export const firebaseSaveDocumentInsights = async (documentId: string, insights: any) => {
  try {
    await apiClient.post(`/documents/${documentId}/insights`, insights);
  } catch (error) {
    console.error('Document analysis caching failure:', error);
  }
};
