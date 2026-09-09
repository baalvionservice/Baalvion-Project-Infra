import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { siteFromRequest, brandFromRequest } = require('../../utils/brandFromOrigin');

/** Minimal Express-request stand-in — brandFromOrigin only ever calls req.get(). */
const reqWith = (headers) => ({
  get: (name) => headers[name.toLowerCase()] ?? undefined,
});

/**
 * siteFromRequest feeds auth.auth_audit_log.app_id — the column the admin console reads to answer
 * "who signed in on which site?". Its whole reason for existing (rather than reusing
 * brandFromRequest) is that an audit row must never invent an attribution, so the cases that
 * matter most here are the ones where the answer is "we do not know".
 */
describe('siteFromRequest', () => {
  it('resolves an exact registry host to its site id', () => {
    expect(siteFromRequest(reqWith({ origin: 'https://trade.baalvion.com' }))).toBe('gti');
    expect(siteFromRequest(reqWith({ origin: 'https://ir.baalvion.com' }))).toBe('ir');
  });

  it('resolves apex-owned subdomains through the suffix registry', () => {
    expect(siteFromRequest(reqWith({ origin: 'https://imperialpedia.com' }))).toBe('imperialpedia');
    expect(siteFromRequest(reqWith({ origin: 'https://www.lawelitenetwork.com' }))).toBe('law');
  });

  it('falls back to Referer when Origin is absent', () => {
    expect(siteFromRequest(reqWith({ referer: 'https://imperialpedia.com/some/article' }))).toBe('imperialpedia');
  });

  // The difference from brandFromRequest, and the point of the whole function: no origin means
  // no attribution. Recording the flagship brand here would make server-to-server calls and
  // OAuth callbacks indistinguishable from real baalvion.com sign-ins.
  it('returns null when the request carries no origin at all', () => {
    expect(siteFromRequest(reqWith({}))).toBeNull();
    expect(brandFromRequest(reqWith({}))).toBe('baalvion');
  });

  it('returns null for an unparseable origin rather than guessing', () => {
    expect(siteFromRequest(reqWith({ origin: 'not-a-url' }))).toBeNull();
  });

  // An unknown host is a real signal — a new property, or something pointing at us that should
  // not be. Recording the hostname keeps that visible instead of laundering it into 'baalvion'.
  it('records the hostname verbatim for a host outside the registry', () => {
    expect(siteFromRequest(reqWith({ origin: 'https://not-registered.example.com' })))
      .toBe('not-registered.example.com');
    expect(brandFromRequest(reqWith({ origin: 'https://not-registered.example.com' }))).toBe('baalvion');
  });

  it('keeps the port so two local apps on localhost stay distinguishable', () => {
    expect(siteFromRequest(reqWith({ origin: 'http://localhost:3071' }))).toBe('localhost:3071');
    expect(siteFromRequest(reqWith({ origin: 'http://localhost:3029' }))).toBe('localhost:3029');
  });

  // app_id is VARCHAR(64); a long hostname must not blow up the insert.
  it('truncates to the width of auth_audit_log.app_id', () => {
    const long = `https://${'a'.repeat(80)}.example.com`;
    expect(siteFromRequest(reqWith({ origin: long })).length).toBe(64);
  });
});
