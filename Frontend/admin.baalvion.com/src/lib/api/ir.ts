import { serviceClients } from './client';
import { mediaApi } from './media';
import type {
  IrReport,
  IrReportListParams,
  CreateReportPayload,
  UpdateReportPayload,
  IrListEnvelope,
  IrResource,
} from '@/lib/types/ir.types';

// ir-service is reached via the shared per-service client (serviceClients.ir →
// http://localhost:3008/api/v1, dual-mounted with /v1). The bearer token is attached
// by the shared interceptor in client.ts, so authed mutations (create/update/publish)
// carry the caller's identity; the service derives org_id + created_by from it.
const ir = serviceClients.ir;

export const irReportsApi = {
  list: (params?: IrReportListParams) =>
    ir.get<IrListEnvelope<IrReport>>('/reports', { params }),

  get: (id: string) => ir.get<IrResource<IrReport>>(`/reports/${id}`),

  create: (payload: CreateReportPayload) =>
    ir.post<IrResource<IrReport>>('/reports', payload),

  update: (id: string, payload: UpdateReportPayload) =>
    ir.patch<IrResource<IrReport>>(`/reports/${id}`, payload),

  remove: (id: string) => ir.delete<IrResource<{ deleted: boolean }>>(`/reports/${id}`),

  publish: (id: string) => ir.post<IrResource<IrReport>>(`/reports/${id}/publish`),
};

// ir-service has no multipart upload — reports store `file_url` as a plain string.
// We upload the PDF through the CMS media library (cms-service :3011), which returns a
// stable URL, then persist that URL as the report's file_url. This reuses the existing,
// S3-ready media pipeline instead of adding a second upload path.
export async function uploadReportFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const form = new FormData();
  form.append('file', file); // cms-service multipart parser keys on the field name "file"
  const res = await mediaApi.files.upload(form, onProgress);
  return res.data.data.url;
}
