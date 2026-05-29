/**
 * @fileOverview CaseService (top-level) — LIVE (law-service cases / Postgres).
 * No mock, no Firebase. Endpoints are user-scoped by the session token, so a client
 * sees their cases and a lawyer sees their assigned cases.
 */
import { caseApi } from '@/lib/api/client';
import { adaptCase, unwrapList, unwrapOne } from '@/services/_law/adapters';

export const createCase = async (caseData: any) => {
  const res = await caseApi.create({
    title: caseData.title,
    description: caseData.description,
    category: caseData.category,
    priority: caseData.priority || 'medium',
  });
  return adaptCase(unwrapOne(res));
};

export const getUserCases = async (_userId?: string) => {
  const res = await caseApi.list({ limit: 100 });
  return unwrapList(res).map(adaptCase);
};

export const getLawyerCases = async (_lawyerId?: string) => {
  const res = await caseApi.list({ limit: 100 });
  return unwrapList(res).map(adaptCase);
};

export const updateCaseStatus = async (caseId: string, status: 'open' | 'in_progress' | 'closed' | string) => {
  const res = await caseApi.updateStatus(caseId, status);
  return adaptCase(unwrapOne(res));
};
