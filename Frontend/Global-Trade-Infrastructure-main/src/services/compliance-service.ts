
/**
 * @file compliance-service.ts
 * @description Institutional Compliance Engine with tiered verification and governance-gated KYC.
 */
import { apiClient, authApi } from '@/lib/api-client';
import { toList } from '@/lib/api-list';
import { logger } from './observability-service';
import { approvalService } from './approval-service';
import { USER_ROLES } from '@/app/(dashboard)/_components/app-state';

export type KYCStatus = 'not_started' | 'pending' | 'verified' | 'rejected';
export type { RiskLevel } from '@/types/institutional';

export interface KYCApplication {
  id: string;
  institutionName: string;
  status: KYCStatus;
  riskLevel: 'low' | 'medium' | 'high';
  submittedAt: string;
  reviewedAt?: string;
  documents: string[];
}

export const complianceService = {
  /**
   * Submits institutional documentation and initializes a governance approval request.
   */
  async submitKYC(data: {
    companyId: string;
    documentType: string;
    fileName: string;
    representative?: { fullName: string; dateOfBirth: string; nationality: string; officialEmail: string };
    company?: { registrationNumber: string; incorporationDate: string; hqAddress: string; taxResidency: string };
    documentIds?: { governmentId: string | null; businessLicense: string | null };
  }): Promise<void> {
    logger.info('ComplianceService', `Initializing KYC audit for ${data.companyId}`);

    // 1. Record the verification attempt
    const res = await apiClient.post<any>('/verification_requests', {
      ...data,
      status: 'pending',
      uploadedAt: new Date().toISOString()
    });

    const application = res.data!;

    // 2. Gate via Governance Approval Service
    await approvalService.createRequest({
      referenceType: 'kyc',
      referenceId: data.companyId,
      requestedBy: 'SYSTEM_IDENTITY',
      requiredRole: USER_ROLES.COMPLIANCE_ADMIN,
      reason: `Institutional KYC verification for node ${data.companyId}. Document: ${data.documentType}`,
      metadata: { applicationRef: application.id }
    });

    // 3. Update company record to show pending status
    await apiClient.patch(`/organizations/${data.companyId}`, { 
      verificationStatus: 'pending',
      status: 'pending' 
    });
  },

  async getKYCStatus(companyId: string): Promise<KYCStatus> {
    const res = await apiClient.get<any>(`/organizations/${companyId}`);
    return res.data?.verificationStatus || 'not_started';
  },

  /**
   * Calculates a real-time AML risk score (0-100).
   */
  async calculateRisk(companyId: string): Promise<number> {
    const companyRes = await apiClient.get<any>(`/organizations/${companyId}`);
    const company = companyRes.data;
    if (!company) return 50;

    let score = 10; // Baseline trust
    if (company.verificationStatus === 'verified') score += 50;
    if (company.sanctionsFlag) score = 100; // Critical risk
    
    return Math.min(100, score);
  }
};

/**
 * Real institutional KYC — backed by trade-service's Trust/Verification/Compliance
 * Foundation (`identity_verifications` + `company_verifications`), NOT the generic
 * `/verification_requests` document bucket the older `complianceService.submitKYC`
 * above still uses. This is the pipeline that actually gates governance access
 * (see service/verification/checklist.js) and runs real cross-tenant fraud/duplicate
 * detection on submit.
 */
export type IdTypeOption = 'passport' | 'driving_license' | 'government_id';

export interface KYCSubmission {
  representative: { fullName: string; dateOfBirth: string; nationality: string; officialEmail: string };
  company: { registrationNumber: string; incorporationDate: string; hqAddress: string; taxResidency: string };
  documentIds: { governmentId: string | null; businessLicense: string | null };
  idType: IdTypeOption;
}

/**
 * Finds the caller's trade-service organization (tenant-scoped automatically by the
 * backend's request-context hooks), or provisions one from the KYC company details if
 * this is the tenant's first submission. Returns the organization's numeric id.
 */
async function resolveOrCreateMyOrgId(company: KYCSubmission['company']): Promise<number> {
  const listRes = await apiClient.get<any[]>('/organizations', { limit: 1 });
  const existing = toList<any>(listRes)[0];
  if (existing?.id) return existing.id;

  const me = await authApi.me<{ orgType?: string; orgId?: string }>().catch(() => null);
  const orgType = me?.orgType || 'buyer';

  const createRes = await apiClient.post<any>('/organizations', {
    code: `ORG-${Date.now()}`,
    name: company.registrationNumber ? `Org ${company.registrationNumber}` : 'New Organization',
    type: orgType,
    registration_number: company.registrationNumber,
    country: company.taxResidency,
    // Platform/admin-role sessions don't get an auto-populated tenant_id server-side
    // (see organizationController.createOrg) — pass the session's own org id explicitly
    // so the record still lands in the caller's tenant rather than failing NOT NULL.
    tenant_id: me?.orgId,
  });
  if (!createRes.success || !createRes.data?.id) {
    throw new Error(createRes.error?.message || 'Could not provision organization record for KYC');
  }
  return createRes.data.id;
}

export async function submitKYC(payload: KYCSubmission): Promise<void> {
  // 1. Personal identity verification (user-level, no org needed).
  const identityRes = await apiClient.post<any>('/identity_verifications', {
    full_name: payload.representative.fullName,
    date_of_birth: payload.representative.dateOfBirth || null,
    nationality: payload.representative.nationality || null,
    id_type: payload.idType,
    id_document_id: payload.documentIds.governmentId,
  });
  if (!identityRes.success) {
    throw new Error(identityRes.error?.message || 'Identity verification submission failed');
  }

  // 2. Institutional (company) verification — resolve/provision the org, then submit.
  const orgId = await resolveOrCreateMyOrgId(payload.company);
  const companyRes = await apiClient.post<any>(`/company_verifications/${orgId}`, {
    registration_number: payload.company.registrationNumber,
    incorporation_date: payload.company.incorporationDate || null,
    // HQ address / tax residency aren't first-class columns on company_verifications yet —
    // carried in metadata rather than silently dropped.
    metadata: {
      hqAddress: payload.company.hqAddress,
      taxResidency: payload.company.taxResidency,
      businessLicenseDocumentId: payload.documentIds.businessLicense,
    },
  });
  if (!companyRes.success) {
    throw new Error(companyRes.error?.message || 'Company verification submission failed');
  }
}

export interface KYCDetail {
  status: KYCStatus;
  identityStatus: string | null;
  companyStatus: string | null;
  /** Reviewer-supplied reasons, shown to the applicant so a resubmission can address them. */
  rejectionReasons: { track: 'Identity' | 'Company'; reason: string }[];
  /** Soonest date either track falls due for re-verification (ISO), null when neither expires. */
  validUntil: string | null;
  /** True once an approved verification has passed its validity window. */
  expired: boolean;
}

/** Combined state across both real verification tracks, including reviewer feedback. */
export async function getKYCDetail(): Promise<KYCDetail> {
  const identityRes = await apiClient.get<any>('/identity_verifications/me');
  const identity = identityRes.success ? identityRes.data : null;

  let company: any = null;
  const orgsRes = await apiClient.get<any[]>('/organizations', { limit: 1 });
  const org = toList<any>(orgsRes)[0];
  if (org?.id) {
    const companyRes = await apiClient.get<any>(`/company_verifications/${org.id}`);
    company = companyRes.success ? companyRes.data : null;
  }

  const identityStatus: string | null = identity?.status ?? null;
  const companyStatus: string | null = company?.status ?? null;

  const rejectionReasons: KYCDetail['rejectionReasons'] = [];
  if (identityStatus === 'rejected' && identity?.rejection_reason) {
    rejectionReasons.push({ track: 'Identity', reason: identity.rejection_reason });
  }
  if (companyStatus === 'rejected' && company?.rejection_reason) {
    rejectionReasons.push({ track: 'Company', reason: company.rejection_reason });
  }

  // Soonest re-verification date across both tracks (identity carries expires_at,
  // company carries renewal_due_at — same concept, different column names).
  const dueDates = [identity?.expires_at, company?.renewal_due_at]
    .filter(Boolean)
    .map((d: string) => new Date(d).getTime())
    .filter((t) => Number.isFinite(t));
  const validUntil = dueDates.length ? new Date(Math.min(...dueDates)).toISOString() : null;
  const expired = identityStatus === 'expired' || companyStatus === 'expired';

  let status: KYCStatus;
  if (!identityStatus && !companyStatus) status = 'not_started';
  else if (identityStatus === 'rejected' || companyStatus === 'rejected') status = 'rejected';
  // An expired verification is no longer valid — the applicant must re-verify, so this
  // deliberately does NOT report 'verified'.
  else if (expired) status = 'not_started';
  else if (identityStatus === 'approved' && companyStatus === 'approved') status = 'verified';
  else status = 'pending';

  return { status, identityStatus, companyStatus, rejectionReasons, validUntil, expired };
}

/** Combined status across both real verification tracks. */
export async function getKYCStatus(): Promise<KYCStatus> {
  return (await getKYCDetail()).status;
}
