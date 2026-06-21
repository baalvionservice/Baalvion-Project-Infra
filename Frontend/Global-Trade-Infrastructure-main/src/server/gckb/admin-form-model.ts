/**
 * @file server/gckb/admin-form-model.ts
 * @description The registry-driven Admin form engine. It turns the GCKB registry's
 * declarative metadata (entity `formFields` + per-policy-type form descriptors)
 * into a normalised form schema, and round-trips a flat form-values object back
 * into a validated {@link KbWriteInput} — splitting promoted "top" columns from
 * nested `attributes`, coercing each field to its declared type.
 *
 * This is the brain of the registry-driven Admin UI: any front-end (a browser
 * form, a Next Server Action, a CLI) renders `buildFormSchema(...)` and submits
 * through `formValuesToWriteInput(...)`, so adding an entity or a policy type
 * grows the Admin surface with no code change. Pure and fully unit-testable — no
 * database, no auth, no I/O.
 *
 * NOTE on the Admin write path: the authenticated GCKB mutation routes
 * (`/api/gckb/[entity]/*`) verify the centralized gateway identity envelope. A
 * browser cannot mint that envelope, so wiring the Admin UI's writes requires the
 * centralized-auth seam (a Server Action that resolves the session principal and
 * calls `gckbService` in-process, or a `/trade-bff/gckb/*` gateway rewrite) — by
 * design, not hand-rolled here. This module is that path's typed, tested core.
 */
import { getEntityDefinition } from './registry';
import { getPolicyForm } from './policy-forms';
import { FormFieldDescriptor } from './entity-kit';
import { KbWriteInput, GckbStatus } from './types';

/** Promoted, top-level write fields the form may collect (everything else is `attributes`). */
const TOP_FIELDS = new Set(['name', 'code', 'countryCode', 'policyType', 'hsCode', 'productCategory', 'tags']);

export interface AdminFormSchema {
  entityType: string;
  label: string;
  description: string | null;
  countryScoped: boolean;
  usesPolicyType: boolean;
  policyType: string | null;
  /** Promoted column fields (placement 'top'). */
  topFields: FormFieldDescriptor[];
  /** Nested `attributes` fields — for country_policy these come from the selected policy type. */
  attributeFields: FormFieldDescriptor[];
}

/**
 * Build the Admin form schema for an entity type. For `country_policy`, pass the
 * chosen `policyType` to get that type's attribute fields; without it, the
 * attribute section is empty (the UI first asks the user to pick a policy type).
 */
export function buildFormSchema(entityType: string, policyType?: string | null): AdminFormSchema | null {
  const def = getEntityDefinition(entityType);
  if (!def) return null;

  const fields = def.formFields ?? [];
  const topFields = fields.filter((f) => f.placement === 'top');

  let attributeFields: FormFieldDescriptor[];
  if (def.usesPolicyType) {
    attributeFields = policyType ? getPolicyForm(policyType)?.formFields ?? [] : [];
  } else {
    attributeFields = fields.filter((f) => f.placement === 'attributes');
  }

  return {
    entityType: def.entityType,
    label: def.label,
    description: def.description ?? null,
    countryScoped: def.countryScoped,
    usesPolicyType: def.usesPolicyType,
    policyType: def.usesPolicyType ? policyType ?? null : null,
    topFields,
    attributeFields,
  };
}

/** Coerce a raw form value to its declared field type. Returns `undefined` to omit. */
export function coerceValue(field: FormFieldDescriptor, raw: unknown): unknown {
  if (raw === undefined || raw === null || raw === '') return undefined;

  switch (field.type) {
    case 'number': {
      const n = typeof raw === 'number' ? raw : Number(raw);
      return Number.isFinite(n) ? n : undefined;
    }
    case 'boolean':
      return raw === true || raw === 'true' || raw === 'on' || raw === 1 || raw === '1';
    case 'string[]':
      if (Array.isArray(raw)) return raw.map((v) => String(v).trim()).filter(Boolean);
      return String(raw)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    case 'json':
      if (typeof raw === 'object') return raw;
      try {
        return JSON.parse(String(raw));
      } catch {
        return String(raw); // surface the raw text; registry validation will reject if invalid
      }
    case 'date':
    case 'string':
    case 'text':
    case 'enum':
    default:
      return typeof raw === 'string' ? raw : String(raw);
  }
}

/**
 * Convert a flat `{ fieldName: value }` form submission into a {@link KbWriteInput},
 * placing promoted fields at the top and everything else under `attributes`,
 * coercing every value to its declared type. The result is ready for
 * `gckbService.create/update` (and for `getEntityDefinition(entityType).validate`).
 */
export function formValuesToWriteInput(schema: AdminFormSchema, values: Record<string, unknown>): KbWriteInput {
  const attributes: Record<string, unknown> = {};
  const write: Partial<KbWriteInput> = { attributes };

  for (const field of schema.attributeFields) {
    const v = coerceValue(field, values[field.name]);
    if (v !== undefined) attributes[field.name] = v;
  }

  for (const field of schema.topFields) {
    if (!TOP_FIELDS.has(field.name)) {
      // A 'top'-placed field that isn't a known promoted column lands in attributes.
      const v = coerceValue(field, values[field.name]);
      if (v !== undefined) attributes[field.name] = v;
      continue;
    }
    const v = coerceValue(field, values[field.name]);
    if (v === undefined) continue;
    switch (field.name) {
      case 'name':
        write.name = String(v);
        break;
      case 'code':
        write.code = String(v);
        break;
      case 'countryCode':
        write.countryCode = String(v);
        break;
      case 'policyType':
        write.policyType = String(v);
        break;
      case 'hsCode':
        write.hsCode = String(v);
        break;
      case 'productCategory':
        write.productCategory = String(v);
        break;
      case 'tags':
        write.tags = Array.isArray(v) ? (v as string[]) : [String(v)];
        break;
    }
  }

  // For country_policy, the chosen policyType from the schema wins if the form omitted it.
  if (schema.usesPolicyType && schema.policyType && !write.policyType) {
    write.policyType = schema.policyType;
  }

  // `status` is a workflow action, not a form field, but accept an explicit override.
  if (typeof values.status === 'string') write.status = values.status as GckbStatus;

  return { name: write.name ?? '', attributes, ...write } as KbWriteInput;
}

/** The workflow transitions the Admin UI exposes, in order. Mirrors gckb-service. */
export const WORKFLOW_ACTIONS = ['DRAFT', 'REVIEW', 'PUBLISH', 'ARCHIVE'] as const;
export type WorkflowAction = (typeof WORKFLOW_ACTIONS)[number];
