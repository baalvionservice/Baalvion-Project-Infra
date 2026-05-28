import { v4 as uuidv4 } from 'uuid';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadOwner {
  userId: string;
  orgId: string;
  role: string;
}

export interface UploadPath {
  tenant: string;
  module: string;
  filename: string;
}

// ─── Allowed MIME Type Constants ──────────────────────────────────────────────

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
] as const;

export const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
] as const;

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];
export type AllowedDocType = (typeof ALLOWED_DOC_TYPES)[number];
export type AllowedVideoType = (typeof ALLOWED_VIDEO_TYPES)[number];
export type AllowedMimeType = AllowedImageType | AllowedDocType | AllowedVideoType;

// ─── Key Builder ──────────────────────────────────────────────────────────────

/**
 * Build a deterministic, tenant-scoped S3 object key.
 *
 * Pattern: `tenants/{orgId}/{module}/{userId}/{uuid}-{sanitizedFilename}`
 */
export function buildKey(owner: UploadOwner, path: UploadPath): string {
  const sanitized = path.filename
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.\-_]/g, '')
    .slice(0, 128); // cap filename length

  return `tenants/${owner.orgId}/${path.module}/${owner.userId}/${uuidv4()}-${sanitized}`;
}

// ─── Validators ───────────────────────────────────────────────────────────────

/**
 * Validate that the given content-type is in the allowed list.
 */
export function validateFileType(
  contentType: string,
  allowed: readonly string[],
): boolean {
  return allowed.includes(contentType);
}

/**
 * Validate that the file size (in bytes) does not exceed the given limit in megabytes.
 */
export function validateFileSize(bytes: number, maxMb: number): boolean {
  return bytes > 0 && bytes <= maxMb * 1024 * 1024;
}
