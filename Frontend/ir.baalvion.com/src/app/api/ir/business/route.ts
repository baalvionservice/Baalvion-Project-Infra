// Same-origin BFF for business onboarding. Forwards a complete onboarding application
// (company creation + KYC + IEC/GST/VAT + documents) to ir-service (server-side, so
// IR_SERVICE_URL stays private) and returns the created application's reference.
// Public — a prospective business is not yet authenticated.
const IR_SERVICE_URL = process.env.IR_SERVICE_URL || 'http://127.0.0.1:3008';

export const dynamic = 'force-dynamic';

// Keep the inbound JSON modest: inline document data: URIs are capped client-side, but the
// backend body limit is 2mb — reject oversized payloads here with a clear message.
const MAX_PAYLOAD_BYTES = 1_800_000;

interface BeneficialOwnerInput {
  name?: string;
  ownershipPct?: number | string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
}

interface DocumentInput {
  documentType?: string;
  title?: string;
  fileUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
}

interface BusinessOnboardingPayload {
  legalName?: string;
  tradeName?: string;
  entityType?: string;
  incorporationCountry?: string;
  incorporationDate?: string;
  registrationNumber?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateRegion?: string;
  postalCode?: string;
  country?: string;
  iecCode?: string;
  gstin?: string;
  vatNumber?: string;
  pan?: string;
  authorizedSignatoryName?: string;
  authorizedSignatoryEmail?: string;
  authorizedSignatoryIdType?: string;
  authorizedSignatoryIdNumber?: string;
  beneficialOwners?: BeneficialOwnerInput[];
  documents?: DocumentInput[];
}

const clean = (v: unknown): string | undefined => {
  const s = typeof v === 'string' ? v.trim() : v == null ? '' : String(v);
  return s === '' ? undefined : s;
};

const mapOwner = (o: BeneficialOwnerInput) => ({
  name: clean(o.name),
  ownership_pct: o.ownershipPct === undefined || o.ownershipPct === '' ? undefined : Number(o.ownershipPct),
  nationality: clean(o.nationality),
  id_type: clean(o.idType),
  id_number: clean(o.idNumber),
});

const mapDocument = (d: DocumentInput) => ({
  document_type: clean(d.documentType),
  title: clean(d.title),
  file_url: clean(d.fileUrl),
  file_name: clean(d.fileName),
  file_size_bytes: typeof d.fileSizeBytes === 'number' ? d.fileSizeBytes : undefined,
  mime_type: clean(d.mimeType),
});

export async function POST(req: Request) {
  let body: BusinessOnboardingPayload = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  if (!clean(body.legalName) || !clean(body.contactEmail) || !clean(body.contactName)) {
    return Response.json(
      { success: false, error: 'Company legal name and a contact name and email are required.' },
      { status: 400 },
    );
  }
  if (!clean(body.iecCode) && !clean(body.gstin) && !clean(body.vatNumber)) {
    return Response.json(
      { success: false, error: 'Provide at least one trade/tax registration (IEC, GSTIN or VAT).' },
      { status: 400 },
    );
  }

  const owners = Array.isArray(body.beneficialOwners)
    ? body.beneficialOwners.map(mapOwner).filter((o) => o.name)
    : [];
  const documents = Array.isArray(body.documents)
    ? body.documents.map(mapDocument).filter((d) => d.document_type && d.title && d.file_url)
    : [];

  const payload = {
    legal_name: clean(body.legalName),
    trade_name: clean(body.tradeName),
    entity_type: clean(body.entityType),
    incorporation_country: clean(body.incorporationCountry),
    incorporation_date: clean(body.incorporationDate),
    registration_number: clean(body.registrationNumber),
    contact_name: clean(body.contactName),
    contact_email: clean(body.contactEmail),
    contact_phone: clean(body.contactPhone),
    website: clean(body.website),
    address_line1: clean(body.addressLine1),
    address_line2: clean(body.addressLine2),
    city: clean(body.city),
    state_region: clean(body.stateRegion),
    postal_code: clean(body.postalCode),
    country: clean(body.country),
    iec_code: clean(body.iecCode),
    gstin: clean(body.gstin),
    vat_number: clean(body.vatNumber),
    pan: clean(body.pan),
    authorized_signatory_name: clean(body.authorizedSignatoryName),
    authorized_signatory_email: clean(body.authorizedSignatoryEmail),
    authorized_signatory_id_type: clean(body.authorizedSignatoryIdType),
    authorized_signatory_id_number: clean(body.authorizedSignatoryIdNumber),
    beneficial_owners: owners,
    documents,
  };

  const serialized = JSON.stringify(payload);
  if (serialized.length > MAX_PAYLOAD_BYTES) {
    return Response.json(
      {
        success: false,
        error: 'Your uploaded documents are too large. Please use smaller files (under 1 MB each) or provide document links instead.',
      },
      { status: 413 },
    );
  }

  try {
    const res = await fetch(`${IR_SERVICE_URL}/api/v1/business-applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: serialized,
      cache: 'no-store',
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return Response.json(
        { success: false, error: json?.error?.message || 'Could not submit your onboarding application.' },
        { status: res.status || 502 },
      );
    }
    return Response.json({
      success: true,
      id: json.data?.id,
      reference: json.data?.reference,
      status: json.data?.status,
      kycStatus: json.data?.kyc_status,
      documentsCount: json.data?.documents_count,
    });
  } catch {
    return Response.json(
      { success: false, error: 'The onboarding service is temporarily unavailable. Please try again shortly.' },
      { status: 502 },
    );
  }
}
