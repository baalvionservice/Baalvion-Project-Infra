/**
 * @file server/gckb/registries/document.ts
 * @description MODULE 5 — Universal Document Engine: the `document_template`
 * registry entity. A template is configuration (variables, sections, validation,
 * signature/QR scheme, localization, output formats) validated by the shared
 * `documentTemplateSchema`. Registering it with the GCKB engine gives templates
 * versioning, history, search, import/export, audit, events and RLS for free —
 * **no new table, migration, service or route**. The pure render engine lives in
 * `server/documents/template-engine.ts`; rendered output can be attached to a
 * trade via the existing `documentService` (instance storage).
 *
 * No document types are hardcoded and nothing is seeded — a new document type
 * (Commercial Invoice, Packing List, Certificate of Origin, Bill of Lading, Air
 * Waybill, Purchase/Sales Order, Quotation, RFQ, Contract, …) is a template
 * record loaded through the import API.
 */
import { KbWriteInput } from '../types';
import { KbEntityDefinition, RelationshipTypeDescriptor, simpleEntity, slug } from '../entity-kit';
import { documentTemplateSchema } from '../../documents/template-types';

/** Typed relationship edges for document templates (no magic strings). */
export const DOCUMENT_RELATIONSHIP_TYPES = {
  /** document_template → certificate_type (this template renders that certificate) */
  RENDERS_CERTIFICATE: 'RENDERS_CERTIFICATE',
  /** document_template → rule (validation enforced by a Rule-Engine rule) */
  VALIDATED_BY_RULE: 'VALIDATED_BY_RULE',
  /** document_template → workflow (issuance/approval workflow — Module 6) */
  ISSUED_VIA_WORKFLOW: 'ISSUED_VIA_WORKFLOW',
  /** document_template → document_template (a localized or derived variant) */
  VARIANT_OF: 'VARIANT_OF',
} as const;

export type DocumentRelationshipType =
  (typeof DOCUMENT_RELATIONSHIP_TYPES)[keyof typeof DOCUMENT_RELATIONSHIP_TYPES];

function templateKey(i: KbWriteInput): string {
  const docType = i.attributes?.documentType ? String(i.attributes.documentType).toUpperCase() : null;
  const code = i.code ? String(i.code).toUpperCase() : slug(i.name).toUpperCase();
  return docType ? `${docType}:${code}` : code;
}

const documentRelationshipTypes: RelationshipTypeDescriptor[] = [
  { relationType: DOCUMENT_RELATIONSHIP_TYPES.RENDERS_CERTIFICATE, label: 'Renders certificate', toType: 'certificate_type' },
  { relationType: DOCUMENT_RELATIONSHIP_TYPES.VALIDATED_BY_RULE, label: 'Validated by rule', toType: 'rule' },
  { relationType: DOCUMENT_RELATIONSHIP_TYPES.ISSUED_VIA_WORKFLOW, label: 'Issued via workflow', toType: 'workflow' },
  { relationType: DOCUMENT_RELATIONSHIP_TYPES.VARIANT_OF, label: 'Variant of', toType: 'document_template' },
];

export const documentEntities: KbEntityDefinition[] = [
  simpleEntity({
    entityType: 'document_template',
    label: 'Document Template',
    description: 'A configurable trade-document template (variables, sections, validation, signature/QR scheme, localization, output formats) rendered by the pure document engine.',
    domain: 'document',
    countryScoped: false,
    schema: documentTemplateSchema,
    recordKey: templateKey,
    events: { created: 'DOCUMENT_TEMPLATE_CREATED', updated: 'DOCUMENT_TEMPLATE_UPDATED', archived: 'DOCUMENT_TEMPLATE_ARCHIVED' },
    relationshipTypes: documentRelationshipTypes,
    formFields: [
      { name: 'name', label: 'Template name', type: 'string', placement: 'top', required: true },
      { name: 'code', label: 'Code', type: 'string', placement: 'top' },
      { name: 'tags', label: 'Tags', type: 'string[]', placement: 'top' },
      { name: 'documentType', label: 'Document type', type: 'string', placement: 'attributes', required: true },
      { name: 'locales', label: 'Locales', type: 'string[]', placement: 'attributes' },
      { name: 'defaultLocale', label: 'Default locale', type: 'string', placement: 'attributes' },
      { name: 'outputFormats', label: 'Output formats', type: 'string[]', placement: 'attributes' },
      { name: 'variables', label: 'Variables', type: 'json', placement: 'attributes' },
      { name: 'sections', label: 'Sections', type: 'json', placement: 'attributes' },
      { name: 'validations', label: 'Validation rules', type: 'json', placement: 'attributes' },
      { name: 'signature', label: 'Signature scheme', type: 'json', placement: 'attributes' },
      { name: 'qr', label: 'QR scheme', type: 'json', placement: 'attributes' },
      { name: 'labels', label: 'Localization labels', type: 'json', placement: 'attributes' },
    ],
  }),
];
