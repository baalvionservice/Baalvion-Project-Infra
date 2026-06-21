// Shared types + option lists for the business onboarding funnel. Values here MUST match the
// enums accepted by ir-service (validators/schemas.js BUSINESS_ENUMS).

export interface BeneficialOwner {
  name: string;
  ownershipPct?: string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
}

export interface BusinessDocument {
  documentType: string;
  title: string;
  fileUrl: string;
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
}

export interface BusinessOnboardingData {
  // Company
  legalName: string;
  tradeName: string;
  entityType: string;
  incorporationCountry: string;
  incorporationDate: string;
  registrationNumber: string;
  // Contact
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  // Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  country: string;
  // Tax & trade registrations
  iecCode: string;
  gstin: string;
  vatNumber: string;
  pan: string;
  // KYC
  authorizedSignatoryName: string;
  authorizedSignatoryEmail: string;
  authorizedSignatoryIdType: string;
  authorizedSignatoryIdNumber: string;
  beneficialOwners: BeneficialOwner[];
  // Documents
  documents: BusinessDocument[];
}

export const emptyBusinessOnboardingData: BusinessOnboardingData = {
  legalName: '',
  tradeName: '',
  entityType: 'private_limited',
  incorporationCountry: '',
  incorporationDate: '',
  registrationNumber: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  website: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  country: '',
  iecCode: '',
  gstin: '',
  vatNumber: '',
  pan: '',
  authorizedSignatoryName: '',
  authorizedSignatoryEmail: '',
  authorizedSignatoryIdType: '',
  authorizedSignatoryIdNumber: '',
  beneficialOwners: [],
  documents: [],
};

export interface Option {
  value: string;
  label: string;
}

export const ENTITY_TYPES: Option[] = [
  { value: 'private_limited', label: 'Private Limited Company' },
  { value: 'public_limited', label: 'Public Limited Company' },
  { value: 'llp', label: 'Limited Liability Partnership (LLP)' },
  { value: 'partnership', label: 'Partnership Firm' },
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'trust', label: 'Trust' },
  { value: 'society', label: 'Society' },
  { value: 'branch_office', label: 'Branch / Liaison Office' },
  { value: 'other', label: 'Other' },
];

export const ID_TYPES: Option[] = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID' },
  { value: 'driver_license', label: "Driver's License" },
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'pan', label: 'PAN' },
  { value: 'other', label: 'Other' },
];

export const DOCUMENT_TYPES: Option[] = [
  { value: 'certificate_of_incorporation', label: 'Certificate of Incorporation' },
  { value: 'gst_certificate', label: 'GST Registration Certificate' },
  { value: 'iec_certificate', label: 'IEC Certificate' },
  { value: 'vat_certificate', label: 'VAT Registration Certificate' },
  { value: 'pan_card', label: 'PAN Card' },
  { value: 'address_proof', label: 'Address Proof' },
  { value: 'board_resolution', label: 'Board Resolution' },
  { value: 'authorized_signatory_id', label: 'Authorized Signatory ID' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'other', label: 'Other Supporting Document' },
];

export const labelFor = (options: Option[], value: string): string =>
  options.find((o) => o.value === value)?.label ?? value;

// Per-file cap for inline (data: URI) document capture. Larger files should be hosted and
// passed as a link instead — keeps the onboarding payload under the service body limit.
export const MAX_DOCUMENT_BYTES = 1_000_000; // 1 MB
