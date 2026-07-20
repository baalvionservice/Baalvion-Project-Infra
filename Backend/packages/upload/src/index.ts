// ─── @baalvion/upload — centralized file storage package ─────────────────────

// S3-compatible storage operations
export {
  generateSignedUploadUrl,
  generateSignedDownloadUrl,
  putObject,
  deleteObject,
  copyObject,
  getObjectMetadata,
} from './storage.ts';
export type { ObjectMetadata, SignedUrlOptions } from './storage.ts';

// Image processing utilities
export {
  processImage,
  generateThumbnail,
  extractMetadata,
} from './image.ts';
export type { ProcessImageOptions, ImageMetadata, ImageFormat } from './image.ts';

// Access control, key building, and validation
export {
  buildKey,
  validateFileType,
  validateFileSize,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOC_TYPES,
  ALLOWED_VIDEO_TYPES,
} from './acl.ts';
export type {
  UploadOwner,
  UploadPath,
  AllowedImageType,
  AllowedDocType,
  AllowedVideoType,
  AllowedMimeType,
} from './acl.ts';

// Magic-byte content validation, malware-scan hooks, and production fail-fast guards
export {
  sniffType,
  validateContent,
  scanContent,
  assertS3ConfiguredForProduction,
  requireScannerInProduction,
} from './validate.ts';
export type {
  DetectedType,
  ContentValidationResult,
  ScanResult,
  FileScanner,
} from './validate.ts';
