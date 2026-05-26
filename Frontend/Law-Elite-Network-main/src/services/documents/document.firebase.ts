'use client';

/**
 * @fileOverview REST Document Vault Implementation
 * Replaces the previous Firebase/Firestore + Storage implementation.
 */

import { apiClient } from '@/lib/api/client';

export const firebaseUploadDocument = async (file: File, caseId: string, userId: string) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caseId', caseId);
    formData.append('uploadedBy', userId);

    const res = await apiClient.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const doc = res.data?.data;
    return { id: doc?.id ?? doc?.documentId, fileUrl: doc?.fileUrl ?? '' };
  } catch (error) {
    console.error('Document upload failure:', error);
    throw new Error('Unable to upload document to the network.');
  }
};

export const firebaseGetDocumentsByCase = async (caseId: string) => {
  try {
    const res = await apiClient.get('/documents', { params: { caseId } });
    return res.data?.data ?? [];
  } catch (error) {
    console.error('Document retrieval failure:', error);
    return [];
  }
};

export const firebaseDeleteDocument = async (documentId: string, _fileUrl: string) => {
  try {
    await apiClient.delete(`/documents/${documentId}`);
  } catch (error) {
    console.error('Document deletion failure:', error);
  }
};
