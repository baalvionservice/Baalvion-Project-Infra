/**
 * @file src/services/gckb-admin-service.ts
 * @description Authenticated client for the GCKB registry's own CRUD API.
 *
 * The `/api/gckb/*` routes trust ONE thing: an HMAC-signed identity envelope. They
 * deliberately ignore anything the client asserts about itself, which is why a plain
 * browser fetch to them always fails. `/api/session/identity` is the single endpoint
 * allowed to mint that envelope, and it derives it purely from the httpOnly gateway
 * session. This module does that mint once per page, caches it for its short life,
 * and attaches it to every registry call.
 */

interface Envelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

interface IdentityHeaders {
  'x-identity-envelope': string;
  'x-identity-signature': string;
}

/** Mints are short-lived; re-mint a minute before the envelope would age out. */
const MINT_TTL_MS = 4 * 60_000;
let cached: { headers: IdentityHeaders; mintedAt: number } | null = null;
// Single-flight. A page that fires several registry calls at once (and React's
// development double-mount doubles that again) would otherwise mint an envelope per
// call, each one a round trip to the gateway, before any of them populates the cache.
let inFlight: Promise<IdentityHeaders> | null = null;

function csrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function identityHeaders(): Promise<IdentityHeaders> {
  if (cached && Date.now() - cached.mintedAt < MINT_TTL_MS) return cached.headers;
  if (inFlight) return inFlight;
  inFlight = mintIdentity().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function mintIdentity(): Promise<IdentityHeaders> {
  const csrf = csrfToken();
  const res = await fetch('/api/session/identity', {
    headers: csrf ? { 'x-csrf-token': csrf } : undefined,
    cache: 'no-store',
  });
  const body = (await res.json().catch(() => null)) as Envelope<{ envelope: string; signature: string }> | null;
  if (!res.ok || !body?.success || !body.data) {
    throw new Error(body?.error || 'Could not establish an authenticated session for the registry.');
  }

  const headers: IdentityHeaders = {
    'x-identity-envelope': body.data.envelope,
    'x-identity-signature': body.data.signature,
  };
  cached = { headers, mintedAt: Date.now() };
  return headers;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = await identityHeaders();
  const res = await fetch(path, {
    ...init,
    cache: 'no-store',
    headers: { 'content-type': 'application/json', ...auth, ...(init.headers ?? {}) },
  });
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || !body?.success || body.data == null) {
    // A stale envelope is the one failure worth retrying — drop it so the next call re-mints.
    if (res.status === 401) cached = null;
    throw new Error(body?.error || `Registry call failed (${res.status})`);
  }
  return body.data;
}

export interface FormField {
  name: string;
  label: string;
  type: 'string' | 'text' | 'number' | 'boolean' | 'date' | 'string[]' | 'enum' | 'json';
  placement: 'top' | 'attributes';
  required?: boolean;
  options?: string[];
  description?: string;
}

export interface EntityDefinition {
  entityType: string;
  label: string;
  description: string | null;
  countryScoped: boolean;
  formFields: FormField[];
}

export interface KbRecord {
  id: string;
  /** null = the platform-global baseline; a uuid = this tenant's own override of it. */
  organizationId: string | null;
  entityType: string;
  recordKey: string;
  name: string;
  code: string | null;
  countryId: string | null;
  status: string;
  version: number;
  attributes: Record<string, unknown>;
  updatedAt: string;
}

/** The registry's own description of an entity type — drives the edit form. */
export async function getEntityDefinition(entityType: string): Promise<EntityDefinition | undefined> {
  const data = await call<{ entities: EntityDefinition[] }>('/api/gckb/entities');
  return data.entities.find((e) => e.entityType === entityType);
}

/**
 * A tenant search returns the global baseline AND that tenant's overrides, so a
 * corrected record comes back twice under one natural key. Collapse them the way the
 * read side does — the override wins — or the editor offers the baseline row for edit
 * and the save collides with the override that already exists.
 */
function preferOverrides(items: KbRecord[]): KbRecord[] {
  const byKey = new Map<string, KbRecord>();
  for (const item of items) {
    const existing = byKey.get(item.recordKey);
    if (!existing || (existing.organizationId === null && item.organizationId !== null)) {
      byKey.set(item.recordKey, item);
    }
  }
  return [...byKey.values()];
}

export async function searchRecords(
  entityType: string,
  params: { keyword?: string; countryCode?: string; page?: number; pageSize?: number } = {},
): Promise<{ items: KbRecord[]; total: number; pages: number }> {
  const query = new URLSearchParams();
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.countryCode) query.set('countryCode', params.countryCode);
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 25));
  const result = await call<{ items: KbRecord[]; total: number; pages: number }>(`/api/gckb/${entityType}?${query.toString()}`);
  return { ...result, items: preferOverrides(result.items) };
}

/**
 * Patch a record's attributes. The registry versions every write and keeps the prior
 * revision, so an edit here is auditable and reversible rather than destructive.
 */
export async function updateRecord(
  entityType: string,
  id: string,
  patch: { name?: string; attributes?: Record<string, unknown>; status?: string },
): Promise<KbRecord> {
  return call(`/api/gckb/${entityType}/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export async function createRecord(
  entityType: string,
  input: { name: string; code?: string; countryCode?: string; attributes: Record<string, unknown>; status?: string },
): Promise<KbRecord> {
  return call(`/api/gckb/${entityType}`, { method: 'POST', body: JSON.stringify(input) });
}

/**
 * Save a correction to a registry record.
 *
 * The platform-global baseline is provisioned by privileged tooling and is not
 * writable by a tenant — by design, so one customer's correction cannot rewrite what
 * every other customer sees. Editing a global record therefore creates this tenant's
 * OWN override of it, sharing the natural key; reads layer that override on top of
 * the baseline for this organization only. Editing an existing override patches it.
 */
export async function saveCorrection(
  entityType: string,
  record: KbRecord,
  attributes: Record<string, unknown>,
  countryCode?: string,
): Promise<{ record: KbRecord; createdOverride: boolean }> {
  if (record.organizationId) {
    return { record: await updateRecord(entityType, record.id, { attributes }), createdOverride: false };
  }
  const created = await createRecord(entityType, {
    name: record.name,
    code: record.code ?? undefined,
    countryCode,
    attributes,
    status: 'PUBLISHED',
  });
  return { record: created, createdOverride: true };
}
