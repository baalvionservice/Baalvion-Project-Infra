'use client';
/**
 * @fileOverview REST Case Implementation
 * Replaces the previous Firebase/Firestore implementation.
 */

import { apiClient } from '@/lib/api/client';
import { CreateCaseInput } from './caseService';

export const firebaseCreateCase = async (data: CreateCaseInput, userId: string) => {
  if (!data.title || !data.description || !data.category) {
    throw new Error('All required professional fields must be populated.');
  }

  try {
    const res = await apiClient.post('/cases', {
      clientId: userId,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: 'draft',
      assignedLawyerId: null,
      documents: [],
      isDeleted: false,
    });

    const created = res.data?.data;
    return {
      id: created?.id ?? created?.caseId,
      caseId: created?.id ?? created?.caseId,
      ...data,
      documents: [],
      isDeleted: false,
      ...created,
    };
  } catch (error: any) {
    console.error('Brief initialization failure:', error);
    throw new Error('Unable to synchronize legal brief with the network.');
  }
};

export const firebaseGetCasesByClient = async (userId: string) => {
  try {
    const res = await apiClient.get('/cases', { params: { clientId: userId } });
    return res.data?.data ?? [];
  } catch (error: any) {
    console.error('Brief retrieval failure:', error);
    throw new Error('Unable to retrieve legal briefs from the network.');
  }
};

export const firebaseGetCaseById = async (caseId: string) => {
  try {
    const res = await apiClient.get(`/cases/${caseId}`);
    return res.data?.data ?? null;
  } catch (error: any) {
    console.error('Brief retrieval failure:', error);
    throw new Error('Unable to retrieve legal brief from the network.');
  }
};

export const firebaseUpdateCase = async (caseId: string, updatedData: any) => {
  try {
    const res = await apiClient.patch(`/cases/${caseId}`, updatedData);
    return { id: caseId, ...updatedData, ...(res.data?.data ?? {}) };
  } catch (error: any) {
    console.error('Brief update failure:', error);
    throw new Error('Unable to synchronize updates with the network.');
  }
};

export const firebaseAssignLawyerToCase = async (caseId: string, lawyerId: string) => {
  try {
    await apiClient.patch(`/cases/${caseId}/assign`, { lawyerId });
    return { success: true };
  } catch (error: any) {
    console.error('Lawyer assignment failure:', error);
    throw new Error('Unable to assign lawyer to the brief.');
  }
};

export const firebaseDeleteCase = async (caseId: string) => {
  try {
    await apiClient.patch(`/cases/${caseId}`, { isDeleted: true });
    return { success: true };
  } catch (error: any) {
    console.error('Soft-delete failure:', error);
    throw new Error('Unable to terminate legal brief.');
  }
};

export const firebaseRestoreCase = async (caseId: string) => {
  try {
    await apiClient.patch(`/cases/${caseId}`, { isDeleted: false, deletedAt: null });
    return { success: true };
  } catch (error: any) {
    console.error('Restore failure:', error);
    throw new Error('Unable to restore legal brief.');
  }
};
