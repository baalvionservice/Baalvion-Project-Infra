/**
 * @fileOverview Document Vault Service — LIVE (law-service + MinIO object storage).
 * Real binary upload (multipart → MinIO) and presigned downloads. No mock, no Firebase.
 */
import { apiClient } from '@/lib/api/client';
import { adaptDocument, unwrapList, unwrapOne } from '@/services/_law/adapters';

export const getDocumentsByCase = async (caseId: string) => {
  const res = await apiClient.get('/documents', { params: { case_id: caseId } });
  return unwrapList(res).map(adaptDocument);
};

export const getAllUserDocuments = async (_userId?: string) => {
  const res = await apiClient.get('/documents', { params: { limit: 200 } });
  return unwrapList(res)
    .map(adaptDocument)
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
};

/** Upload the actual file bytes to object storage (MinIO) via multipart. */
export const uploadDocument = async (file: File, caseId: string, _userId?: string, _userRole = 'client') => {
  const form = new FormData();
  form.append('file', file);
  if (caseId) form.append('case_id', String(caseId));
  form.append('category', 'other');
  const res = await apiClient.post('/documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return adaptDocument(unwrapOne(res));
};

/** Resolve a short-lived presigned download URL for a stored document. */
export const getDocumentDownloadUrl = async (documentId: string): Promise<string | null> => {
  try {
    const res = await apiClient.get(`/documents/${documentId}/download`);
    return res?.data?.data?.url || null;
  } catch {
    return null;
  }
};

export const deleteDocument = async (documentId: string, _fileUrl?: string) => {
  await apiClient.delete(`/documents/${documentId}`);
  return { success: true };
};
