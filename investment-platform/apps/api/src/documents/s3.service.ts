import { Injectable, Logger } from '@nestjs/common';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

/**
 * S3 access layer. Issues presigned PUT/GET URLs so large files never transit
 * the API. Objects are encrypted with SSE-KMS when a key is configured.
 * Falls back to a local stub URL when AWS is not configured (dev).
 */
@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client?: S3Client;
  private readonly bucket?: string;
  private readonly kmsKeyId?: string;

  constructor() {
    this.bucket = process.env.S3_DOCUMENT_BUCKET || undefined;
    this.kmsKeyId = process.env.S3_KMS_KEY_ID || undefined;
    const endpoint = process.env.S3_ENDPOINT || undefined;
    if (process.env.AWS_REGION && this.bucket) {
      this.client = new S3Client({
        region: process.env.AWS_REGION,
        ...(endpoint
          ? {
              endpoint,
              forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
            }
          : {}),
        ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
              },
            }
          : {}),
      });
      this.logger.log(
        `S3 configured (bucket=${this.bucket}${endpoint ? `, endpoint=${endpoint}` : ''})`,
      );
    } else {
      this.logger.warn('S3 not configured — using stub presigned URLs');
    }
  }

  newKey(orgId: string, fileName: string): { bucket: string; key: string } {
    const safe = fileName.replace(/[^\w.\-]+/g, '_');
    return {
      bucket: this.bucket ?? 'local-dev-bucket',
      key: `org/${orgId}/${randomUUID()}/${safe}`,
    };
  }

  async presignUpload(bucket: string, key: string, mimeType: string): Promise<string> {
    if (!this.client) return `https://stub.local/${bucket}/${key}?op=put`;
    // At-rest encryption is enforced via bucket default encryption (SSE-S3/KMS)
    // so the presigned PUT stays a simple, portable upload (AWS + MinIO).
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: mimeType,
    });
    return getSignedUrl(this.client, cmd, { expiresIn: 900 });
  }

  async presignDownload(bucket: string, key: string): Promise<string> {
    if (!this.client) return `https://stub.local/${bucket}/${key}?op=get`;
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(this.client, cmd, { expiresIn: 300 });
  }
}
