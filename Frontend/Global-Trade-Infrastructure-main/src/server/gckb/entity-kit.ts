/**
 * @file server/gckb/entity-kit.ts
 * @description Shared building blocks for the GCKB registry. Every knowledge-base
 * domain (country reference, product registry, HS registry, certificate registry,
 * …) is expressed as a set of {@link KbEntityDefinition}s assembled from these
 * primitives. Keeping the kit free of any concrete registry avoids import cycles:
 * `registry.ts` and each `registries/*.ts` module depend on this file, never on
 * each other.
 *
 * A definition is pure configuration — it declares how to validate an entity,
 * derive its natural key, which lifecycle events it emits, and (optionally) the
 * declarative field + relationship metadata that drives the registry-driven
 * Admin UI. The generic repository / service / API operate entirely off these
 * definitions, so adding an entity type is a config entry here — never a new
 * table, migration, service or route.
 */
import { z } from 'zod';
import { KbWriteInput, ValidationResult } from './types';

/**
 * Declarative descriptor for one editable field, surfaced by
 * `GET /api/gckb/entities` so the Admin UI can render dynamic create/edit forms
 * without hardcoding any entity's shape.
 */
export interface FormFieldDescriptor {
  /** Field name. For `attributes` placement this is the key inside `attributes`. */
  name: string;
  label: string;
  type: 'string' | 'text' | 'number' | 'boolean' | 'date' | 'string[]' | 'enum' | 'json';
  /** `top` = promoted column on the record; `attributes` = nested in the JSON payload. */
  placement: 'top' | 'attributes';
  required?: boolean;
  /** Allowed values when `type === 'enum'`. */
  options?: string[];
  description?: string;
}

/** A relationship type an entity can declare, for typed-edge UIs and validation. */
export interface RelationshipTypeDescriptor {
  relationType: string;
  label: string;
  /** The entity type (or external ref kind) the edge points at. */
  toType: string;
}

export interface KbEntityDefinition {
  entityType: string;
  label: string;
  /** Human description shown in the Admin UI catalog. */
  description?: string;
  /** Coarse grouping for the Admin UI (e.g. `country`, `product`, `hs`, `certificate`). */
  domain?: string;
  /** Whether the entity must belong to a country (a countryCode is required). */
  countryScoped: boolean;
  /** Whether records carry a policyType (only country_policy does). */
  usesPolicyType: boolean;
  /** Deterministically derive the natural key from a write input. */
  deriveRecordKey(input: KbWriteInput): string;
  /** Validate the write input (attributes + cross-field rules). */
  validate(input: KbWriteInput): ValidationResult;
  /** Lifecycle domain events. */
  events: { created: string; updated: string; archived: string };
  /** Extra create events derived from the input (e.g. CERTIFICATE_ADDED). */
  extraCreatedEvents?(input: KbWriteInput): string[];
  /** Declarative form metadata for the registry-driven Admin UI. */
  formFields?: FormFieldDescriptor[];
  /** Typed relationship edges this entity commonly emits. */
  relationshipTypes?: RelationshipTypeDescriptor[];
}

/** Lowercase, dash-joined, accent-stripped slug (≤ 64 chars) for natural keys. */
export function slug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 64);
}

/** Flatten a failed zod parse into `attributes.<path>: <message>` strings. */
export function zodErrors(result: z.SafeParseReturnType<unknown, unknown>): string[] {
  if (result.success) return [];
  return result.error.issues.map((i) => `attributes.${i.path.join('.')}: ${i.message}`);
}

/**
 * Build a definition whose `attributes` are validated by a single zod schema.
 * The vast majority of entities use this; only entities with a policy-type
 * discriminator (country_policy) need a bespoke definition.
 */
export function simpleEntity(opts: {
  entityType: string;
  label: string;
  countryScoped: boolean;
  schema: z.ZodTypeAny;
  recordKey: (input: KbWriteInput) => string;
  events?: Partial<KbEntityDefinition['events']>;
  description?: string;
  domain?: string;
  formFields?: FormFieldDescriptor[];
  relationshipTypes?: RelationshipTypeDescriptor[];
}): KbEntityDefinition {
  const base = opts.entityType.toUpperCase();
  return {
    entityType: opts.entityType,
    label: opts.label,
    description: opts.description,
    domain: opts.domain,
    countryScoped: opts.countryScoped,
    usesPolicyType: false,
    deriveRecordKey: (input) => input.recordKey?.trim() || opts.recordKey(input),
    validate: (input) => {
      const r = opts.schema.safeParse(input.attributes ?? {});
      return r.success ? { ok: true } : { ok: false, errors: zodErrors(r) };
    },
    events: {
      created: opts.events?.created ?? `${base}_CREATED`,
      updated: opts.events?.updated ?? `${base}_UPDATED`,
      archived: opts.events?.archived ?? `${base}_ARCHIVED`,
    },
    formFields: opts.formFields,
    relationshipTypes: opts.relationshipTypes,
  };
}
