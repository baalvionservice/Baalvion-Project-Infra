// ─── @baalvion/upload — centralized file storage package ─────────────────────

// S3-compatible storage operations
export {
  generateSignedUploadUrl,
  generateSignedDownloadUrl,
  deleteObject,
  copyObject,
  getObjectMetadata,
} from './storage';
export type { ObjectMetadata, SignedUrlOptions } from './storage';

// Image processing utilities
export {
  processImage,
  generateThumbnail,
  extractMetadata,
} from './image';
export type { ProcessImageOptions, ImageMetadata, ImageFormat } from './image';

// Access control, key building, and validation
export {
  buildKey,
  validateFileType,
  validateFileSize,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOC_TYPES,
  ALLOWED_VIDEO_TYPES,
} from './acl';
export type {
  UploadOwner,
  UploadPath,
  AllowedImageType,
  AllowedDocType,
  AllowedVideoType,
  AllowedMimeType,
} from './acl';
