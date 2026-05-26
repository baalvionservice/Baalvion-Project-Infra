import { buildCspHeader, SECURITY_HEADERS } from '../csp';

describe('buildCspHeader', () => {
  it('returns a string containing default-src directive', () => {
    const header = buildCspHeader();
    expect(header).toContain("default-src 'self'");
  });

  it('includes nonce in script-src when nonce is provided', () => {
    const header = buildCspHeader({ nonce: 'abc123' });
    expect(header).toContain("'nonce-abc123'");
  });

  it('does not include nonce attr when nonce is omitted', () => {
    const header = buildCspHeader();
    expect(header).not.toContain("'nonce-");
  });

  it('includes unsafe-eval in script-src when allowUnsafeEval is true', () => {
    const header = buildCspHeader({ allowUnsafeEval: true });
    expect(header).toContain("'unsafe-eval'");
  });

  it('does not include unsafe-eval when allowUnsafeEval is false (default)', () => {
    const header = buildCspHeader();
    expect(header).not.toContain("'unsafe-eval'");
  });

  it('includes allowedOrigins in connect-src', () => {
    const header = buildCspHeader({ allowedOrigins: ['https://api.example.com'] });
    expect(header).toContain('https://api.example.com');
  });

  it('includes allowedConnectSrc in connect-src', () => {
    const header = buildCspHeader({ allowedConnectSrc: ['https://metrics.baalvion.com'] });
    expect(header).toContain('https://metrics.baalvion.com');
  });

  it('includes allowedImageDomains in img-src', () => {
    const header = buildCspHeader({ allowedImageDomains: ['https://cdn.mysite.com'] });
    expect(header).toContain('https://cdn.mysite.com');
  });

  it('always includes frame-ancestors none', () => {
    const header = buildCspHeader();
    expect(header).toContain("frame-ancestors 'none'");
  });

  it('always includes object-src none', () => {
    const header = buildCspHeader();
    expect(header).toContain("object-src 'none'");
  });

  it('includes wss://*.baalvion.com in connect-src', () => {
    const header = buildCspHeader();
    expect(header).toContain('wss://*.baalvion.com');
  });

  it('includes upgrade-insecure-requests directive', () => {
    const header = buildCspHeader();
    expect(header).toContain('upgrade-insecure-requests');
  });

  it('directives are separated by semicolons', () => {
    const header = buildCspHeader();
    const parts = header.split('; ');
    expect(parts.length).toBeGreaterThan(5);
  });

  it('includes strict-dynamic in script-src', () => {
    const header = buildCspHeader();
    expect(header).toContain("'strict-dynamic'");
  });
});

describe('SECURITY_HEADERS', () => {
  it('is an array of key/value objects', () => {
    expect(Array.isArray(SECURITY_HEADERS)).toBe(true);
    for (const h of SECURITY_HEADERS) {
      expect(typeof h.key).toBe('string');
      expect(typeof h.value).toBe('string');
    }
  });

  it('includes X-Frame-Options header', () => {
    const xfo = SECURITY_HEADERS.find((h) => h.key === 'X-Frame-Options');
    expect(xfo).toBeDefined();
    expect(xfo?.value).toBe('SAMEORIGIN');
  });

  it('includes X-Content-Type-Options nosniff', () => {
    const xcto = SECURITY_HEADERS.find((h) => h.key === 'X-Content-Type-Options');
    expect(xcto?.value).toBe('nosniff');
  });

  it('includes Strict-Transport-Security with long max-age', () => {
    const hsts = SECURITY_HEADERS.find((h) => h.key === 'Strict-Transport-Security');
    expect(hsts).toBeDefined();
    expect(hsts?.value).toContain('max-age=63072000');
    expect(hsts?.value).toContain('includeSubDomains');
  });

  it('includes Referrer-Policy', () => {
    const rp = SECURITY_HEADERS.find((h) => h.key === 'Referrer-Policy');
    expect(rp?.value).toBe('strict-origin-when-cross-origin');
  });
});
