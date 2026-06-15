import {
  sniffType,
  validateContent,
  scanContent,
  assertS3ConfiguredForProduction,
  requireScannerInProduction,
} from '../validate';

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const pdf = Buffer.from('%PDF-1.7\n...', 'ascii');
const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
const eicar = Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*', 'ascii');

describe('sniffType', () => {
  it('detects common formats by magic bytes', () => {
    expect(sniffType(png)).toBe('png');
    expect(sniffType(jpeg)).toBe('jpeg');
    expect(sniffType(pdf)).toBe('pdf');
    expect(sniffType(zip)).toBe('zip');
  });
  it('returns unknown for unrecognized/short input', () => {
    expect(sniffType(Buffer.from([0x00]))).toBe('unknown');
  });
});

describe('validateContent', () => {
  it('accepts content that matches the declared type', () => {
    expect(validateContent(png, 'image/png').ok).toBe(true);
  });
  it('rejects a polyglot: declared image/png but bytes are a zip', () => {
    const res = validateContent(zip, 'image/png');
    expect(res.ok).toBe(false);
    expect(res.detected).toBe('zip');
  });
  it('passes declared types with no binary signature (text/csv)', () => {
    expect(validateContent(Buffer.from('a,b,c\n1,2,3'), 'text/csv').ok).toBe(true);
  });
  it('accepts docx (declared OOXML, zip container)', () => {
    expect(
      validateContent(zip, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document').ok,
    ).toBe(true);
  });
});

describe('scanContent', () => {
  it('flags the EICAR test signature with no external scanner', async () => {
    const res = await scanContent(eicar, { filename: 'x.txt' });
    expect(res.clean).toBe(false);
  });
  it('passes clean content', async () => {
    expect((await scanContent(png)).clean).toBe(true);
  });
  it('honors a provided scanner verdict', async () => {
    const res = await scanContent(png, {}, async () => ({ clean: false, reason: 'flagged' }));
    expect(res.clean).toBe(false);
  });
});

describe('production guards', () => {
  it('assertS3ConfiguredForProduction throws when S3 unset in production', () => {
    expect(() => assertS3ConfiguredForProduction({ NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toThrow();
  });
  it('assertS3ConfiguredForProduction passes when configured', () => {
    expect(() =>
      assertS3ConfiguredForProduction({
        NODE_ENV: 'production',
        S3_BUCKET: 'b',
        S3_ACCESS_KEY: 'k',
        S3_SECRET_KEY: 's',
      } as NodeJS.ProcessEnv),
    ).not.toThrow();
  });
  it('assertS3ConfiguredForProduction is a no-op outside production', () => {
    expect(() => assertS3ConfiguredForProduction({ NODE_ENV: 'development' } as NodeJS.ProcessEnv)).not.toThrow();
  });
  it('requireScannerInProduction throws when no scanner and required', () => {
    expect(() => requireScannerInProduction(undefined, { NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toThrow();
  });
  it('requireScannerInProduction can be opted out', () => {
    expect(() =>
      requireScannerInProduction(undefined, {
        NODE_ENV: 'production',
        UPLOAD_SCAN_REQUIRED: 'false',
      } as NodeJS.ProcessEnv),
    ).not.toThrow();
  });
});
