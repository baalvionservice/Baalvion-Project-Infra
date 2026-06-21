/**
 * @file server/gckb/policy-forms.ts
 * @description Declarative Admin-form + grouping metadata for every country-policy
 * type. The zod schema in `policy-types.ts` is the source of truth for *validation*;
 * this file is the source of truth for *presentation* — which `attributes` fields
 * the registry-driven Admin UI renders for a given `policyType`, and which group
 * (tax / tariff / license / certificate / …) the public explorers bucket it under.
 *
 * Keeping presentation metadata next to (but separate from) the validation schema
 * mirrors the product registry, which colocates `productSchema` with
 * `productFormFields`. Adding a policy type is still one entry in `policy-types.ts`
 * plus one entry here — no new table, migration, service or route.
 */
import { FormFieldDescriptor } from './entity-kit';
import { POLICY_TYPE_KEYS } from './policy-types';

/** Coarse buckets used by the Admin catalog and the public explorers. */
export type PolicyGroup =
  | 'trade_policy'
  | 'tax'
  | 'tariff'
  | 'license'
  | 'certificate'
  | 'restriction'
  | 'standards'
  | 'documents'
  | 'integration'
  | 'compliance'
  | 'risk'
  | 'sanctions';

export interface PolicyFormDefinition {
  group: PolicyGroup;
  /** `attributes`-placed fields the Admin UI renders for this policy type. */
  formFields: FormFieldDescriptor[];
}

/** Fields shared by most policy types that scope to HS codes / product categories. */
const hsScopeFields: FormFieldDescriptor[] = [
  { name: 'hsCodes', label: 'HS codes', type: 'string[]', placement: 'attributes', description: 'Tariff lines this policy applies to.' },
  { name: 'productCategories', label: 'Product categories', type: 'string[]', placement: 'attributes' },
];

export const POLICY_FORMS: Record<string, PolicyFormDefinition> = {
  import_policy: {
    group: 'trade_policy',
    formFields: [
      { name: 'summary', label: 'Summary', type: 'text', placement: 'attributes', required: true },
      { name: 'requiresImportLicense', label: 'Requires import license', type: 'boolean', placement: 'attributes' },
      { name: 'allowedIncoterms', label: 'Allowed Incoterms', type: 'string[]', placement: 'attributes' },
      { name: 'conditions', label: 'Conditions', type: 'string[]', placement: 'attributes' },
      { name: 'restrictions', label: 'Restrictions', type: 'string[]', placement: 'attributes' },
      ...hsScopeFields,
    ],
  },
  export_policy: {
    group: 'trade_policy',
    formFields: [
      { name: 'summary', label: 'Summary', type: 'text', placement: 'attributes', required: true },
      { name: 'requiresExportLicense', label: 'Requires export license', type: 'boolean', placement: 'attributes' },
      { name: 'controlledTechnology', label: 'Controlled technology', type: 'boolean', placement: 'attributes' },
      { name: 'conditions', label: 'Conditions', type: 'string[]', placement: 'attributes' },
      { name: 'restrictions', label: 'Restrictions', type: 'string[]', placement: 'attributes' },
      ...hsScopeFields,
    ],
  },
  tax: {
    group: 'tax',
    formFields: [
      { name: 'taxName', label: 'Tax name', type: 'string', placement: 'attributes', required: true },
      { name: 'taxType', label: 'Tax type', type: 'enum', placement: 'attributes', required: true, options: ['VAT', 'GST', 'SALES', 'EXCISE', 'INCOME', 'SERVICE', 'OTHER'] },
      { name: 'ratePercent', label: 'Rate (%)', type: 'number', placement: 'attributes', required: true },
      { name: 'basis', label: 'Basis', type: 'enum', placement: 'attributes', options: ['CIF', 'FOB', 'TRANSACTION_VALUE', 'ASSESSABLE_VALUE'] },
      { name: 'exemptions', label: 'Exemptions', type: 'string[]', placement: 'attributes' },
      ...hsScopeFields,
    ],
  },
  tariff: {
    group: 'tariff',
    formFields: [
      { name: 'schedule', label: 'Schedule', type: 'string', placement: 'attributes', description: 'e.g. MFN, the national tariff schedule.' },
      { name: 'ratePercent', label: 'Ad valorem rate (%)', type: 'number', placement: 'attributes' },
      { name: 'specificRate', label: 'Specific rate', type: 'json', placement: 'attributes', description: '{ amount, currency } per unit.' },
      { name: 'unit', label: 'Unit', type: 'string', placement: 'attributes', description: 'e.g. per kg, per litre.' },
      { name: 'preferentialUnder', label: 'Preferential under (FTA code)', type: 'string', placement: 'attributes' },
      ...hsScopeFields,
    ],
  },
  duty: {
    group: 'tariff',
    formFields: [
      { name: 'dutyType', label: 'Duty type', type: 'enum', placement: 'attributes', required: true, options: ['CUSTOMS', 'ANTI_DUMPING', 'COUNTERVAILING', 'SAFEGUARD', 'EXCISE', 'SOCIAL_WELFARE_SURCHARGE'] },
      { name: 'ratePercent', label: 'Rate (%)', type: 'number', placement: 'attributes' },
      { name: 'flat', label: 'Flat amount', type: 'json', placement: 'attributes', description: '{ amount, currency }.' },
      ...hsScopeFields,
    ],
  },
  certificate: {
    group: 'certificate',
    formFields: [
      { name: 'certificateName', label: 'Certificate name', type: 'string', placement: 'attributes', required: true },
      { name: 'issuingBody', label: 'Issuing body', type: 'string', placement: 'attributes' },
      { name: 'mandatory', label: 'Mandatory', type: 'boolean', placement: 'attributes' },
      { name: 'validityMonths', label: 'Validity (months)', type: 'number', placement: 'attributes' },
      ...hsScopeFields,
    ],
  },
  license: {
    group: 'license',
    formFields: [
      { name: 'licenseName', label: 'License name', type: 'string', placement: 'attributes', required: true },
      { name: 'issuingAuthority', label: 'Issuing authority', type: 'string', placement: 'attributes' },
      { name: 'appliesTo', label: 'Applies to', type: 'enum', placement: 'attributes', options: ['IMPORT', 'EXPORT', 'BOTH'] },
      { name: 'validityMonths', label: 'Validity (months)', type: 'number', placement: 'attributes' },
      ...hsScopeFields,
    ],
  },
  restricted_goods: {
    group: 'restriction',
    formFields: [
      { name: 'description', label: 'Description', type: 'text', placement: 'attributes', required: true },
      { name: 'conditions', label: 'Conditions', type: 'string[]', placement: 'attributes' },
      { name: 'requiresPermit', label: 'Requires permit', type: 'boolean', placement: 'attributes' },
      ...hsScopeFields,
    ],
  },
  prohibited_goods: {
    group: 'restriction',
    formFields: [
      { name: 'description', label: 'Description', type: 'text', placement: 'attributes', required: true },
      { name: 'legalBasis', label: 'Legal basis', type: 'string', placement: 'attributes' },
      ...hsScopeFields,
    ],
  },
  inspection_rule: {
    group: 'standards',
    formFields: [
      { name: 'inspectionType', label: 'Inspection type', type: 'enum', placement: 'attributes', required: true, options: ['PRE_SHIPMENT', 'ON_ARRIVAL', 'RANDOM', 'DESTINATION'] },
      { name: 'authority', label: 'Authority', type: 'string', placement: 'attributes' },
      { name: 'samplingPercent', label: 'Sampling (%)', type: 'number', placement: 'attributes' },
      ...hsScopeFields,
    ],
  },
  packaging_rule: {
    group: 'standards',
    formFields: [
      { name: 'requirement', label: 'Requirement', type: 'text', placement: 'attributes', required: true },
      { name: 'materials', label: 'Materials', type: 'string[]', placement: 'attributes' },
      { name: 'standards', label: 'Standards', type: 'string[]', placement: 'attributes' },
      ...hsScopeFields,
    ],
  },
  labeling_rule: {
    group: 'standards',
    formFields: [
      { name: 'requirement', label: 'Requirement', type: 'text', placement: 'attributes', required: true },
      { name: 'languages', label: 'Languages', type: 'string[]', placement: 'attributes' },
      { name: 'mandatoryFields', label: 'Mandatory fields', type: 'string[]', placement: 'attributes' },
      ...hsScopeFields,
    ],
  },
  document_requirement: {
    group: 'documents',
    formFields: [
      { name: 'documentType', label: 'Document type', type: 'string', placement: 'attributes', required: true, description: 'e.g. COMMERCIAL_INVOICE, PACKING_LIST, COO.' },
      { name: 'mandatory', label: 'Mandatory', type: 'boolean', placement: 'attributes' },
      { name: 'copies', label: 'Copies', type: 'number', placement: 'attributes' },
      { name: 'issuedBy', label: 'Issued by', type: 'string', placement: 'attributes' },
      ...hsScopeFields,
    ],
  },
  government_form: {
    group: 'documents',
    formFields: [
      { name: 'formCode', label: 'Form code', type: 'string', placement: 'attributes', required: true },
      { name: 'formName', label: 'Form name', type: 'string', placement: 'attributes', required: true },
      { name: 'authority', label: 'Authority', type: 'string', placement: 'attributes' },
      { name: 'submission', label: 'Submission', type: 'enum', placement: 'attributes', options: ['ELECTRONIC', 'PAPER', 'BOTH'] },
      { name: 'url', label: 'URL', type: 'string', placement: 'attributes' },
    ],
  },
  digital_api: {
    group: 'integration',
    formFields: [
      { name: 'system', label: 'System', type: 'string', placement: 'attributes', required: true, description: 'e.g. single-window system name.' },
      { name: 'protocol', label: 'Protocol', type: 'enum', placement: 'attributes', options: ['REST', 'SOAP', 'EDIFACT', 'AS2', 'GraphQL'] },
      { name: 'baseUrl', label: 'Base URL', type: 'string', placement: 'attributes' },
      { name: 'authMethod', label: 'Auth method', type: 'string', placement: 'attributes' },
      { name: 'sandbox', label: 'Sandbox available', type: 'boolean', placement: 'attributes' },
      { name: 'docsUrl', label: 'Docs URL', type: 'string', placement: 'attributes' },
    ],
  },
  signature_standard: {
    group: 'integration',
    formFields: [
      { name: 'standard', label: 'Standard', type: 'string', placement: 'attributes', required: true, description: 'e.g. eIDAS, PKI, X.509.' },
      { name: 'acceptedFormats', label: 'Accepted formats', type: 'string[]', placement: 'attributes' },
      { name: 'trustList', label: 'Trust list', type: 'string', placement: 'attributes' },
      { name: 'legalBasis', label: 'Legal basis', type: 'string', placement: 'attributes' },
    ],
  },
  compliance_requirement: {
    group: 'compliance',
    formFields: [
      { name: 'requirement', label: 'Requirement', type: 'text', placement: 'attributes', required: true },
      { name: 'framework', label: 'Framework', type: 'string', placement: 'attributes' },
      { name: 'mandatory', label: 'Mandatory', type: 'boolean', placement: 'attributes' },
      ...hsScopeFields,
    ],
  },
  risk_level: {
    group: 'risk',
    formFields: [
      { name: 'level', label: 'Level', type: 'enum', placement: 'attributes', required: true, options: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
      { name: 'score', label: 'Score (0–100)', type: 'number', placement: 'attributes' },
      { name: 'rationale', label: 'Rationale', type: 'text', placement: 'attributes' },
      { name: 'dimensions', label: 'Dimensions', type: 'json', placement: 'attributes', description: 'Named risk sub-scores.' },
    ],
  },
  sanctions_metadata: {
    group: 'sanctions',
    formFields: [
      { name: 'regime', label: 'Regime', type: 'enum', placement: 'attributes', required: true, options: ['OFAC', 'EU', 'UN', 'UK_OFSI', 'OTHER'] },
      { name: 'status', label: 'Status', type: 'enum', placement: 'attributes', required: true, options: ['COMPREHENSIVE', 'SECTORAL', 'TARGETED', 'NONE'] },
      { name: 'programs', label: 'Programs', type: 'string[]', placement: 'attributes' },
      { name: 'reference', label: 'Reference', type: 'string', placement: 'attributes' },
      { name: 'effectiveNote', label: 'Effective note', type: 'text', placement: 'attributes' },
    ],
  },
};

/** Presentation metadata for a policy type, or `null` if unknown. */
export function getPolicyForm(policyType: string | null | undefined): PolicyFormDefinition | null {
  if (!policyType) return null;
  return POLICY_FORMS[policyType] ?? null;
}

/** The group a policy type belongs to (defaults to `compliance` for safety). */
export function getPolicyGroup(policyType: string): PolicyGroup {
  return POLICY_FORMS[policyType]?.group ?? 'compliance';
}

/** Every policy type listed in `policy-types.ts` must have a form definition. */
export const POLICY_FORM_KEYS = Object.keys(POLICY_FORMS);

/** Policy-type keys grouped by their presentation bucket (stable order). */
export const POLICY_GROUPS: Record<PolicyGroup, string[]> = POLICY_TYPE_KEYS.reduce(
  (acc, key) => {
    const group = getPolicyGroup(key);
    (acc[group] ??= []).push(key);
    return acc;
  },
  {} as Record<PolicyGroup, string[]>,
);
