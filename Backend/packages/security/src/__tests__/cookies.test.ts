import { buildSecureCookieHeader, SESSION_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } from '../cookies';

describe('buildSecureCookieHeader', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('encodes name and value in the first segment', () => {
    const header = buildSecureCookieHeader('session', 'tok123');
    expect(header).toContain('session=tok123');
  });

  it('URL-encodes names/values with special characters', () => {
    const header = buildSecureCookieHeader('my cookie', 'val ue');
    expect(header.startsWith('my%20cookie=val%20ue')).toBe(true);
  });

  it('includes Max-Age with default 900', () => {
    const header = buildSecureCookieHeader('tok', 'val');
    expect(header).toContain('Max-Age=900');
  });

  it('respects custom maxAge', () => {
    const header = buildSecureCookieHeader('tok', 'val', { maxAge: 3600 });
    expect(header).toContain('Max-Age=3600');
  });

  it('includes Path=/ by default', () => {
    const header = buildSecureCookieHeader('tok', 'val');
    expect(header).toContain('Path=/');
  });

  it('respects custom path', () => {
    const header = buildSecureCookieHeader('tok', 'val', { path: '/api' });
    expect(header).toContain('Path=/api');
  });

  it('defaults SameSite to lax', () => {
    const header = buildSecureCookieHeader('tok', 'val');
    expect(header).toContain('SameSite=lax');
  });

  it('respects sameSite=strict', () => {
    const header = buildSecureCookieHeader('tok', 'val', { sameSite: 'strict' });
    expect(header).toContain('SameSite=strict');
  });

  it('includes HttpOnly', () => {
    const header = buildSecureCookieHeader('tok', 'val');
    expect(header).toContain('HttpOnly');
  });

  it('includes Secure in production', () => {
    process.env.NODE_ENV = 'production';
    const header = buildSecureCookieHeader('tok', 'val');
    expect(header).toContain('Secure');
  });

  it('does not include Secure outside production', () => {
    process.env.NODE_ENV = 'development';
    const header = buildSecureCookieHeader('tok', 'val');
    expect(header).not.toContain('Secure');
  });

  it('includes Domain when provided', () => {
    const header = buildSecureCookieHeader('tok', 'val', { domain: '.baalvion.com' });
    expect(header).toContain('Domain=.baalvion.com');
  });

  it('omits Domain when not provided', () => {
    const header = buildSecureCookieHeader('tok', 'val');
    expect(header).not.toContain('Domain=');
  });

  it('produces semicolon-separated parts', () => {
    const header = buildSecureCookieHeader('tok', 'val');
    const parts = header.split('; ');
    expect(parts.length).toBeGreaterThanOrEqual(4);
  });
});

describe('SESSION_COOKIE_OPTIONS', () => {
  it('has a maxAge of 8 hours (28800 seconds)', () => {
    expect(SESSION_COOKIE_OPTIONS.maxAge).toBe(60 * 60 * 8);
  });

  it('has path /', () => {
    expect(SESSION_COOKIE_OPTIONS.path).toBe('/');
  });

  it('has sameSite lax', () => {
    expect(SESSION_COOKIE_OPTIONS.sameSite).toBe('lax');
  });
});

describe('REFRESH_COOKIE_OPTIONS', () => {
  it('has a maxAge of 30 days', () => {
    expect(REFRESH_COOKIE_OPTIONS.maxAge).toBe(60 * 60 * 24 * 30);
  });

  it('has path /api', () => {
    expect(REFRESH_COOKIE_OPTIONS.path).toBe('/api');
  });

  it('has sameSite strict', () => {
    expect(REFRESH_COOKIE_OPTIONS.sameSite).toBe('strict');
  });
});
