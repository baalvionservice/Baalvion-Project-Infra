/**
 * @file src/api/documents.ts
 * @description Trade documents — the production file engine (versioned, encrypted-at-rest, virus
 * scanned, chain-of-custody verify/reject). Documents affect the readiness score, so the UI links
 * verification state back to readiness.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tradeApi, unwrap } from './client';
import { apiClient } from '@/lib/api-client';
import { qk } from './keys';

export type DocType =
  | 'commercial_invoice' | 'packing_list' | 'bill_of_lading'
  | 'certificate_of_origin' | 'insurance_document' | 'other'
  | 'government_id' | 'passport' | 'driving_license' | 'selfie'
  | 'tax_certificate' | 'bank_letter' | 'utility_bill' | 'lease_agreement'
  | 'product_certificate' | 'quality_certificate' | 'safety_certificate' | 'inspection_report';

export type DocStatus =
  | 'draft' | 'scanning' | 'available' | 'quarantined'
  | 'rejected' | 'verified' | 'archived' | 'expired';

export interface DocumentVersion {
  id: string;
  version_no: number;
  file_name: string | null;
  mime_type: string | null;
  detected_mime_type: string | null;
  file_size_bytes: number | null;
  sha256: string | null;
  storage_provider: string | null;
  encrypted: boolean;
  encryption_algo: string | null;
  scan_status: 'pending' | 'clean' | 'infected' | 'error' | 'skipped';
  scan_engine: string | null;
  scanned_at: string | null;
  extracted_metadata: Record<string, unknown> | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface TradeDocument {
  id: string;
  tenant_id: string;
  doc_type: DocType;
  title: string | null;
  description: string | null;
  status: DocStatus;
  classification: 'PUBLIC' | 'OPERATIONAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  shipment_id: string | null;
  trade_operation_id: string | null;
  current_version: number;
  latest_version_id: string | null;
  issued_at: string | null;
  expires_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  version: number;
  versions?: DocumentVersion[];
}

export interface DocumentCapabilities {
  doc_types: string[];
  classifications: string[];
  allowed_mime_types: string[];
  max_upload_bytes: number;
  storage_provider: string;
  encryption_enabled: boolean;
  encryption_algo: string;
  virus_scan_provider: string;
}

export interface DocumentEvent {
  id: string;
  document_id: string;
  event_type: string;
  message: string | null;
  detail: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
}

export type DocumentListParams = {
  page?: number;
  limit?: number;
  shipment_id?: string;
  doc_type?: DocType;
  status?: DocStatus;
};

export const documentsApi = {
  capabilities: () => tradeApi.get<DocumentCapabilities>('/trade_documents/meta/capabilities'),
  list: (params: DocumentListParams = {}) => tradeApi.list<TradeDocument>('/trade_documents', params),
  get: (id: string) => tradeApi.get<TradeDocument>(`/trade_documents/${id}`),
  events: (id: string) => tradeApi.get<DocumentEvent[]>(`/trade_documents/${id}/events`),
  create: (body: {
    doc_type: DocType;
    title?: string;
    description?: string;
    shipment_id?: string;
    trade_operation_id?: string;
    classification?: string;
  }) => tradeApi.post<TradeDocument>('/trade_documents', body),
  /** Upload a new version as JSON (base64/url-backed). Binary uploads go directly via apiClient. */
  addVersion: (id: string, body: Record<string, unknown>) =>
    tradeApi.post(`/trade_documents/${id}/versions`, body),
  /**
   * Uploads real file bytes as a new version — the raw-binary path the backend engine expects
   * (Content-Type + X-File-Name header, body = the file itself, not JSON). Goes through
   * `apiClient` directly since `tradeApi`'s helpers always JSON-encode the body.
   */
  uploadVersion: (id: string, file: File) =>
    unwrap<{ document: Pick<TradeDocument, 'id' | 'status' | 'current_version'>; version: DocumentVersion }>(
      apiClient.request(`/trade_documents/${id}/versions`, {
        method: 'POST',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'X-File-Name': file.name,
        },
      }),
    ),
  verify: (id: string, note?: string) => tradeApi.patch<TradeDocument>(`/trade_documents/${id}/verify`, { note }),
  reject: (id: string, reason: string) => tradeApi.patch<TradeDocument>(`/trade_documents/${id}/reject`, { reason }),
  /**
   * Opens a document's latest version in a new tab. The backend returns either a
   * presigned redirect ({mode:'redirect', url}, when real object storage is
   * configured) or streams the raw file bytes directly (local/dev fallback) — this
   * handles both so callers never need to know which mode is active.
   */
  async openInNewTab(id: string): Promise<void> {
    const res = await fetch(`/trade-bff/trade_documents/${id}/download`, { credentials: 'include' });
    if (!res.ok) throw new Error(`Could not open document (HTTP ${res.status})`);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      const url = json?.data?.url;
      if (!url) throw new Error('Document service did not return a viewable URL');
      window.open(url, '_blank', 'noopener');
      return;
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank', 'noopener');
    // Revoke after a delay long enough for the new tab to load the blob.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  },
};

export function useDocumentCapabilities() {
  return useQuery({ queryKey: qk.documents.capabilities, queryFn: documentsApi.capabilities, staleTime: 60 * 60_000 });
}

export function useDocuments(params: DocumentListParams = {}, opts: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: qk.documents.list(params),
    queryFn: () => documentsApi.list(params),
    enabled: opts.enabled ?? true,
  });
}

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: qk.documents.detail(id ?? ''),
    queryFn: () => documentsApi.get(id as string),
    enabled: !!id,
  });
}

function useDocMutation<TVars>(fn: (vars: TVars) => Promise<unknown>, shipmentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.documents.all });
      if (shipmentId) void qc.invalidateQueries({ queryKey: qk.readiness.forShipment(shipmentId) });
    },
  });
}

export function useCreateDocument(shipmentId?: string) {
  return useDocMutation((body: Parameters<typeof documentsApi.create>[0]) => documentsApi.create(body), shipmentId);
}

export function useVerifyDocument(shipmentId?: string) {
  return useDocMutation((vars: { id: string; note?: string }) => documentsApi.verify(vars.id, vars.note), shipmentId);
}

export function useRejectDocument(shipmentId?: string) {
  return useDocMutation((vars: { id: string; reason: string }) => documentsApi.reject(vars.id, vars.reason), shipmentId);
}
