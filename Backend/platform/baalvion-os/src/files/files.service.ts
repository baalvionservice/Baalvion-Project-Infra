import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { FileScope } from '@prisma/client';
import { PresignDto } from './files.dto';

/**
 * Object storage via S3 / MinIO — replaces Firebase Storage.
 * Clients request a presigned PUT to upload directly, and a presigned GET to download.
 */
@Injectable()
export class FilesService {
  private readonly log = new Logger(FilesService.name);
  private readonly s3: S3Client;
  private readonly bucket = process.env.S3_BUCKET || 'baalvion';
  private readonly expiry = Number(process.env.PRESIGN_EXPIRY_SECONDS) || 900;

  constructor(private readonly prisma: PrismaService) {
    this.s3 = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: (process.env.S3_FORCE_PATH_STYLE || 'true') === 'true',
      credentials:
        process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY
          ? { accessKeyId: process.env.S3_ACCESS_KEY, secretAccessKey: process.env.S3_SECRET_KEY }
          : undefined,
    });
  }

  async presignUpload(dto: PresignDto, ownerId?: string) {
    const scope = (dto.scope as FileScope) || FileScope.other;
    const safeName = (dto.filename || 'file').replace(/[^\w.\-]/g, '_');
    const key = `${scope}/${ownerId ?? 'anon'}/${randomUUID()}-${safeName}`;

    const uploadUrl = await getSignedUrl(
      this.s3,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: dto.contentType }),
      { expiresIn: this.expiry },
    );

    await this.prisma.fileObject.create({
      data: {
        ownerId: ownerId ?? null,
        scope,
        bucket: this.bucket,
        key,
        filename: dto.filename,
        contentType: dto.contentType,
        sizeBytes: dto.sizeBytes ?? null,
      },
    });

    return { key, uploadUrl, expiresIn: this.expiry };
  }

  async presignDownload(key: string) {
    const downloadUrl = await getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: this.expiry },
    );
    return { key, downloadUrl, expiresIn: this.expiry };
  }

  async remove(key: string) {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    await this.prisma.fileObject.deleteMany({ where: { key } });
    return { deleted: true };
  }
}
