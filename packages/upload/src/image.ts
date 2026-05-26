import sharp from 'sharp';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'gif';

export interface ProcessImageOptions {
  width?: number;
  height?: number;
  format?: ImageFormat;
  quality?: number; // 1–100
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha: boolean;
}

// ─── Image Processing ─────────────────────────────────────────────────────────

/**
 * Process an image buffer: resize, convert format, and adjust quality.
 * Returns a new Buffer containing the processed image.
 */
export async function processImage(
  buffer: Buffer,
  opts: ProcessImageOptions = {},
): Promise<Buffer> {
  let pipeline = sharp(buffer);

  if (opts.width || opts.height) {
    pipeline = pipeline.resize(opts.width, opts.height, {
      fit: opts.fit ?? 'cover',
      withoutEnlargement: true,
    });
  }

  const format = opts.format ?? 'jpeg';
  const quality = opts.quality ?? 80;

  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
    case 'png':
      pipeline = pipeline.png({ quality, compressionLevel: 8 });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality });
      break;
    case 'gif':
      pipeline = pipeline.gif();
      break;
    default:
      pipeline = pipeline.jpeg({ quality });
  }

  return pipeline.toBuffer();
}

/**
 * Generate a 200x200 JPEG thumbnail from an image buffer.
 */
export async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(200, 200, { fit: 'cover', withoutEnlargement: true })
    .jpeg({ quality: 75, mozjpeg: true })
    .toBuffer();
}

/**
 * Extract image metadata (dimensions, format, file size, alpha channel).
 */
export async function extractMetadata(buffer: Buffer): Promise<ImageMetadata> {
  const meta = await sharp(buffer).metadata();
  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    format: meta.format ?? 'unknown',
    size: meta.size ?? buffer.byteLength,
    hasAlpha: meta.hasAlpha ?? false,
  };
}
