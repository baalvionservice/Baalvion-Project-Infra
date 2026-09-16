/**
 * @file src/services/insurance-service.ts
 * @description Cargo insurance: policies (quote → bind), claims (file → evidence →
 * adjudicate → pay → recover), and General Average.
 *
 * This file used to call `/policies` and `/claims`, which are not routes — they fell
 * through trade-service's trailing `/:collection` catch-all into a generic document
 * bucket that answered 200 with an empty list and accepted any shape. Nothing the UI
 * created was ever a policy: no premium engine, no bind, no payment, no state machine,
 * no coverage check. The real resources are `/insurance_policies` and
 * `/insurance_claims`; the catch-all now rejects the old paths by name so this cannot
 * silently regress.
 */
import { apiClient } from '@/lib/api-client';
import { toList } from '@/lib/api-list';

export type InsuranceType = 'cargo' | 'liability' | 'credit' | 'parametric';
export type PolicyStatus = 'pending' | 'quoted' | 'active' | 'claimed' | 'expired' | 'cancelled';
export type ClaimStatus =
  | 'filed' | 'evidence_required' | 'under_review' | 'approved' | 'rejected' | 'paid' | 'withdrawn';
export type LossType =
  | 'total_loss' | 'partial_loss' | 'damage' | 'theft' | 'delay'
  | 'general_average' | 'non_delivery' | 'contamination';
export type SubrogationStatus =
  | 'none' | 'pending' | 'recovered' | 'partially_recovered' | 'waived' | 'time_barred' | 'failed';
export type EvidenceRole =
  | 'bill_of_lading' | 'commercial_invoice' | 'packing_list' | 'survey_report'
  | 'photo_evidence' | 'police_report' | 'carrier_claim_letter' | 'non_delivery_certificate'
  | 'delivery_receipt' | 'weather_report' | 'repair_estimate' | 'general_average_bond'
  | 'insurance_certificate' | 'other';

/**
 * Where a premium's risk multiplier came from.
 *
 *   credibility_weighted  the lane's own experience, blended with the book by how
 *                         much that lane's sample is actually worth (`credibility`)
 *   book_average          nothing on this lane yet — priced on the whole book
 *   base_rate             the platform has no history at all
 *
 * `credibility` is the weight the lane's own record carried, 0–1. Surfacing it is
 * the difference between a price you can explain and a number that looks measured
 * but is standing on three voyages.
 */
export interface RiskAssessment {
  multiplier: number;
  basis: 'credibility_weighted' | 'book_average' | 'base_rate';
  scope: 'port_pair' | 'country_pair' | null;
  sampleSize: number;
  observedIncidents: number;
  bookSampleSize: number;
  bookIncidents: number;
  credibility: number;
  laneFrequency: number | null;
  bookFrequency: number | null;
  blendedFrequency: number | null;
  factors: { name: string; factor: number; detail: string }[];
  lookbackMonths: number;
  halfCredibilitySample: number;
}

/** What the caller may currently commit to, and what is stopping them. */
export interface VerificationGate {
  level: 'none' | 'identity' | 'business' | 'full';
  required: 'none' | 'identity' | 'business' | 'full';
  identity: boolean;
  business: boolean;
  badge: boolean;
  enforced: boolean;
  canCommit: boolean;
  reasons: string[];
}

export interface QuoteResult {
  insuranceType: InsuranceType;
  coverageAmount: number;
  premiumRate: number;
  riskMultiplier: number;
  premium: number;
  deductible: number;
  currency: string;
  risk: RiskAssessment;
  shipment: {
    id: string; shipmentNo: string; mode: string;
    originPort?: string; destinationPort?: string;
    originCountry?: string; destinationCountry?: string;
    estimatedDeparture?: string; estimatedArrival?: string;
    declaredValue: number; currency: string; transitDays: number;
  } | null;
}

/** A named party on a policy (assured / beneficiary), as stored by trade-service. */
export interface PolicyParty {
  name?: string;
  [key: string]: unknown;
}

export type PlacementStatus = 'unplaced' | 'referred' | 'placed' | 'declined' | 'platform_retained';
export type AdviceBasis = 'non_advised' | 'advised' | 'execution_only';

/**
 * The disclosure the assured accepts before cover is bound, and the broker's defence
 * if the cover is later said to have been unsuitable. Versioned, because what was
 * shown at the time is the only thing that matters in an E&O claim — so the version
 * accepted is recorded on the policy, not just the fact of acceptance.
 */
export const DISCLOSURE_VERSION = 'v1';

export const DISCLOSURE_POINTS = [
  'This cover is offered on a non-advised basis. No recommendation is made that it is suitable for your goods, your contract of sale, or your obligations under it.',
  'You are responsible for the sum insured being adequate. Marine cargo is usually insured at invoice value plus freight plus 10% — under-insuring reduces every claim proportionately.',
  'Cover is subject to the policy wording and the underwriter\u2019s exclusions, which may include specific territories, commodities and war or strikes risks.',
  'The carrier\u2019s own liability is limited by package or weight under the Hague-Visby Rules and is not a substitute for this cover.',
  'Claims must be notified promptly and the carrier put on notice within their time bar, or the right of recovery is lost.',
];

export interface BrokerIndemnityPosition {
  covered: boolean;
  reason: string | null;
  insurer?: string;
  policyNumber?: string;
  limit: number | null;
  retention?: number;
  basis?: string;
  expiresAt?: string;
}
export type UnderwriterStatus = 'prospective' | 'bound' | 'suspended' | 'expired' | 'terminated';

/**
 * A carrier and the binding authority the platform holds on it.
 *
 * `capacityLimit` / `perRiskLimit` are not advisory — exceeding either breaches the
 * binder, so the server refuses to place over them and marks the risk
 * `platform_retained` instead.
 */
export interface Underwriter {
  id: string;
  tenantId: string | null;
  name: string;
  legalEntity?: string;
  adapter: string;
  binderReference?: string;
  status: UnderwriterStatus;
  currency: string;
  capacityLimit: number | null;
  perRiskLimit: number | null;
  /** Fraction of gross premium the platform retains (0.15 = 15%). */
  commissionRate: number;
  ledgerAccountId?: string;
  binderStart?: string;
  binderEnd?: string;
  linesOfBusiness: string[];
  /** Binder scope — the exclusions that actually void cover, enforced at placement. */
  territoriesIncluded?: string[];
  territoriesExcluded?: string[];
  commoditiesExcluded?: string[];
  /** 'trust' = premium is client money held apart; 'direct' = the carrier collects it. */
  premiumHandling?: 'trust' | 'direct';
  bindable: boolean;
  bindableReason: string | null;
  capacity?: { used: number; limit: number | null; remaining: number | null; utilisation: number | null };
  policies?: {
    id: string; policyNumber: string; status: string; coverageAmount: number;
    premium: number; commissionAmount: number | null; netPremium: number | null;
    underwriterPolicyRef: string | null;
  }[];
}

export interface InsurancePolicy {
  id: string;
  shipmentId?: string;
  orderId?: string;
  policyNumber: string;
  type: InsuranceType;
  status: PolicyStatus;
  provider?: string;
  coverageAmount: number;
  currency: string;
  premium: number;
  premiumRate?: number;
  deductible: number;
  insured?: PolicyParty;
  beneficiary?: PolicyParty;
  coverageTerms?: Record<string, unknown>;
  /** Free-form server annotations; `coverPeriod` explains how the dates were derived. */
  metadata?: { coverPeriod?: string; [key: string]: unknown };
  coverageBasis?: 'voyage' | 'term' | 'open_cover';
  riskAssessment?: RiskAssessment;
  premiumPaymentRef?: string;
  /** Client money: gross premium sits in a segregated account until commission is drawn. */
  premiumHeldInTrust?: boolean;
  commissionDrawnAt?: string;
  adviceBasis?: AdviceBasis;
  disclosureAcceptedAt?: string;
  /** Why every binder refused — what makes 'platform_retained' actionable. */
  placementDeclines?: { underwriter: string; reason: string }[];
  // Placement — whose balance sheet this sits on, and how the gross premium split.
  underwriterId?: string | null;
  underwriterPolicyRef?: string | null;
  placementStatus?: PlacementStatus;
  commissionRate?: number;
  commissionAmount?: number;
  netPremium?: number;
  remittanceRef?: string;
  startDate?: string;
  endDate?: string;
  boundAt?: string;
  expiredAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Present on the detail read only. */
  remainingCoverage?: number;
  claims?: InsuranceClaim[];
}

export interface InsuranceClaim {
  id: string;
  policyId: string;
  shipmentId?: string;
  incidentId?: string;
  containerId?: string;
  generalAverageId?: string;
  claimNumber: string;
  amount: number;
  grossLoss?: number;
  status: ClaimStatus;
  lossType?: LossType;
  lossDate?: string;
  reason?: string;
  assessor?: string;
  requiredDocuments: EvidenceRole[];
  evidenceComplete: boolean;
  payoutAmount?: number;
  deductibleApplied?: number;
  payoutRef?: string;
  subrogationStatus: SubrogationStatus;
  subrogationRecovered: number;
  subrogationRef?: string;
  // What the CARRIER settled on their paper — distinct from the payout to the assured.
  underwriterClaimRef?: string;
  underwriterSettledAmount?: number;
  underwriterSettledAt?: string;
  filedAt?: string;
  resolvedAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface EvidenceState {
  required: EvidenceRole[];
  attached: { role: EvidenceRole; status: 'attached' | 'verified' | 'rejected'; documentId?: string; title?: string }[];
  satisfied: EvidenceRole[];
  missing: EvidenceRole[];
  rejected: EvidenceRole[];
  complete: boolean;
}

export interface Settlement {
  grossLoss: number;
  indemnity: number;
  deductible: number;
  payout: number;
  remainingCoverage: number;
  cappedByCoverage: boolean;
  deductibleWaived: boolean;
  notes: string[];
}

export interface ClaimDetail extends InsuranceClaim {
  evidence: EvidenceState;
  policy: InsurancePolicy | null;
  settlementPreview: Settlement | null;
}

/**
 * Broker economics. The distinction that matters: `commissionEarned` is revenue with
 * no risk attached, while `platformRetainedExposure` is cover written on Baalvion's
 * own balance sheet because no binder could take it.
 */
export interface BrokerSummary {
  /** The broker's OWN professional indemnity — unfunded E&O is what ends brokers. */
  indemnity: BrokerIndemnityPosition;
  boundBinders: number;
  placedPolicies: number;
  retainedPolicies: number;
  commissionEarned: number;
  premiumRemitted: number;
  platformRetainedExposure: number;
  carrierSettledOnClaims: number;
  capacity: { id: string; name: string; used: number; limit: number | null; remaining: number | null; utilisation: number | null }[];
}

/** Counted from the caller's own book — no seeded baseline, so an empty book reads zero. */
export interface InsuranceSummary {
  broker: BrokerSummary;
  activePolicies: number;
  totalPolicies: number;
  insuredValueActive: number;
  premiumEarned: number;
  openClaims: number;
  totalClaims: number;
  claimsPaidOut: number;
  subrogationRecovered: number;
  lossRatio: number | null;
  avgSettlementDays: number | null;
  settledClaimCount: number;
}

export interface GeneralAverageContribution {
  id: string;
  gaId: string;
  policyId?: string;
  shipmentId?: string;
  containerId?: string;
  cargoOwner?: string;
  contributoryValue: number;
  contributionAmount: number;
  securityType: 'none' | 'average_bond' | 'average_guarantee' | 'cash_deposit';
  securityRef?: string;
  status: 'pending' | 'secured' | 'settled' | 'waived';
  settledAt?: string;
  paymentRef?: string;
}

/** What apportion() reports back after re-dividing the allowance. */
export interface GeneralAverageApportionment {
  totalContributoryValue: number;
  allowance: number;
  rate: number | null;
  contributions: { id: string; policyId?: string; shipmentId?: string; contributoryValue: number; contributionAmount: number; status: string }[];
  settled: boolean;
}

export interface GeneralAverage {
  id: string;
  incidentId?: string;
  vesselName?: string;
  voyageNo?: string;
  declaredBy?: string;
  averageAdjuster?: string;
  declaredAt?: string;
  status: 'declared' | 'adjusting' | 'secured' | 'settled' | 'closed';
  currency: string;
  sacrificeValue: number;
  salvageExpenses: number;
  totalContributoryValue: number;
  contributionRate: number | null;
  adjustmentRef?: string;
  notes?: string;
  contributions?: GeneralAverageContribution[];
}

const POLICIES = '/insurance_policies';
const CLAIMS = '/insurance_claims';
const GA = '/general_average';

export const insuranceService = {
  /**
   * The caller's KYC/KYB standing. Booking freight and binding cover are refused
   * without it, so the UI asks first and explains, rather than letting the user fill
   * in a form and meet a 403 at the end.
   */
  async gate(): Promise<VerificationGate | null> {
    const res = await apiClient.get<VerificationGate>('/verification_center/gate');
    return res.data ?? null;
  },

  // ── policies ───────────────────────────────────────────────────────────────
  async summary(): Promise<InsuranceSummary | null> {
    const res = await apiClient.get<InsuranceSummary>(`${POLICIES}/summary`);
    return res.data ?? null;
  },

  /**
   * Price a cover. Pass a shipmentId and the server reads the lane, the transit time
   * and the declared value off the real shipment instead of trusting the form.
   */
  async quote(input: {
    type?: InsuranceType; shipmentId?: string; coverageAmount?: number;
    currency?: string; containerType?: string; deductibleRate?: number;
    originPort?: string; destinationPort?: string; transitDays?: number;
  }): Promise<QuoteResult> {
    const res = await apiClient.post<QuoteResult>(`${POLICIES}/quote`, input);
    return res.data!;
  },

  async getPolicies(params: { status?: PolicyStatus; shipmentId?: string; type?: InsuranceType } = {}): Promise<InsurancePolicy[]> {
    const res = await apiClient.get<InsurancePolicy[]>(POLICIES, params);
    return toList<InsurancePolicy>(res);
  },

  async getPolicyById(id: string): Promise<InsurancePolicy | null> {
    const res = await apiClient.get<InsurancePolicy>(`${POLICIES}/${id}`);
    return res.data ?? null;
  },

  async createPolicy(input: Partial<InsurancePolicy> & { containerType?: string; deductibleRate?: number }): Promise<InsurancePolicy> {
    const res = await apiClient.post<InsurancePolicy>(POLICIES, input);
    return res.data!;
  },

  /** Charges the premium through the finance suite and attaches cover for the voyage. */
  async bindPolicy(id: string, termMonths?: number): Promise<InsurancePolicy> {
    const res = await apiClient.post<InsurancePolicy>(`${POLICIES}/${id}/bind`, termMonths ? { termMonths } : {});
    return res.data!;
  },

  async cancelPolicy(id: string, reason?: string): Promise<InsurancePolicy> {
    const res = await apiClient.post<InsurancePolicy>(`${POLICIES}/${id}/cancel`, { reason });
    return res.data!;
  },

  // ── claims ─────────────────────────────────────────────────────────────────
  async getClaims(params: { status?: ClaimStatus; policyId?: string; incidentId?: string } = {}): Promise<InsuranceClaim[]> {
    const res = await apiClient.get<InsuranceClaim[]>(CLAIMS, params);
    return toList<InsuranceClaim>(res);
  },

  async getClaimById(id: string): Promise<ClaimDetail | null> {
    const res = await apiClient.get<ClaimDetail>(`${CLAIMS}/${id}`);
    return res.data ?? null;
  },

  async fileClaim(input: {
    policyId: string; amount: number; lossType?: LossType; lossDate?: string;
    reason?: string; shipmentId?: string; incidentId?: string;
  }): Promise<InsuranceClaim> {
    const res = await apiClient.post<InsuranceClaim>(CLAIMS, input);
    return res.data!;
  },

  /**
   * File straight off a logged incident. The server derives the loss type from the
   * incident, carries the container across, and finds the policy covering that
   * shipment when one is not named — the link that did not exist before.
   */
  async fileClaimFromIncident(input: { incidentId: string; amount: number; policyId?: string; reason?: string }): Promise<InsuranceClaim> {
    const res = await apiClient.post<InsuranceClaim>(`${CLAIMS}/from_incident`, input);
    return res.data!;
  },

  async claimsForIncident(incidentId: string): Promise<InsuranceClaim[]> {
    const res = await apiClient.get<InsuranceClaim[]>(`${CLAIMS}/for_incident/${incidentId}`);
    return toList<InsuranceClaim>(res);
  },

  async getEvidence(claimId: string): Promise<EvidenceState> {
    const res = await apiClient.get<EvidenceState>(`${CLAIMS}/${claimId}/documents`);
    return res.data!;
  },

  async attachEvidence(claimId: string, role: EvidenceRole, documentId: string, title?: string): Promise<{ claim: InsuranceClaim; evidence: EvidenceState }> {
    const res = await apiClient.post<{ claim: InsuranceClaim; evidence: EvidenceState }>(`${CLAIMS}/${claimId}/documents`, { role, documentId, title });
    return res.data!;
  },

  async assessClaim(id: string, assessor?: string): Promise<InsuranceClaim> {
    const res = await apiClient.post<InsuranceClaim>(`${CLAIMS}/${id}/assess`, { assessor });
    return res.data!;
  },

  /** Authorises the settlement: capped at remaining cover, net of the deductible. */
  async approveClaim(id: string, assessedLoss?: number): Promise<InsuranceClaim & { settlement: Settlement }> {
    const res = await apiClient.post<InsuranceClaim & { settlement: Settlement }>(`${CLAIMS}/${id}/approve`, assessedLoss != null ? { assessedLoss } : {});
    return res.data!;
  },

  async rejectClaim(id: string, reason: string): Promise<InsuranceClaim> {
    const res = await apiClient.post<InsuranceClaim>(`${CLAIMS}/${id}/reject`, { reason });
    return res.data!;
  },

  async payClaim(id: string): Promise<InsuranceClaim> {
    const res = await apiClient.post<InsuranceClaim>(`${CLAIMS}/${id}/pay`, {});
    return res.data!;
  },

  async recordSubrogation(id: string, input: { recovered: number; reference?: string; note?: string; status?: SubrogationStatus }): Promise<InsuranceClaim> {
    const res = await apiClient.post<InsuranceClaim>(`${CLAIMS}/${id}/subrogation`, input);
    return res.data!;
  },

  // ── underwriters / binders ─────────────────────────────────────────────────
  async getUnderwriters(): Promise<Underwriter[]> {
    const res = await apiClient.get<Underwriter[]>('/insurance_underwriters');
    return toList<Underwriter>(res);
  },

  async getUnderwriter(id: string): Promise<Underwriter | null> {
    const res = await apiClient.get<Underwriter>(`/insurance_underwriters/${id}`);
    return res.data ?? null;
  },

  /** The broker's own E&O / professional indemnity position. */
  async getIndemnity(): Promise<{ policies: unknown[]; position: BrokerIndemnityPosition } | null> {
    const res = await apiClient.get<{ policies: unknown[]; position: BrokerIndemnityPosition }>('/insurance_underwriters/indemnity');
    return res.data ?? null;
  },

  /** Record a binder. Platform operators only — it grants capacity on a carrier's book. */
  async createUnderwriter(input: Partial<Underwriter>): Promise<Underwriter> {
    const res = await apiClient.post<Underwriter>('/insurance_underwriters', input);
    return res.data!;
  },

  async updateUnderwriter(id: string, input: Partial<Underwriter>): Promise<Underwriter> {
    const res = await apiClient.patch<Underwriter>(`/insurance_underwriters/${id}`, input);
    return res.data!;
  },

  /** Record the carrier's own policy number once their confirmation arrives. */
  async confirmPlacement(underwriterId: string, policyId: string, policyRef: string): Promise<unknown> {
    const res = await apiClient.post(`/insurance_underwriters/${underwriterId}/policies/${policyId}/confirm`, { policyRef });
    return res.data;
  },

  /** What the carrier settled on their paper — not the payout, not subrogation. */
  async recordUnderwriterSettlement(claimId: string, input: { amount: number; reference?: string }): Promise<InsuranceClaim> {
    const res = await apiClient.post<InsuranceClaim>(`${CLAIMS}/${claimId}/underwriter_settlement`, input);
    return res.data!;
  },

  // ── general average ────────────────────────────────────────────────────────
  async getGeneralAverages(): Promise<GeneralAverage[]> {
    const res = await apiClient.get<GeneralAverage[]>(GA);
    return toList<GeneralAverage>(res);
  },

  async getGeneralAverage(id: string): Promise<GeneralAverage | null> {
    const res = await apiClient.get<GeneralAverage>(`${GA}/${id}`);
    return res.data ?? null;
  },

  async declareGeneralAverage(input: Partial<GeneralAverage> & { incidentId?: string }): Promise<GeneralAverage> {
    const res = await apiClient.post<GeneralAverage>(GA, input);
    return res.data!;
  },

  async addContribution(gaId: string, input: Partial<GeneralAverageContribution>): Promise<{ contribution: GeneralAverageContribution; apportionment: GeneralAverageApportionment }> {
    const res = await apiClient.post<{ contribution: GeneralAverageContribution; apportionment: GeneralAverageApportionment }>(`${GA}/${gaId}/contributions`, input);
    return res.data!;
  },

  async secureContribution(gaId: string, contributionId: string, securityType: GeneralAverageContribution['securityType'], securityRef?: string): Promise<GeneralAverageContribution> {
    const res = await apiClient.post<GeneralAverageContribution>(`${GA}/${gaId}/contributions/${contributionId}/secure`, { securityType, securityRef });
    return res.data!;
  },

  async settleContribution(gaId: string, contributionId: string): Promise<GeneralAverageContribution> {
    const res = await apiClient.post<GeneralAverageContribution>(`${GA}/${gaId}/contributions/${contributionId}/settle`, {});
    return res.data!;
  },
};

export const getPolicyById = (id: string) => insuranceService.getPolicyById(id);

// ── display helpers shared by the insurance pages ─────────────────────────────
export const EVIDENCE_LABELS: Record<EvidenceRole, string> = {
  bill_of_lading: 'Bill of lading',
  commercial_invoice: 'Commercial invoice',
  packing_list: 'Packing list',
  survey_report: 'Survey report',
  photo_evidence: 'Photographs of the damage',
  police_report: 'Police report',
  carrier_claim_letter: 'Claim letter to the carrier',
  non_delivery_certificate: 'Non-delivery certificate',
  delivery_receipt: 'Delivery receipt',
  weather_report: 'Weather report',
  repair_estimate: 'Repair estimate',
  general_average_bond: 'General average bond',
  insurance_certificate: 'Insurance certificate',
  other: 'Other',
};

/** The document-engine type to file each evidence role under. */
export const EVIDENCE_DOC_TYPES: Record<EvidenceRole, string> = {
  bill_of_lading: 'bill_of_lading',
  commercial_invoice: 'commercial_invoice',
  packing_list: 'packing_list',
  survey_report: 'inspection_report',
  photo_evidence: 'other',
  police_report: 'other',
  carrier_claim_letter: 'other',
  non_delivery_certificate: 'other',
  delivery_receipt: 'other',
  weather_report: 'other',
  repair_estimate: 'other',
  general_average_bond: 'other',
  insurance_certificate: 'insurance_document',
  other: 'other',
};

/** Green only when the lane's own experience actually drove the price. */
export const RATING_TONE = {
  measured: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', panel: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
  partial: { badge: 'bg-blue-50 text-blue-700 border-blue-200', panel: 'bg-blue-50 border-blue-200 text-blue-900' },
  default: { badge: 'bg-amber-50 text-amber-800 border-amber-200', panel: 'bg-amber-50 border-amber-200 text-amber-900' },
} as const;

/**
 * One place to say how a premium was rated, so the policy page, the quote panel and
 * the booking wizard cannot drift into telling the user three different stories.
 * `tone` is 'measured' only when the lane's own record carried real weight.
 */
export function describeRating(risk: RiskAssessment): { label: string; tone: 'measured' | 'partial' | 'default'; sentence: string } {
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  if (risk.basis === 'base_rate') {
    return {
      label: 'Base rate',
      tone: 'default',
      sentence: `The platform has no shipping history yet, so this is priced at the base rate (×${risk.multiplier}) — a default, not a measurement of this route.`,
    };
  }

  if (risk.basis === 'book_average') {
    return {
      label: 'Book average',
      tone: 'default',
      sentence: `No shipments have run this lane yet, so it is priced on the platform's own record — ${risk.bookIncidents} qualifying loss${risk.bookIncidents === 1 ? '' : 'es'} over ${risk.bookSampleSize} shipments in the last ${risk.lookbackMonths} months. Nothing here is specific to this route.`,
    };
  }

  const scope = risk.scope === 'port_pair' ? 'port pair' : 'country pair';
  const tone = risk.credibility >= 0.5 ? 'measured' : 'partial';
  return {
    label: tone === 'measured' ? 'Measured on this lane' : `Mostly book average (${pct(risk.credibility)} lane)`,
    tone,
    sentence:
      `Rated ×${risk.multiplier} from ${risk.observedIncidents} qualifying loss${risk.observedIncidents === 1 ? '' : 'es'} over ` +
      `${risk.sampleSize} shipments on this ${scope}, weighted at ${pct(risk.credibility)} and blended with ` +
      `${risk.bookIncidents} over ${risk.bookSampleSize} across the whole book. ` +
      (tone === 'partial'
        ? `A lane earns half weight at ${risk.halfCredibilitySample} shipments, so most of this price still comes from the book.`
        : `This lane's own record now drives the price.`),
  };
}

export const LOSS_TYPE_LABELS: Record<LossType, string> = {
  total_loss: 'Total loss',
  partial_loss: 'Partial loss',
  damage: 'Damage',
  theft: 'Theft',
  delay: 'Delay',
  general_average: 'General average',
  non_delivery: 'Non-delivery',
  contamination: 'Contamination',
};
