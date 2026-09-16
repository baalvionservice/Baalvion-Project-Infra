import { describe, it, expect } from 'vitest';
import { isPublicPath, PUBLIC_PATHS } from './public-paths';

/**
 * Regression guard for a bug that shipped three times over.
 *
 * middleware.ts, AuthProvider.tsx and api/client.ts each kept their own copy of the public-path
 * list and tested `pathname.startsWith('/login')`. That also matched /login-activity, so the
 * middleware bounced signed-in admins to /dashboard and AuthProvider skipped the session
 * bootstrap entirely — the page then rendered "You don't have access" to a super_admin.
 */
describe('isPublicPath', () => {
  it('matches the public pages themselves', () => {
    for (const p of PUBLIC_PATHS) expect(isPublicPath(p)).toBe(true);
  });

  it('matches sub-paths of a public page', () => {
    expect(isPublicPath('/reset-password/some-token')).toBe(true);
    expect(isPublicPath('/mfa/verify')).toBe(true);
  });

  it('does NOT match a route that merely starts with a public path', () => {
    expect(isPublicPath('/login-activity')).toBe(false);
    expect(isPublicPath('/logins')).toBe(false);
    expect(isPublicPath('/reset-password-history')).toBe(false);
  });

  it('does not match unrelated authenticated routes', () => {
    for (const p of ['/dashboard', '/audit-logs', '/sessions', '/cms']) {
      expect(isPublicPath(p)).toBe(false);
    }
  });
});
