/**
 * @file server/gckb/types.ts
 * @description Storage-agnostic contracts for the Global Country Knowledge Base.
 * The GCKB is a generic, registry-driven reference store: one record shape serves
 * every entity type (country, currency, authority, point_of_entry, country_policy,
 * …). Entity-specific data lives in `attributes`, validated by the registry.
 */

export type GckbStatus = 'DRAFT' | 'PUBLISHED' | 'SUPERSEDED' | 'ARCHIVED';

export const GCKB_STATUSES: readonly GckbStatus[] = ['DRAFT', 'PUBLISHED', 'SUPERSEDED', 'ARCHIVED'];

/** Provenance + temporal envelope every record carries (spec §VERSIONING). */
export interface KbEnvelope {
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  authority?: string | null;
  source?: string | null;
  auditReference?: string | null;
}

/** A request to create or update a knowledge-base record (pre-persistence). */
export interface KbWriteInput {
  /** Natural business key. Optional on create — derived by the registry if absent. */
  recordKey?: string;
  name: string;
  attributes: Record<string, unknown>;
  /** ISO country code; the service resolves it to the owning country's id. */
  countryCode?: string | null;
  /** Natural key of a parent record (e.g. a subdivision for a port). */
  parentKey?: string | null;
  code?: string | null;
  policyType?: string | null;
  hsCode?: string | null;
  productCategory?: string | null;
  tags?: string[];
  status?: GckbStatus;
  envelope?: KbEnvelope;
}

/** A typed relationship edge from a record to another record or external entity. */
export interface KbRelationshipInput {
  relationType: string;
  toType: string;
  toId?: string | null;
  toRef?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Search criteria (spec §SEARCH). All fields optional / combinable. */
export interface KbSearchQuery {
  entityType?: string;
  countryCode?: string;
  hsCode?: string;
  productCategory?: string;
  policyType?: string;
  authority?: string;
  code?: string;
  status?: GckbStatus;
  tag?: string;
  keyword?: string;
  /** Temporal filter: only records effective at this instant. */
  asOf?: string;
  page?: number;
  pageSize?: number;
}

/** Result of validating a write input against the registry. */
export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

export type LifecycleAction = 'CREATE' | 'UPDATE' | 'PUBLISH' | 'ARCHIVE' | 'SUPERSEDE' | 'IMPORT';
