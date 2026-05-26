/**
 * @fileOverview Advanced Mock Case Implementation
 * Handles LawOS persistence for tasks, time logs, and private research.
 */

import { CreateCaseInput } from './caseService';

const STORAGE_KEY = 'law_elite_cases_v3';

const INITIAL_TASKS = [
  { id: 't1', title: 'Identity Verification Protocol', status: 'completed', createdAt: Date.now() },
  { id: 't2', title: 'Conflict of Interest Check', status: 'completed', createdAt: Date.now() },
  { id: 't3', title: 'Retainer Agreement Authorization', status: 'pending', createdAt: Date.now() }
];

export const createCase = async (data: CreateCaseInput, userId: string) => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const id = `case_${Date.now()}`;
  const newCase = {
    id,
    caseId: id,
    clientId: userId,
    ...data,
    status: 'open',
    assignedLawyerId: null,
    documents: [],
    tasks: INITIAL_TASKS,
    notes: [],
    timeLogs: [],
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, newCase]));
  window.dispatchEvent(new Event('storage'));

  return newCase;
};

export const mockGetCasesByClient = async (userId: string) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const localCases = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return localCases.filter((c: any) => c.clientId === userId && !c.isDeleted);
};

export const mockGetAllOpenCases = async () => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const localCases = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return localCases.filter((c: any) => c.status === 'open' && !c.isDeleted);
};

export const mockGetCaseById = async (caseId: string) => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const localCases = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return localCases.find((c: any) => (c.id === caseId || c.caseId === caseId)) || null;
};

export const updateCase = async (caseId: string, updatedData: any) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const localCases = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const index = localCases.findIndex((c: any) => (c.id === caseId || c.caseId === caseId));
  
  if (index === -1) return null;

  const updated = {
    ...localCases[index],
    ...updatedData,
    updatedAt: new Date().toISOString()
  };

  localCases[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localCases));
  window.dispatchEvent(new Event('storage'));

  return updated;
};

export const mockAssignLawyerToCase = async (caseId: string, lawyerId: string) => {
  return await updateCase(caseId, { assignedLawyerId: lawyerId, status: 'active' });
};

export const mockDeleteCase = async (caseId: string) => {
  return await updateCase(caseId, { isDeleted: true });
};

export const mockAddTask = async (caseId: string, task: any) => {
  const caseData = await mockGetCaseById(caseId);
  if (!caseData) return;
  const tasks = [...(caseData.tasks || []), { ...task, id: `task_${Date.now()}`, createdAt: Date.now() }];
  return await updateCase(caseId, { tasks });
};

export const mockAddTimeLog = async (caseId: string, log: any) => {
  const caseData = await mockGetCaseById(caseId);
  if (!caseData) return;
  const timeLogs = [...(caseData.timeLogs || []), { ...log, id: `log_${Date.now()}`, createdAt: Date.now() }];
  return await updateCase(caseId, { timeLogs });
};

export const mockAddNote = async (caseId: string, note: any) => {
  const caseData = await mockGetCaseById(caseId);
  if (!caseData) return;
  const notes = [...(caseData.notes || []), { ...note, id: `note_${Date.now()}`, createdAt: Date.now() }];
  return await updateCase(caseId, { notes });
};
