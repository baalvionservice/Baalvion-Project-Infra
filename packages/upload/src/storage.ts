import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ─── S3 Client ────────────────────────────────────────────────────────────────

const s3 = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT, // for MinIO/R2 compatibility
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: !!process.env.S3_ENDPOINT,
});

const BUCKET = process.env.S3_BUCKET || 'baalvion-assets';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ObjectMetadata {
  size: number;
  contentType: string;
  lastModified: Date | undefined;
  etag: string | undefined;
}

export interface SignedUrlOptions {
  key: string;
  contentType?: string;
  expiresIn?: number; // seconds — default 900 (15 min)
}

// ─── Presigned URLs ───────────────────────────────────────────────────────────

/**
 * Generate a presigned PUT URL that allows the client to upload directly to S3.
 */
export async function generateSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 900,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Generate a presigned GET URL that allows the client to download an object.
 */
export async function generateSignedDownloadUrl(
  key: string,
  expiresIn = 900,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

// ─── Object Operations ────────────────────────────────────────────────────────

/**
 * Delete an object from S3 by key.
 */
export async function deleteObject(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  );
}

/**
 * Copy an object within the same bucket.
 */
export async function copyObject(sourceKey: string, destKey: string): Promise<void> {
  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${sourceKey}`,
      Key: destKey,
    }),
  );
}

/**
 * Fetch metadata for an object via a HEAD request.
 * Returns size, content-type, last-modified, and ETag.
 */
export async function getObjectMetadata(key: string): Promise<ObjectMetadata> {
  const response = await s3.send(
    new HeadObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  );

  return {
    size: response.ContentLength ?? 0,
    contentType: response.ContentType ?? 'application/octet-stream',
    lastModified: response.LastModified,
    etag: response.ETag,
  };
}
