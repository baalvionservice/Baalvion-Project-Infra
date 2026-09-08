/**
 * The set of companies this platform can bill through.
 *
 * `legalEntityFor` answers *which* entity a site's money belongs to. This file answers whether
 * that entity is one the business has actually declared. Without it the entity id is free text,
 * and `baalvion-in`, `baalvion_in` and `baalvion-in ` are three different companies as far as
 * the ledger is concerned — a divergence that shows up first in a tax filing, months later.
 *
 * The entities themselves are NOT committed here. They are real corporate facts (registered
 * names, jurisdictions, tax registrations) that belong in deploy-time configuration alongside
 * every other environment-specific value, and inventing plausible-looking ones in source would
 * be worse than having none. The registry is therefore declared via `LEGAL_ENTITIES_JSON`:
 *
 *   LEGAL_ENTITIES_JSON='[{"id":"baalvion-in","name":"...","jurisdiction":"IN","baseCurrency":"INR"}]'
 *
 * Until it is declared, resolution still works exactly as before and every assignment is simply
 * reported as undeclared. Nothing is blocked; nothing is silently accepted either.
 */
export interface LegalEntity {
  /** Stable slug used in `LEGAL_ENTITY_*` and written onto every ledger line. */
  readonly id: string;
  /** Registered company name, as it appears on an invoice. */
  readonly name: string;
  /** ISO 3166-1 alpha-2 country of registration. */
  readonly jurisdiction: string;
  /** The currency this entity keeps its books in. */
  readonly baseCurrency: string;
  /** Tax registration (GSTIN, VAT number, EIN…). Null when not yet registered. */
  readonly taxId: string | null;
}

export class LegalEntityError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'LegalEntityError';
    this.code = code;
  }
}

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function requireString(value: unknown, field: string, index: number): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new LegalEntityError('MALFORMED', `LEGAL_ENTITIES_JSON[${index}].${field} must be a non-empty string`);
  }
  return value.trim();
}

/** Parse one entity, rejecting anything that would resolve ambiguously later. */
function parseEntity(raw: unknown, index: number): LegalEntity {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new LegalEntityError('MALFORMED', `LEGAL_ENTITIES_JSON[${index}] must be an object`);
  }
  const o = raw as Record<string, unknown>;
  const id = requireString(o.id, 'id', index);
  // A slug that differs only by case or separator is a different company to the ledger and an
  // identical one to a human. Pin the form so the two can never diverge.
  if (!ID_PATTERN.test(id)) {
    throw new LegalEntityError('MALFORMED', `LEGAL_ENTITIES_JSON[${index}].id "${id}" must be lowercase kebab-case`);
  }
  const jurisdiction = requireString(o.jurisdiction, 'jurisdiction', index).toUpperCase();
  if (!/^[A-Z]{2}$/.test(jurisdiction)) {
    throw new LegalEntityError('MALFORMED', `LEGAL_ENTITIES_JSON[${index}].jurisdiction "${jurisdiction}" must be an ISO 3166-1 alpha-2 code`);
  }
  const baseCurrency = requireString(o.baseCurrency, 'baseCurrency', index).toUpperCase();
  // Shape only. This registry stays dependency-free — it is imported almost everywhere — so the
  // authoritative ISO-4217 check stays in @baalvion/money, where an amount is actually built.
  if (!/^[A-Z]{3}$/.test(baseCurrency)) {
    throw new LegalEntityError('MALFORMED', `LEGAL_ENTITIES_JSON[${index}].baseCurrency "${baseCurrency}" must be a three-letter ISO 4217 code`);
  }

  const taxId = o.taxId === null || o.taxId === undefined || o.taxId === '' ? null : requireString(o.taxId, 'taxId', index);
  return { id, name: requireString(o.name, 'name', index), jurisdiction, baseCurrency, taxId };
}

/**
 * The declared entities, or an empty list when none have been configured.
 * Malformed configuration throws — a half-parsed corporate structure is worse than none.
 */
export function declaredLegalEntities(env: Record<string, string | undefined> = process.env): LegalEntity[] {
  const raw = env.LEGAL_ENTITIES_JSON;
  if (!raw || raw.trim() === '') return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new LegalEntityError('MALFORMED', `LEGAL_ENTITIES_JSON is not valid JSON: ${(err as Error).message}`);
  }
  if (!Array.isArray(parsed)) {
    throw new LegalEntityError('MALFORMED', 'LEGAL_ENTITIES_JSON must be a JSON array of entities');
  }

  const entities = parsed.map(parseEntity);
  const seen = new Set<string>();
  for (const e of entities) {
    if (seen.has(e.id)) {
      throw new LegalEntityError('DUPLICATE', `LEGAL_ENTITIES_JSON declares "${e.id}" more than once`);
    }
    seen.add(e.id);
  }
  return entities;
}

export function legalEntityById(id: string, env: Record<string, string | undefined> = process.env): LegalEntity | null {
  return declaredLegalEntities(env).find((e) => e.id === id) ?? null;
}

/** Whether an entity id refers to something declared. False when nothing is declared at all. */
export function isDeclaredLegalEntity(id: string, env: Record<string, string | undefined> = process.env): boolean {
  return legalEntityById(id, env) !== null;
}
