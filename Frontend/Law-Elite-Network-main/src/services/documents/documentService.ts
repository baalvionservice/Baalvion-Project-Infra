/**
 * @fileOverview Document Vault Service — LIVE (law-service / Postgres). No mock, no Firebase.
 * Binary storage (MinIO/S3) is a hardening step; for now document records carry metadata + URL.
 */
import { documentApi } from '@/lib/api/client';
import { adaptDocument, unwrapList, unwrapOne } from '@/services/_law/adapters';

export const getDocumentsByCase = async (caseId: string) => {
  const res = await documentApi.list({ case_id: caseId, caseId });
  return unwrapList(res).map(adaptDocument);
};

export const getAllUserDocuments = async (_userId?: string) => {
  const res = await documentApi.list({ limit: 200 });
  return unwrapList(res)
    .map(adaptDocument)
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
};

export const uploadDocument = async (file: File, caseId: string, _userId?: string, _userRole = 'client') => {
  // Metadata record now; binary upload to object storage is a hardening task.
  const res = await documentApi.upload({
    name: file.name,
    case_id: caseId ? Number(caseId) : undefined,
    type: file.type || 'application/octet-stream',
    url: `pending://${encodeURIComponent(file.name)}`,
    size: file.size,
    category: 'other',
  });
  return adaptDocument(unwrapOne(res));
};

export const deleteDocument = async (documentId: string, _fileUrl?: string) => {
  await documentApi.delete(documentId);
  return { success: true };
};
