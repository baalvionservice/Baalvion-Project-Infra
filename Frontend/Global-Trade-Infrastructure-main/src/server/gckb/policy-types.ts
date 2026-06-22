/**
 * @file server/gckb/policy-types.ts
 * @description The catalog of country-policy types — the long tail of the GCKB
 * (import/export policy, tax, tariff, duty, certificate, license, restricted /
 * prohibited goods, inspection / packaging / labeling rules, document
 * requirements, government forms, digital APIs, signature standards, compliance
 * requirements, risk levels, sanctions metadata).
 *
 * Each type is DATA: a label + a zod schema for its `attributes` + an optional
 * domain event name. Adding a new policy type is one entry here — no new table,
 * migration, service or route. This is the "configuration over code" core for
 * every policy module the platform supports.
 */
import { z } from 'zod';

const money = z.object({ amount: z.number(), currency: z.string().length(3) });
const hsScope = z.object({
  hsCodes: z.array(z.string()).optional(),
  productCategories: z.array(z.string()).optional(),
});

export interface PolicyTypeDefinition {
  key: string;
  label: string;
  schema: z.ZodTypeAny;
  /** Optional extra domain event emitted on create (in addition to POLICY_CREATED). */
  createdEvent?: string;
}

/** All supported policy types, keyed by `policyType`. Order is presentation order. */
export const POLICY_TYPES: Record<string, PolicyTypeDefinition> = {
  import_policy: {
    key: 'import_policy',
    label: 'Import Policy',
    schema: z.object({
      summary: z.string().min(1),
      requiresImportLicense: z.boolean().optional(),
      allowedIncoterms: z.array(z.string()).optional(),
      conditions: z.array(z.string()).optional(),
      restrictions: z.array(z.string()).optional(),
      ...hsScope.shape,
    }),
  },
  export_policy: {
    key: 'export_policy',
    label: 'Export Policy',
    schema: z.object({
      summary: z.string().min(1),
      requiresExportLicense: z.boolean().optional(),
      controlledTechnology: z.boolean().optional(),
      conditions: z.array(z.string()).optional(),
      restrictions: z.array(z.string()).optional(),
      ...hsScope.shape,
    }),
  },
  tax: {
    key: 'tax',
    label: 'Tax',
    schema: z.object({
      taxName: z.string().min(1),
      taxType: z.string().min(1), // VAT | GST | SALES | EXCISE | …
      ratePercent: z.number().min(0),
      basis: z.string().optional(), // CIF | FOB | TRANSACTION_VALUE
      exemptions: z.array(z.string()).optional(),
      ...hsScope.shape,
    }),
  },
  tariff: {
    key: 'tariff',
    label: 'Tariff',
    schema: z.object({
      schedule: z.string().optional(),
      ratePercent: z.number().min(0).optional(),
      specificRate: money.partial().optional(),
      unit: z.string().optional(),
      preferentialUnder: z.string().optional(), // FTA code
      ...hsScope.shape,
    }),
  },
  duty: {
    key: 'duty',
    label: 'Duty',
    schema: z.object({
      dutyType: z.string().min(1), // CUSTOMS | ANTI_DUMPING | COUNTERVAILING | …
      ratePercent: z.number().min(0).optional(),
      flat: money.optional(),
      ...hsScope.shape,
    }),
  },
  certificate: {
    key: 'certificate',
    label: 'Certificate',
    createdEvent: 'CERTIFICATE_ADDED',
    schema: z.object({
      certificateName: z.string().min(1),
      issuingBody: z.string().optional(),
      mandatory: z.boolean().optional(),
      validityMonths: z.number().int().positive().optional(),
      ...hsScope.shape,
    }),
  },
  license: {
    key: 'license',
    label: 'License',
    schema: z.object({
      licenseName: z.string().min(1),
      issuingAuthority: z.string().optional(),
      appliesTo: z.string().optional(), // IMPORT | EXPORT | BOTH
      validityMonths: z.number().int().positive().optional(),
      ...hsScope.shape,
    }),
  },
  restricted_goods: {
    key: 'restricted_goods',
    label: 'Restricted Goods',
    schema: z.object({
      description: z.string().min(1),
      conditions: z.array(z.string()).optional(),
      requiresPermit: z.boolean().optional(),
      ...hsScope.shape,
    }),
  },
  prohibited_goods: {
    key: 'prohibited_goods',
    label: 'Prohibited Goods',
    schema: z.object({
      description: z.string().min(1),
      legalBasis: z.string().optional(),
      ...hsScope.shape,
    }),
  },
  inspection_rule: {
    key: 'inspection_rule',
    label: 'Inspection Rule',
    schema: z.object({
      inspectionType: z.string().min(1), // PRE_SHIPMENT | ON_ARRIVAL | RANDOM
      authority: z.string().optional(),
      samplingPercent: z.number().min(0).max(100).optional(),
      ...hsScope.shape,
    }),
  },
  packaging_rule: {
    key: 'packaging_rule',
    label: 'Packaging Rule',
    schema: z.object({
      requirement: z.string().min(1),
      materials: z.array(z.string()).optional(),
      standards: z.array(z.string()).optional(),
      ...hsScope.shape,
    }),
  },
  labeling_rule: {
    key: 'labeling_rule',
    label: 'Labeling Rule',
    schema: z.object({
      requirement: z.string().min(1),
      languages: z.array(z.string()).optional(),
      mandatoryFields: z.array(z.string()).optional(),
      ...hsScope.shape,
    }),
  },
  document_requirement: {
    key: 'document_requirement',
    label: 'Document Requirement',
    schema: z.object({
      documentType: z.string().min(1), // COMMERCIAL_INVOICE | PACKING_LIST | COO | …
      mandatory: z.boolean().optional(),
      copies: z.number().int().positive().optional(),
      issuedBy: z.string().optional(),
      ...hsScope.shape,
    }),
  },
  government_form: {
    key: 'government_form',
    label: 'Government Form',
    schema: z.object({
      formCode: z.string().min(1),
      formName: z.string().min(1),
      authority: z.string().optional(),
      submission: z.string().optional(), // ELECTRONIC | PAPER | BOTH
      url: z.string().url().optional(),
    }),
  },
  digital_api: {
    key: 'digital_api',
    label: 'Digital API (gov integration endpoint metadata)',
    schema: z.object({
      system: z.string().min(1), // e.g. single-window system name
      protocol: z.string().optional(), // REST | SOAP | EDIFACT | AS2
      baseUrl: z.string().optional(),
      authMethod: z.string().optional(),
      sandbox: z.boolean().optional(),
      // Endpoint metadata only — no integration is implemented (spec).
      docsUrl: z.string().url().optional(),
    }),
  },
  signature_standard: {
    key: 'signature_standard',
    label: 'Digital Signature Standard',
    schema: z.object({
      standard: z.string().min(1), // eIDAS | PKI | X.509 | …
      acceptedFormats: z.array(z.string()).optional(),
      trustList: z.string().optional(),
      legalBasis: z.string().optional(),
    }),
  },
  compliance_requirement: {
    key: 'compliance_requirement',
    label: 'Compliance Requirement',
    schema: z.object({
      requirement: z.string().min(1),
      framework: z.string().optional(),
      mandatory: z.boolean().optional(),
      ...hsScope.shape,
    }),
  },
  risk_level: {
    key: 'risk_level',
    label: 'Risk Level',
    schema: z.object({
      level: z.string().min(1), // LOW | MEDIUM | HIGH | CRITICAL
      score: z.number().min(0).max(100).optional(),
      rationale: z.string().optional(),
      dimensions: z.record(z.string(), z.number()).optional(),
    }),
  },
  sanctions_metadata: {
    key: 'sanctions_metadata',
    label: 'Sanctions Metadata',
    schema: z.object({
      regime: z.string().min(1), // OFAC | EU | UN | UK_OFSI | …
      status: z.string().min(1), // COMPREHENSIVE | SECTORAL | TARGETED | NONE
      programs: z.array(z.string()).optional(),
      reference: z.string().optional(),
      effectiveNote: z.string().optional(),
    }),
  },
};

export const POLICY_TYPE_KEYS = Object.keys(POLICY_TYPES);

export function getPolicyType(policyType: string | null | undefined): PolicyTypeDefinition | null {
  if (!policyType) return null;
  return POLICY_TYPES[policyType] ?? null;
}
