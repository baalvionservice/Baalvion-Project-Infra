/**
 * @fileOverview CaseService — LIVE (law-service / Postgres). No mock, no Firebase.
 * Endpoints are user-scoped by the bearer token, so userId args are accepted for
 * call-site compatibility but the server resolves "my" cases from the session.
 */
import { caseApi } from '@/lib/api/client';
import { apiClient } from '@/lib/api/client';
import { adaptCase, unwrapList, unwrapOne } from '@/services/_law/adapters';

export interface CreateCaseInput {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  userRole?: string;
}

export const createCase = async (data: CreateCaseInput, _userId?: string) => {
  const res = await caseApi.create({
    title: data.title,
    description: data.description,
    category: data.category,
    priority: data.priority || 'medium',
  });
  return adaptCase(unwrapOne(res));
};

export const getCasesByClient = async (_userId?: string) => {
  const res = await caseApi.list({ limit: 100 });
  return unwrapList(res).map(adaptCase);
};

export const getAllOpenCases = async () => {
  const res = await caseApi.list({ status: 'open', limit: 100 });
  return unwrapList(res).map(adaptCase);
};

export const getCaseById = async (caseId: string) => {
  const res = await caseApi.get(caseId);
  return adaptCase(unwrapOne(res));
};

export const updateCase = async (caseId: string, updatedData: any, _userRole = 'client') => {
  if (updatedData.status && Object.keys(updatedData).length === 1) {
    const res = await caseApi.updateStatus(caseId, updatedData.status);
    return adaptCase(unwrapOne(res));
  }
  const res = await caseApi.update(caseId, updatedData);
  return adaptCase(unwrapOne(res));
};

export const assignLawyerToCase = async (caseId: string, lawyerId: string) => {
  const res = await apiClient.post(`/cases/${caseId}/assign`, { lawyer_id: Number(lawyerId) });
  return adaptCase(unwrapOne(res));
};

export const deleteCase = async (caseId: string, _userId?: string, _userRole = 'client') => {
  // Clients can't hard-delete; archive instead. (Admin hard-delete lives in /admin.)
  const res = await caseApi.updateStatus(caseId, 'archived');
  return adaptCase(unwrapOne(res));
};
