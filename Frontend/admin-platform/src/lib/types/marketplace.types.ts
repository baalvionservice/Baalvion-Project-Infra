// Investment-marketplace admin types (snake_case off marketplace-service).

export type CompanyStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'suspended';
export interface MpCompany {
  id: string;
  org_id: string;
  legal_name: string;
  brand_name?: string | null;
  registration_no?: string | null;
  country?: string | null;
  industry_code?: string | null;
  stage: 'startup' | 'sme' | 'growth' | 'enterprise';
  website?: string | null;
  status: CompanyStatus;
  kyc_status: string;
  created_at: string;
}

export type InvestorStatus = 'pending' | 'submitted' | 'approved' | 'rejected';
export interface MpInvestor {
  id: string;
  org_id: string;
  type: 'angel' | 'vc' | 'family_office' | 'pe' | 'institutional' | 'corporate' | 'strategic';
  legal_name: string;
  country?: string | null;
  status: InvestorStatus;
  kyc_status: string;
  aml_status: string;
  accreditation_status: string;
  created_at: string;
}

export interface MpEscrow { id: string; amount: string | number; currency: string; status: string }
export interface MpDeal {
  id: string;
  org_id_company: string;
  org_id_investor: string;
  opportunity_id: string | null;
  status: string;
  created_at: string;
  escrow: MpEscrow[];
}

export interface MpOpportunity {
  id: string;
  title: string;
  round: string | null;
  amount_sought: string | number | null;
  pre_money_valuation: string | number | null;
  status: string;
  published_at: string | null;
  created_at: string;
  company?: { id: string; legal_name: string; brand_name?: string | null; industry_code?: string | null; stage?: string | null; country?: string | null } | null;
}

export const COMPANY_STATUSES: CompanyStatus[] = ['draft', 'submitted', 'approved', 'rejected', 'suspended'];
export const INVESTOR_STATUSES: InvestorStatus[] = ['pending', 'submitted', 'approved', 'rejected'];
export const MP_LABEL = (s?: string | null) => (s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—');
