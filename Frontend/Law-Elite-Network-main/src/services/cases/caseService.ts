/**
 * @fileOverview CaseService Main Entry
 * Decouples the UI from the backend implementation and handles notification/activity triggers.
 */

import * as mockService from './case.mock';
import * as firebaseService from './case.firebase';
import { createNotification } from '@/services/notifications/notificationService';
import { createActivity } from '@/services/activities/activityService';
import { logAction } from '@/services/audit/auditService';

const USE_MOCK = true;

export interface CreateCaseInput {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  userRole?: string;
}

export const createCase = async (data: CreateCaseInput, userId: string) => {
  const newCase = USE_MOCK 
    ? await mockService.createCase(data, userId)
    : await firebaseService.firebaseCreateCase(data, userId);

  const caseId = newCase.id || newCase.caseId;

  await createNotification({
    userId,
    title: 'Brief Initialized',
    message: `Your legal brief "${data.title}" has been successfully established in the network.`,
    type: 'case_created',
    priority: 'high',
    relatedCaseId: caseId
  });

  await createActivity({
    caseId,
    type: 'case_created',
    message: 'Legal brief successfully initialized in the network.',
    performedBy: userId
  });

  await logAction({
    userId,
    userRole: data.userRole || 'client',
    action: 'create_case',
    entityType: 'case',
    entityId: caseId,
    details: { title: data.title, category: data.category }
  });

  return newCase;
};

export const getCasesByClient = async (userId: string) => {
  if (USE_MOCK) {
    return await mockService.mockGetCasesByClient(userId);
  }
  return await firebaseService.firebaseGetCasesByClient(userId);
};

export const getAllOpenCases = async () => {
  if (USE_MOCK) {
    return await mockService.mockGetAllOpenCases();
  }
  return [];
};

export const getCaseById = async (caseId: string) => {
  if (USE_MOCK) {
    return await mockService.mockGetCaseById(caseId);
  }
  return await firebaseService.firebaseGetCaseById(caseId);
};

export const updateCase = async (caseId: string, updatedData: any, userRole = 'client') => {
  const currentCase = await getCaseById(caseId);
  const result = USE_MOCK
    ? await mockService.updateCase(caseId, updatedData)
    : await firebaseService.firebaseUpdateCase(caseId, updatedData);

  const clientId = (currentCase as any).clientId;

  await logAction({
    userId: clientId,
    userRole,
    action: 'update_case',
    entityType: 'case',
    entityId: caseId,
    details: updatedData
  });

  if (updatedData.status && updatedData.status !== currentCase?.status) {
    await createNotification({
      userId: clientId,
      title: 'Status Transition',
      message: `Strategic status of "${currentCase?.title}" transitioned to ${updatedData.status.toUpperCase()}.`,
      type: 'status_changed',
      priority: 'high',
      relatedCaseId: caseId
    });
  }

  return result;
};

export const assignLawyerToCase = async (caseId: string, lawyerId: string) => {
  const result = USE_MOCK
    ? await mockService.mockAssignLawyerToCase(caseId, lawyerId)
    : await firebaseService.firebaseAssignLawyerToCase(caseId, lawyerId);

  const currentCase = await getCaseById(caseId);
  const clientId = (currentCase as any).clientId;
  
  await createNotification({
    userId: clientId,
    title: 'Lawyer Assigned Successfully',
    message: `Elite practitioner has been assigned to: ${currentCase?.title}. Engagement is active.`,
    type: 'status_changed',
    priority: 'high',
    relatedCaseId: caseId
  });

  await createActivity({
    caseId,
    type: 'lawyer_assigned',
    message: 'Distinguished practitioner assigned to the dossier.',
    performedBy: 'system',
    metadata: { lawyerId }
  });

  return result;
};

export const deleteCase = async (caseId: string, userId?: string, userRole = 'client') => {
  if (userId) {
    await logAction({
      userId,
      userRole,
      action: 'delete_case',
      entityType: 'case',
      entityId: caseId
    });
  }

  if (USE_MOCK) {
    return await mockService.mockDeleteCase(caseId);
  }
  return await firebaseService.firebaseDeleteCase(caseId);
};