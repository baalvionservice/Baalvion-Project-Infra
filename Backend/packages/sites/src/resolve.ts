/**
 * Host resolution and rail authorisation.
 *
 * Two different callers need two different failure modes, so there are two functions for each
 * question: a nullable lookup for presentation concerns (which logo to theme a login page with)
 * and a throwing one for money. Attributing a payment to the wrong site is not recoverable by
 * a fallback, so the money path fails closed.
 */
import { SITES, INFRASTRUCTURE_HOSTS, UNCLASSIFIED_HOSTS } from './registry';
import type { Site, PaymentRail } from './types';

export class SiteRegistryError extends Error {
  public readonly code: string;
  public readonly detail: Record<string, unknown>;
  constructor(code: string, message: string, detail: Record<string, unknown> = {}) {
    super(message);
    this.name = 'SiteRegistryError';
    this.code = code;
    this.detail = detail;
  }
}

const BY_ID = new Map<string, Site>();
const BY_DOMAIN = new Map<string, Site>();
/** Apexes whose unmatched subdomains belong to one site, longest first so the match is specific. */
const APEX_OWNERS: Array<{ apex: string; site: Site }> = [];

for (const site of SITES) {
  if (BY_ID.has(site.id)) {
    throw new SiteRegistryError('DUPLICATE_SITE_ID', `Duplicate site id "${site.id}" in the registry`, { id: site.id });
  }
  BY_ID.set(site.id, site);
  for (const domain of site.domains) {
    const host = domain.toLowerCase();
    const existing = BY_DOMAIN.get(host);
    if (existing) {
      throw new SiteRegistryError('DUPLICATE_DOMAIN', `Domain "${host}" is claimed by both "${existing.id}" and "${site.id}"`, { host });
    }
    BY_DOMAIN.set(host, site);
  }
  if (site.apexOwnsSubdomains && site.domains[0]) {
    APEX_OWNERS.push({ apex: site.domains[0].toLowerCase(), site });
  }
}
APEX_OWNERS.sort((a, b) => b.apex.length - a.apex.length);

const INFRA = new Set(INFRASTRUCTURE_HOSTS.map((h) => h.toLowerCase()));
const UNCLASSIFIED = new Set(UNCLASSIFIED_HOSTS.map((h) => h.toLowerCase()));

/** Strip protocol, port, trailing dot and case. Accepts a bare host or a full URL. */
export function normalizeHost(input: string): string {
  if (typeof input !== 'string' || input.trim() === '') return '';
  let host = input.trim();
  if (host.includes('://')) {
    try { host = new URL(host).hostname; } catch { return ''; }
  }
  host = host.split('/')[0] ?? '';
  const lastColon = host.lastIndexOf(':');
  // Strip a port, but leave a bare IPv6 literal alone.
  if (lastColon > -1 && !host.includes(']') && host.indexOf(':') === lastColon) host = host.slice(0, lastColon);
  return host.replace(/\.$/, '').toLowerCase();
}

export type HostClass = 'site' | 'infrastructure' | 'unclassified' | 'unknown';

export function classifyHost(input: string): HostClass {
  const host = normalizeHost(input);
  if (!host) return 'unknown';
  if (siteForHost(host)) return 'site';
  if (INFRA.has(host)) return 'infrastructure';
  if (UNCLASSIFIED.has(host)) return 'unclassified';
  return 'unknown';
}

/** Resolve a hostname to its site, or null. Never guesses. */
export function siteForHost(input: string): Site | null {
  const host = normalizeHost(input);
  if (!host) return null;

  const exact = BY_DOMAIN.get(host);
  if (exact) return exact;

  if (host.startsWith('www.')) {
    const bare = BY_DOMAIN.get(host.slice(4));
    if (bare) return bare;
  }

  // Infrastructure is checked before the apex fallback so an API host on an apex that owns
  // its subdomains is never attributed to that site.
  if (INFRA.has(host)) return null;

  for (const { apex, site } of APEX_OWNERS) {
    if (host === apex || host.endsWith(`.${apex}`)) return site;
  }
  return null;
}

export function siteIdForHost(input: string): string | null {
  return siteForHost(input)?.id ?? null;
}

/**
 * Resolve a hostname to its site or throw. Use this on any path that records money — an
 * unattributable payment must stop the request, not land under a default.
 */
export function assertSiteForHost(input: string): Site {
  const site = siteForHost(input);
  if (!site) {
    throw new SiteRegistryError(
      'UNKNOWN_HOST',
      `Host "${normalizeHost(input) || input}" is not a registered site. Add it to @baalvion/sites before it can carry money.`,
      { host: normalizeHost(input), classification: classifyHost(input) },
    );
  }
  return site;
}

export function siteById(id: string): Site | null {
  return BY_ID.get(id) ?? null;
}

export function assertSiteById(id: string): Site {
  const site = BY_ID.get(id);
  if (!site) throw new SiteRegistryError('UNKNOWN_SITE_ID', `No site registered with id "${id}"`, { id });
  return site;
}

export function allSites(): readonly Site[] {
  return SITES;
}

export function sitesWithRails(): readonly Site[] {
  return SITES.filter((s) => s.rails.length > 0);
}

export function railsFor(siteId: string): readonly PaymentRail[] {
  return assertSiteById(siteId).rails;
}

export function isRailAllowed(siteId: string, rail: PaymentRail): boolean {
  const site = siteById(siteId);
  return site ? site.rails.includes(rail) : false;
}

/** True only when a human confirmed this rail — the bar for authorising a charge. */
export function isRailConfirmed(siteId: string, rail: PaymentRail): boolean {
  const site = siteById(siteId);
  return Boolean(site && site.railsBasis === 'confirmed' && site.rails.includes(rail));
}

/**
 * Fail closed: a site with no rails configured cannot charge at all, and a site that has
 * rails cannot charge on one it was not granted.
 */
export function assertRailAllowed(siteId: string, rail: PaymentRail): void {
  const site = assertSiteById(siteId);
  if (site.rails.length === 0) {
    throw new SiteRegistryError(
      'NO_RAILS_CONFIGURED',
      `Site "${siteId}" has no payment rails configured and cannot take money. Set them in @baalvion/sites.`,
      { siteId, rail },
    );
  }
  if (!site.rails.includes(rail)) {
    throw new SiteRegistryError(
      'RAIL_NOT_PERMITTED',
      `Site "${siteId}" is not permitted to charge on "${rail}". Permitted: ${site.rails.join(', ')}.`,
      { siteId, rail, permitted: site.rails },
    );
  }
}
