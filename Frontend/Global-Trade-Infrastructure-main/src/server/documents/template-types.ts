/**
 * @file server/documents/template-types.ts
 * @description MODULE 5 — Universal Document Engine: the data model for document
 * templates. A template is pure configuration (variables + sections + validation
 * + signature/QR scheme + localization + output formats) — there is no document
 * type hardcoded in code; a new document type is a template record. Shared by the
 * `document_template` GCKB registry entity (validation) and the render engine.
 */
import { z } from 'zod';

/** Output formats the engine can render. PDF is emitted as print-ready HTML. */
export const OUTPUT_FORMATS = ['PDF', 'HTML', 'JSON', 'XML'] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

/** Variable value types a template can declare. */
export const VARIABLE_TYPES = ['string', 'number', 'boolean', 'date', 'array', 'object'] as const;

/** A declared template variable (typed, optionally required, with a default). */
export const variableSchema = z.object({
  name: z.string().min(1),
  label: z.string().optional(),
  type: z.enum(VARIABLE_TYPES),
  required: z.boolean().optional(),
  default: z.unknown().optional(),
  description: z.string().optional(),
});
export type TemplateVariable = z.infer<typeof variableSchema>;

/** A column in a repeating (table) section. `value` is a `{{row.path}}` template. */
export const columnSchema = z.object({
  header: z.string(),
  value: z.string(), // interpolated against each row item (exposed as `row`)
  align: z.enum(['left', 'right', 'center']).optional(),
});

/** A label/value pair in a fields section. `value` is an interpolation template. */
export const fieldSchema = z.object({
  label: z.string(),
  value: z.string(),
});

/** A section of the document body. */
export const sectionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['text', 'fields', 'table', 'signature', 'qr']),
  title: z.string().optional(),
  content: z.string().optional(), // for `text` — interpolation template
  fields: z.array(fieldSchema).optional(), // for `fields`
  repeatOver: z.string().optional(), // for `table` — the array variable name
  columns: z.array(columnSchema).optional(), // for `table`
});
export type TemplateSection = z.infer<typeof sectionSchema>;

/** A boundary validation rule over the input data (beyond required variables). */
export const validationRuleSchema = z.object({
  field: z.string().min(1),
  rule: z.enum(['required', 'min', 'max', 'regex', 'in', 'nonEmpty']),
  value: z.unknown().optional(),
  message: z.string().optional(),
});
export type ValidationRule = z.infer<typeof validationRuleSchema>;

/** Digital-signature scheme metadata (no signing implemented in Phase 1). */
export const signatureSchema = z.object({
  required: z.boolean().optional(),
  standard: z.string().optional(), // eIDAS | PAdES | PKI | …
  signatories: z.array(z.string()).optional(), // role names that must sign
});

/** QR verification metadata. */
export const qrSchema = z.object({
  enabled: z.boolean().optional(),
  contentTemplate: z.string().optional(), // e.g. "{{documentNumber}}|{{hash}}"
  urlTemplate: z.string().optional(),
});

/**
 * The full document template. `labels[locale][key]` supplies localized strings;
 * `outputFormats` declares which renderers are offered.
 */
export const documentTemplateSchema = z.object({
  documentType: z.string().min(1), // COMMERCIAL_INVOICE | PACKING_LIST | CERTIFICATE_OF_ORIGIN | …
  engineVersion: z.string().optional(),
  locales: z.array(z.string()).optional(),
  defaultLocale: z.string().optional(),
  outputFormats: z.array(z.enum(OUTPUT_FORMATS)).optional(),
  variables: z.array(variableSchema).default([]),
  sections: z.array(sectionSchema).default([]),
  validations: z.array(validationRuleSchema).optional(),
  signature: signatureSchema.optional(),
  qr: qrSchema.optional(),
  labels: z.record(z.string(), z.record(z.string(), z.string())).optional(),
});
export type DocumentTemplate = z.infer<typeof documentTemplateSchema>;
