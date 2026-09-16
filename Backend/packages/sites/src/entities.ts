/**
 * Legal entities — which company's books a site's money belongs in.
 *
 * This is the one piece of the commercial backbone that is a business decision, not an
 * engineering one: it drives the chart of accounts, tax registration and invoicing. It is
 * therefore resolved at *runtime* rather than baked into the registry, so assigning entities is
 * a configuration change instead of a code deploy — and, critically, so that assigning them
 * later never means re-posting history. Every ledger line already carries `legalEntityId`; what
 * is missing today is only the value.
 *
 * Resolution order, most specific first:
 *   1. `LEGAL_ENTITY_<SITE_ID>` — per-site override, e.g. LEGAL_ENTITY_GTI=baalvion-sg
 *   2. the site's own `legalEntity` field in the registry
 *   3. `LEGAL_ENTITY_DEFAULT` — the entity everything else bills through
 *   4. null — genuinely unassigned
 *
 * Null is a real answer and is reported as such. A placeholder entity would look like a decision
 * that had been made, and the first sign of trouble would be a tax filing.
 */
import { siteById, assertSiteById } from './resolve';
import { declaredLegalEntities, isDeclaredLegalEntity } from './legalEntities';

export interface LegalEntityAssignment {
  siteId: string;
  legalEntityId: string | null;
  source: 'env_site' | 'registry' | 'env_default' | 'unassigned';
  /**
   * Whether `legalEntityId` names an entity declared in LEGAL_ENTITIES_JSON. False when the id
   * is a typo, and also false when nothing has been declared yet — `declarationConfigured`
   * separates those two cases.
   */
  declared: boolean;
  /** Whether any entities have been declared at all. */
  declarationConfigured: boolean;
}

function envKeyFor(siteId: string): string {
  return `LEGAL_ENTITY_${String(siteId).toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
}

/** Resolve a site's legal entity, saying where the answer came from. */
export function legalEntityFor(siteId: string, env: Record<string, string | undefined> = process.env): LegalEntityAssignment {
  const site = assertSiteById(siteId);
  const declarationConfigured = declaredLegalEntities(env).length > 0;
  const decide = (legalEntityId: string | null, source: LegalEntityAssignment['source']): LegalEntityAssignment => ({
    siteId,
    legalEntityId,
    source,
    declared: legalEntityId !== null && declarationConfigured && isDeclaredLegalEntity(legalEntityId, env),
    declarationConfigured,
  });

  const perSite = env[envKeyFor(siteId)];
  if (perSite && perSite.trim() !== '') {
    return decide(perSite.trim(), 'env_site');
  }
  if (site.legalEntity) {
    return decide(site.legalEntity, 'registry');
  }
  const fallback = env.LEGAL_ENTITY_DEFAULT;
  if (fallback && fallback.trim() !== '') {
    return decide(fallback.trim(), 'env_default');
  }
  return decide(null, 'unassigned');
}

/** Every site's assignment — for an admin view, and for a boot-time completeness check. */
export function legalEntityAssignments(env: Record<string, string | undefined> = process.env): LegalEntityAssignment[] {
  const { SITES } = require('./registry') as { SITES: ReadonlyArray<{ id: string }> };
  return SITES.map((s) => legalEntityFor(s.id, env));
}

/** Sites that would post to the ledger with no entity. Empty means the books can close cleanly. */
export function sitesWithoutLegalEntity(env: Record<string, string | undefined> = process.env): string[] {
  return legalEntityAssignments(env).filter((a) => a.legalEntityId === null).map((a) => a.siteId);
}

/**
 * For a path that genuinely cannot proceed without an entity — a ledger posting that must be
 * filed against a company. Everything else should carry the null and stay honest about it.
 */
export function assertLegalEntityFor(siteId: string, env: Record<string, string | undefined> = process.env): string {
  const assignment = legalEntityFor(siteId, env);
  if (!assignment.legalEntityId) {
    const site = siteById(siteId);
    throw new Error(
      `[sites] No legal entity assigned for "${siteId}"${site ? ` (${site.name})` : ''}. `
      + `Set ${envKeyFor(siteId)} or LEGAL_ENTITY_DEFAULT — this decides whose books the money lands in and cannot be guessed.`,
    );
  }
  return assignment.legalEntityId;
}

export interface LegalEntityConfigReport {
  ok: boolean;
  declarationConfigured: boolean;
  unassigned: string[];
  /** Sites pointed at an entity id that is not declared — almost always a typo. */
  undeclared: Array<{ siteId: string; legalEntityId: string }>;
}

/**
 * Boot-time check for a service that posts money to the ledger.
 *
 * Two different failures are separated deliberately. A site with NO entity is an open business
 * decision — it is reported, and in `strict` mode it stops the service. A site pointing at an
 * entity that was never declared is a typo, and that is always wrong once anything has been
 * declared at all: it silently opens a second set of books.
 *
 * `siteIds` narrows the check to the sites this service actually handles, so an unrelated
 * property's missing entity never blocks an unrelated deploy.
 */
export function checkLegalEntityConfig(
  options: { env?: Record<string, string | undefined>; siteIds?: readonly string[] } = {},
): LegalEntityConfigReport {
  const env = options.env ?? process.env;
  const all = legalEntityAssignments(env);
  const scoped = options.siteIds ? all.filter((a) => options.siteIds!.includes(a.siteId)) : all;
  const declarationConfigured = scoped.some((a) => a.declarationConfigured) || declaredLegalEntities(env).length > 0;

  const unassigned = scoped.filter((a) => a.legalEntityId === null).map((a) => a.siteId);
  const undeclared = declarationConfigured
    ? scoped
        .filter((a) => a.legalEntityId !== null && !a.declared)
        .map((a) => ({ siteId: a.siteId, legalEntityId: a.legalEntityId as string }))
    : [];

  return { ok: unassigned.length === 0 && undeclared.length === 0, declarationConfigured, unassigned, undeclared };
}

/**
 * The same check, as a startup assertion. An undeclared entity id always throws once a
 * declaration exists; unassigned sites throw only under `strict`, so a service can boot and
 * carry honest nulls while the entity structure is still being decided.
 */
export function assertLegalEntityConfig(
  options: { env?: Record<string, string | undefined>; siteIds?: readonly string[]; strict?: boolean } = {},
): LegalEntityConfigReport {
  const report = checkLegalEntityConfig(options);

  if (report.undeclared.length > 0) {
    const list = report.undeclared.map((u) => `${u.siteId} -> "${u.legalEntityId}"`).join(', ');
    throw new Error(
      `[sites] Legal entity ids that are not declared in LEGAL_ENTITIES_JSON: ${list}. `
      + 'An undeclared id is almost always a typo, and it opens a second set of books under a name nobody chose.',
    );
  }
  if (options.strict && report.unassigned.length > 0) {
    throw new Error(
      `[sites] No legal entity assigned for: ${report.unassigned.join(', ')}. `
      + 'Set LEGAL_ENTITY_<SITE_ID> or LEGAL_ENTITY_DEFAULT — this decides whose books the money lands in and cannot be guessed.',
    );
  }
  return report;
}
