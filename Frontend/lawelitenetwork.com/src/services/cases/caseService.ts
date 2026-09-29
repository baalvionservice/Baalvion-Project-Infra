/**
 * @fileOverview CaseService — LIVE (law-service / Postgres). No mock, no Firebase.
 * Endpoints are user-scoped by the bearer token, so userId args are accepted for
 * call-site compatibility but the server resolves "my" cases from the session.
 */
import { caseApi } from '@/lib/api/client';
import { apiClient } from '@/lib/api/client';
import {
  adaptCase,
  adaptCaseNote,
  adaptCaseTask,
  adaptCaseTimeLog,
  unwrapList,
  unwrapOne,
} from '@/services/_law/adapters';

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

// Private strategy notes, workflow tasks, and billable time logs -- real
// per-case sub-resources (law-service /cases/:id/{notes,tasks,timelogs}).
// Previously these only ever wrote to browser localStorage keyed by a case id
// that a real, backend-created case never had, so every note/task/time entry
// a real client or lawyer added was silently discarded despite a success toast.

export const getCaseNotes = async (caseId: string) => {
  const res = await caseApi.notes.list(caseId);
  return unwrapList(res).map(adaptCaseNote);
};

export const addCaseNote = async (caseId: string, data: { text: string; tags?: string[]; isPrivate?: boolean }) => {
  const res = await caseApi.notes.create(caseId, { text: data.text, tags: data.tags, isPrivate: data.isPrivate });
  return adaptCaseNote(unwrapOne(res));
};

export const deleteCaseNote = async (caseId: string, noteId: string) => {
  await caseApi.notes.delete(caseId, noteId);
};

export const getCaseTasks = async (caseId: string) => {
  const res = await caseApi.tasks.list(caseId);
  return unwrapList(res).map(adaptCaseTask);
};

export const addCaseTask = async (caseId: string, data: { title: string }) => {
  const res = await caseApi.tasks.create(caseId, { title: data.title });
  return adaptCaseTask(unwrapOne(res));
};

export const updateCaseTaskStatus = async (caseId: string, taskId: string, status: 'pending' | 'completed') => {
  const res = await caseApi.tasks.updateStatus(caseId, taskId, status);
  return adaptCaseTask(unwrapOne(res));
};

export const getCaseTimeLogs = async (caseId: string) => {
  const res = await caseApi.timeLogs.list(caseId);
  return unwrapList(res).map(adaptCaseTimeLog);
};

export const addCaseTimeLog = async (
  caseId: string,
  data: { durationMinutes: number; isBillable?: boolean; category?: string; description?: string },
) => {
  const res = await caseApi.timeLogs.create(caseId, data);
  return adaptCaseTimeLog(unwrapOne(res));
};
