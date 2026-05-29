/**
 * Direct multipart file upload to the jobs-service, which stores it in MinIO/S3 and returns a
 * public URL. Use `public: true` for anonymous flows (the careers apply wizard); otherwise the
 * in-memory access token is attached for authenticated uploads (candidate documents, avatars).
 */
import { getBearerToken } from './apiClient';

const JOBS_BASE =
  process.env.NEXT_PUBLIC_JOBS_SERVICE_URL || 'http://localhost:3002/api/v1';

export async function uploadFile(
  file: File,
  opts: { folder?: string; public?: boolean } = {},
): Promise<string> {
  const fd = new FormData();
  fd.append('folder', opts.folder || 'misc');
  fd.append('file', file);

  const headers: Record<string, string> = {};
  const token = getBearerToken();
  if (!opts.public && token) headers['Authorization'] = `Bearer ${token}`;

  const path = opts.public ? '/uploads/public' : '/uploads/file';
  const res = await fetch(`${JOBS_BASE}${path}`, {
    method: 'POST',
    headers,
    body: fd,
    credentials: 'include',
  });
  const json = await res.json().catch(() => ({} as any));
  if (!res.ok || !json?.success || !json?.data?.url) {
    throw new Error(json?.error?.message || `Upload failed (${res.status})`);
  }
  return json.data.url as string;
}

/** True for browser File instances (used to decide whether a field needs uploading). */
export function isFile(v: unknown): v is File {
  return typeof File !== 'undefined' && v instanceof File;
}
