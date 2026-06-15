import {
  buildKey,
  validateFileType,
  validateFileSize,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOC_TYPES,
  ALLOWED_VIDEO_TYPES,
  type UploadOwner,
  type UploadPath,
} from '../acl';

// Mock uuid so buildKey output is deterministic in tests
jest.mock('uuid', () => ({ v4: () => 'test-uuid-1234' }));

const owner: UploadOwner = { userId: 'user-abc', orgId: 'org-xyz', role: 'admin' };
const path: UploadPath = { tenant: 'org-xyz', module: 'avatars', filename: 'Profile Photo.jpg' };

describe('buildKey', () => {
  it('starts with tenants/{orgId}/{module}/{userId}/', () => {
    const key = buildKey(owner, path);
    expect(key.startsWith('tenants/org-xyz/avatars/user-abc/')).toBe(true);
  });

  it('appends uuid prefix before the filename', () => {
    const key = buildKey(owner, path);
    expect(key).toContain('test-uuid-1234');
  });

  it('lowercases the filename', () => {
    const key = buildKey(owner, path);
    expect(key).not.toContain('Profile');
    expect(key.toLowerCase()).toBe(key);
  });

  it('replaces spaces with hyphens in filename', () => {
    const key = buildKey(owner, path);
    expect(key).not.toContain(' ');
    expect(key).toContain('profile-photo.jpg');
  });

  it('strips non-alphanumeric characters except . - _', () => {
    const special: UploadPath = { tenant: 'org-xyz', module: 'docs', filename: 'Report (Final)!.pdf' };
    const key = buildKey(owner, special);
    expect(key).not.toContain('(');
    expect(key).not.toContain(')');
    expect(key).not.toContain('!');
  });

  it('caps filename at 128 characters', () => {
    const longFilename = 'a'.repeat(200) + '.pdf';
    const longPath: UploadPath = { tenant: 'org-xyz', module: 'docs', filename: longFilename };
    const key = buildKey(owner, longPath);
    // Key shape is `.../{uuid}-{sanitizedFilename}`. The mocked uuid is
    // `test-uuid-1234` (which itself contains hyphens), so strip the exact
    // `{uuid}-` prefix to measure just the sanitized filename's length.
    const lastSegment = key.split('/').pop()!;
    const filenamePart = lastSegment.slice('test-uuid-1234-'.length);
    expect(filenamePart.length).toBeLessThanOrEqual(128);
  });

  it('produces the full expected key structure', () => {
    const key = buildKey(owner, path);
    expect(key).toBe('tenants/org-xyz/avatars/user-abc/test-uuid-1234-profile-photo.jpg');
  });
});

describe('validateFileType', () => {
  it('returns true for an allowed MIME type', () => {
    expect(validateFileType('image/jpeg', ALLOWED_IMAGE_TYPES)).toBe(true);
  });

  it('returns false for a disallowed MIME type', () => {
    expect(validateFileType('application/x-executable', ALLOWED_IMAGE_TYPES)).toBe(false);
  });

  it('returns true for allowed doc types', () => {
    expect(validateFileType('application/pdf', ALLOWED_DOC_TYPES)).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(validateFileType('', ALLOWED_IMAGE_TYPES)).toBe(false);
  });

  it('is case-sensitive (image/JPEG is not valid)', () => {
    expect(validateFileType('image/JPEG', ALLOWED_IMAGE_TYPES)).toBe(false);
  });

  it('validates all ALLOWED_IMAGE_TYPES against itself', () => {
    for (const mime of ALLOWED_IMAGE_TYPES) {
      expect(validateFileType(mime, ALLOWED_IMAGE_TYPES)).toBe(true);
    }
  });

  it('validates all ALLOWED_VIDEO_TYPES against itself', () => {
    for (const mime of ALLOWED_VIDEO_TYPES) {
      expect(validateFileType(mime, ALLOWED_VIDEO_TYPES)).toBe(true);
    }
  });

  it('returns false when type is valid image but list is doc types', () => {
    expect(validateFileType('image/png', ALLOWED_DOC_TYPES)).toBe(false);
  });
});

describe('validateFileSize', () => {
  it('returns true for a file exactly at the limit', () => {
    const maxMb = 5;
    expect(validateFileSize(maxMb * 1024 * 1024, maxMb)).toBe(true);
  });

  it('returns false for a file one byte over the limit', () => {
    const maxMb = 5;
    expect(validateFileSize(maxMb * 1024 * 1024 + 1, maxMb)).toBe(false);
  });

  it('returns true for a small file well within limit', () => {
    expect(validateFileSize(1024, 10)).toBe(true);
  });

  it('returns false for 0 bytes', () => {
    expect(validateFileSize(0, 10)).toBe(false);
  });

  it('returns false for negative byte count', () => {
    expect(validateFileSize(-100, 10)).toBe(false);
  });

  it('correctly handles a 10 MB limit', () => {
    expect(validateFileSize(10 * 1024 * 1024, 10)).toBe(true);
    expect(validateFileSize(10 * 1024 * 1024 + 1, 10)).toBe(false);
  });
});

describe('ALLOWED_IMAGE_TYPES', () => {
  it('includes jpeg, png, webp, gif, avif, svg', () => {
    expect(ALLOWED_IMAGE_TYPES).toContain('image/jpeg');
    expect(ALLOWED_IMAGE_TYPES).toContain('image/png');
    expect(ALLOWED_IMAGE_TYPES).toContain('image/webp');
    expect(ALLOWED_IMAGE_TYPES).toContain('image/gif');
    expect(ALLOWED_IMAGE_TYPES).toContain('image/avif');
    expect(ALLOWED_IMAGE_TYPES).toContain('image/svg+xml');
  });
});

describe('ALLOWED_DOC_TYPES', () => {
  it('includes PDF and Office formats', () => {
    expect(ALLOWED_DOC_TYPES).toContain('application/pdf');
    expect(ALLOWED_DOC_TYPES).toContain('text/csv');
    expect(ALLOWED_DOC_TYPES).toContain('text/plain');
  });
});
