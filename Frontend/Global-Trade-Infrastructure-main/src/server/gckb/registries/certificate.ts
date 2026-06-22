/**
 * @file server/gckb/registries/certificate.ts
 * @description MODULE 3 — Global Certificate Registry, expressed as GCKB registry
 * configuration. Two entities: `certificate_type` (the catalogue of certificate
 * kinds — Certificate of Origin, Phytosanitary, CE, Health, Conformity, …, with
 * issuing authority, validity/renewal policy, digital-signature + QR-verification
 * scheme metadata, product/country scope, and document/workflow/rule references)
 * and `certificate` (an issued instance — serial, holder, validity window,
 * signature + QR payload, renewal chain). Both ride the GCKB engine, inheriting
 * versioning, history, search, import/export, audit, events and RLS with **no new
 * table, migration, service or route**.
 *
 * Digital-signature and QR fields hold **metadata only** — no signing or
 * cryptographic verification service is implemented in Phase 1 (consistent with
 * the GCKB "metadata, not integration" boundary). Nothing is seeded.
 */
import { z } from 'zod';
import { KbWriteInput } from '../types';
import {
  KbEntityDefinition,
  RelationshipTypeDescriptor,
  simpleEntity,
  slug,
} from '../entity-kit';

/** Typed relationship edges for the certificate domain (no magic strings). */
export const CERTIFICATE_RELATIONSHIP_TYPES = {
  /** certificate_type → authority */
  ISSUED_BY: 'ISSUED_BY',
  /** certificate_type → country */
  REQUIRED_IN: 'REQUIRED_IN',
  /** certificate_type → hs_code */
  APPLIES_TO_HS: 'APPLIES_TO_HS',
  /** certificate_type → product */
  APPLIES_TO_PRODUCT: 'APPLIES_TO_PRODUCT',
  /** certificate_type → document (template — Module 5) */
  USES_DOCUMENT_TEMPLATE: 'USES_DOCUMENT_TEMPLATE',
  /** certificate_type → workflow (issuance/verification — Module 6) */
  VERIFIED_BY_WORKFLOW: 'VERIFIED_BY_WORKFLOW',
  /** certificate_type → rule (Rule Engine) */
  ENFORCED_BY_RULE: 'ENFORCED_BY_RULE',
  /** certificate → certificate_type */
  INSTANCE_OF: 'INSTANCE_OF',
  /** certificate → certificate (renewal supersedes the prior instance) */
  SUPERSEDES: 'SUPERSEDES',
} as const;

export type CertificateRelationshipType =
  (typeof CERTIFICATE_RELATIONSHIP_TYPES)[keyof typeof CERTIFICATE_RELATIONSHIP_TYPES];

const digitalSignatureSchema = z.object({
  standard: z.string().optional(), // eIDAS | PKI | X.509 | PAdES | XAdES
  required: z.boolean().optional(),
  trustList: z.string().optional(),
  signatureValue: z.string().optional(), // instance-level (metadata only)
  signedAt: z.string().optional(),
  signerId: z.string().optional(),
  certificateChainRef: z.string().optional(),
});

const qrVerificationSchema = z.object({
  supported: z.boolean().optional(),
  urlTemplate: z.string().optional(), // type-level: e.g. https://verify.gov/{serial}
  algorithm: z.string().optional(),
  payload: z.string().optional(), // instance-level token (metadata only)
  verificationUrl: z.string().optional(),
  hash: z.string().optional(),
});

const certificateTypeSchema = z.object({
  category: z.string().optional(), // ORIGIN | HEALTH | QUALITY | CONFORMITY | INSPECTION | INSURANCE | …
  issuingAuthorityKey: z.string().optional(),
  mandatory: z.boolean().optional(),
  legalBasis: z.string().optional(),
  defaultValidityMonths: z.number().int().positive().optional(),
  renewable: z.boolean().optional(),
  renewalLeadDays: z.number().int().nonnegative().optional(),
  requiresInspection: z.boolean().optional(),
  digitalSignature: digitalSignatureSchema.optional(),
  qrVerification: qrVerificationSchema.optional(),
  appliesToHsCodes: z.array(z.string()).optional(),
  appliesToCountries: z.array(z.string()).optional(),
  appliesToProductCategories: z.array(z.string()).optional(),
  documentTemplateKey: z.string().optional(), // → document engine (Module 5)
  workflowTemplateKey: z.string().optional(), // → workflow engine (Module 6)
  ruleKey: z.string().optional(), // → rule engine
});

const certificateSchema = z.object({
  certificateTypeKey: z.string().min(1), // → certificate_type
  serialNumber: z.string().optional(),
  holderOrganizationKey: z.string().optional(),
  issuingAuthorityKey: z.string().optional(),
  issuedAt: z.string().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  // Domain status, distinct from the record lifecycle status.
  certificateStatus: z.string().optional(), // VALID | EXPIRED | REVOKED | SUSPENDED
  scope: z
    .object({
      hsCodes: z.array(z.string()).optional(),
      productKeys: z.array(z.string()).optional(),
      countryCodes: z.array(z.string()).optional(),
    })
    .optional(),
  digitalSignature: digitalSignatureSchema.optional(),
  qr: qrVerificationSchema.optional(),
  renewal: z
    .object({
      renews: z.boolean().optional(),
      supersedesCertificateKey: z.string().optional(),
      renewalDueAt: z.string().optional(),
    })
    .optional(),
});

function codeOrSlugKey(i: KbWriteInput): string {
  return String(i.code ?? slug(i.name)).toUpperCase();
}

function certificateInstanceKey(i: KbWriteInput): string {
  const serial = i.attributes?.serialNumber ?? i.code;
  return serial ? String(serial).trim() : slug(i.name);
}

const certificateTypeRelationshipTypes: RelationshipTypeDescriptor[] = [
  { relationType: CERTIFICATE_RELATIONSHIP_TYPES.ISSUED_BY, label: 'Issued by', toType: 'authority' },
  { relationType: CERTIFICATE_RELATIONSHIP_TYPES.REQUIRED_IN, label: 'Required in', toType: 'country' },
  { relationType: CERTIFICATE_RELATIONSHIP_TYPES.APPLIES_TO_HS, label: 'Applies to HS code', toType: 'hs_code' },
  { relationType: CERTIFICATE_RELATIONSHIP_TYPES.APPLIES_TO_PRODUCT, label: 'Applies to product', toType: 'product' },
  { relationType: CERTIFICATE_RELATIONSHIP_TYPES.USES_DOCUMENT_TEMPLATE, label: 'Uses document template', toType: 'document' },
  { relationType: CERTIFICATE_RELATIONSHIP_TYPES.VERIFIED_BY_WORKFLOW, label: 'Verified by workflow', toType: 'workflow' },
  { relationType: CERTIFICATE_RELATIONSHIP_TYPES.ENFORCED_BY_RULE, label: 'Enforced by rule', toType: 'rule' },
];

export const certificateEntities: KbEntityDefinition[] = [
  simpleEntity({
    entityType: 'certificate_type',
    label: 'Certificate Type',
    description: 'A catalogued kind of trade certificate (authority, validity/renewal policy, signature + QR scheme, product/country scope, document/workflow/rule references).',
    domain: 'certificate',
    countryScoped: false,
    schema: certificateTypeSchema,
    recordKey: codeOrSlugKey,
    events: { created: 'CERTIFICATE_TYPE_CREATED', updated: 'CERTIFICATE_TYPE_UPDATED', archived: 'CERTIFICATE_TYPE_ARCHIVED' },
    relationshipTypes: certificateTypeRelationshipTypes,
    formFields: [
      { name: 'name', label: 'Certificate name', type: 'string', placement: 'top', required: true },
      { name: 'code', label: 'Code', type: 'string', placement: 'top' },
      { name: 'tags', label: 'Tags', type: 'string[]', placement: 'top' },
      { name: 'category', label: 'Category', type: 'string', placement: 'attributes' },
      { name: 'issuingAuthorityKey', label: 'Issuing authority', type: 'string', placement: 'attributes' },
      { name: 'mandatory', label: 'Mandatory', type: 'boolean', placement: 'attributes' },
      { name: 'defaultValidityMonths', label: 'Default validity (months)', type: 'number', placement: 'attributes' },
      { name: 'renewable', label: 'Renewable', type: 'boolean', placement: 'attributes' },
      { name: 'renewalLeadDays', label: 'Renewal lead (days)', type: 'number', placement: 'attributes' },
      { name: 'digitalSignature', label: 'Digital signature scheme', type: 'json', placement: 'attributes' },
      { name: 'qrVerification', label: 'QR verification scheme', type: 'json', placement: 'attributes' },
      { name: 'appliesToHsCodes', label: 'Applies to HS codes', type: 'string[]', placement: 'attributes' },
      { name: 'appliesToCountries', label: 'Applies to countries', type: 'string[]', placement: 'attributes' },
      { name: 'documentTemplateKey', label: 'Document template', type: 'string', placement: 'attributes' },
      { name: 'workflowTemplateKey', label: 'Workflow template', type: 'string', placement: 'attributes' },
    ],
  }),
  simpleEntity({
    entityType: 'certificate',
    label: 'Certificate (issued)',
    description: 'An issued certificate instance — serial, holder, validity window, signature + QR payload (metadata), and renewal chain.',
    domain: 'certificate',
    countryScoped: false,
    schema: certificateSchema,
    recordKey: certificateInstanceKey,
    events: { created: 'CERTIFICATE_ISSUED', updated: 'CERTIFICATE_UPDATED', archived: 'CERTIFICATE_ARCHIVED' },
    relationshipTypes: [
      { relationType: CERTIFICATE_RELATIONSHIP_TYPES.INSTANCE_OF, label: 'Instance of', toType: 'certificate_type' },
      { relationType: CERTIFICATE_RELATIONSHIP_TYPES.ISSUED_BY, label: 'Issued by', toType: 'authority' },
      { relationType: CERTIFICATE_RELATIONSHIP_TYPES.SUPERSEDES, label: 'Supersedes (renewal)', toType: 'certificate' },
    ],
    formFields: [
      { name: 'name', label: 'Certificate label', type: 'string', placement: 'top', required: true },
      { name: 'code', label: 'Serial / code', type: 'string', placement: 'top' },
      { name: 'certificateTypeKey', label: 'Certificate type', type: 'string', placement: 'attributes', required: true },
      { name: 'serialNumber', label: 'Serial number', type: 'string', placement: 'attributes' },
      { name: 'holderOrganizationKey', label: 'Holder organization', type: 'string', placement: 'attributes' },
      { name: 'issuingAuthorityKey', label: 'Issuing authority', type: 'string', placement: 'attributes' },
      { name: 'validFrom', label: 'Valid from', type: 'date', placement: 'attributes' },
      { name: 'validTo', label: 'Valid to', type: 'date', placement: 'attributes' },
      { name: 'certificateStatus', label: 'Status', type: 'enum', placement: 'attributes', options: ['VALID', 'EXPIRED', 'REVOKED', 'SUSPENDED'] },
      { name: 'digitalSignature', label: 'Digital signature', type: 'json', placement: 'attributes' },
      { name: 'qr', label: 'QR verification', type: 'json', placement: 'attributes' },
    ],
  }),
];
