/**
 * @fileOverview Verification Service — the registration wizard's Verification
 * step (Bar Council Certificate, Government ID, Professional Certificate,
 * Selfie). Real binary upload to law-service /v1/verification-documents,
 * which streams to MinIO (see service/storage.js) — no client-side mock.
 */
import { apiClient } from '@/lib/api/client';

export type VerificationDocType =
  | 'bar_council_certificate'
  | 'government_id'
  | 'professional_certificate'
  | 'selfie';

export interface VerificationDocument {
  id: number;
  lawyer_id: number;
  doc_type: VerificationDocType;
  status: 'pending' | 'verified' | 'rejected';
  review_notes?: string | null;
  reviewed_at?: string | null;
  createdAt: string;
}

function unwrap<T>(data: any): T {
  return (data && data.data !== undefined ? data.data : data) as T;
}

export const uploadVerificationDocument = async (
  docType: VerificationDocType,
  file: File,
): Promise<VerificationDocument> => {
  const form = new FormData();
  form.append('docType', docType);
  form.append('file', file);
  const { data } = await apiClient.post('/verification-documents/me', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrap<VerificationDocument>(data);
};

export const getMyVerificationDocuments = async (): Promise<VerificationDocument[]> => {
  const { data } = await apiClient.get('/verification-documents/me');
  return unwrap<VerificationDocument[]>(data) ?? [];
};

// ── Admin ────────────────────────────────────────────────────────────────────
export const getVerificationQueue = async (status: string = 'pending') => {
  const { data } = await apiClient.get('/verification-documents/queue', { params: { status } });
  return unwrap<{ items: (VerificationDocument & { lawyer: { id: number; name: string; email: string; country?: string; city?: string } })[]; pagination: any }>(data);
};

export const getVerificationDocumentDownloadUrl = async (id: number): Promise<string> => {
  const { data } = await apiClient.get(`/verification-documents/${id}/download`);
  return unwrap<{ url: string }>(data).url;
};

export const reviewVerificationDocument = async (
  id: number,
  status: 'verified' | 'rejected',
  notes?: string,
) => {
  const { data } = await apiClient.post(`/verification-documents/${id}/review`, { status, notes });
  return unwrap<{ document: VerificationDocument; lawyer: any }>(data);
};
