/**
 * @file src/api/freight-quotes.ts
 * @description Freight Management — Rate Engine (persisted lane/weight/volume/
 * seasonal/peak/contract/country/discount/markup pricing rules + a stateless rate
 * preview) and Quote Requests (fans out across every active Carrier Directory
 * entry with a full charge breakdown + scored comparison). Distinct from the
 * ephemeral marketplace comparison in freight-bookings.ts.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tradeApi } from './client';
import { qk } from './keys';
import type { TransportMode } from './freight-carriers';

// ── Rate Engine ───────────────────────────────────────────────────────────────

export type RateRuleType = 'lane' | 'weight' | 'volume' | 'seasonal' | 'peak' | 'contract' | 'country' | 'discount' | 'markup';
export type RateAdjustmentType = 'flat' | 'percent' | 'per_kg' | 'per_cbm';

export interface FreightRateRule {
  id: string;
  ruleType: RateRuleType;
  carrierId: string | null;
  originCode: string | null;
  destinationCode: string | null;
  mode: string | null;
  minWeightKg: number | null;
  maxWeightKg: number | null;
  minVolumeCbm: number | null;
  maxVolumeCbm: number | null;
  validFrom: string | null;
  validTo: string | null;
  currency: string;
  adjustmentType: RateAdjustmentType;
  adjustmentValue: number;
  priority: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRateRuleBody {
  ruleType: RateRuleType;
  carrierId?: string;
  originCode?: string;
  destinationCode?: string;
  mode?: string;
  minWeightKg?: number;
  maxWeightKg?: number;
  minVolumeCbm?: number;
  maxVolumeCbm?: number;
  validFrom?: string;
  validTo?: string;
  currency?: string;
  adjustmentType: RateAdjustmentType;
  adjustmentValue: number;
  priority?: number;
  active?: boolean;
}

export interface RatePreviewBody {
  carrierId?: string;
  originCode?: string;
  destinationCode?: string;
  mode?: string;
  baseRate: number;
  weightKg?: number;
  volumeCbm?: number;
  fuelPct?: number;
  currency?: string;
}

export interface RatePreviewResult {
  baseRate: number;
  finalRate: number;
  appliedRules: { id: string | null; ruleType: string; adjustmentType: string; adjustmentValue: number; delta: number }[];
  fuelSurcharge: number;
  totalWithFuel: number;
  currency: string;
}

export const freightRateApi = {
  listRules: (params: { ruleType?: string; carrierId?: string; active?: boolean; page?: number; limit?: number } = {}) =>
    tradeApi.list<FreightRateRule>('/freight/rate-rules', params as Record<string, string | number | boolean>),
  getRule: (id: string) => tradeApi.get<FreightRateRule>(`/freight/rate-rules/${id}`),
  createRule: (body: CreateRateRuleBody) => tradeApi.post<FreightRateRule>('/freight/rate-rules', body),
  updateRule: (id: string, body: Partial<CreateRateRuleBody>) => tradeApi.patch<FreightRateRule>(`/freight/rate-rules/${id}`, body),
  removeRule: (id: string) => tradeApi.delete<{ id: string; deleted: boolean }>(`/freight/rate-rules/${id}`),
  preview: (body: RatePreviewBody) => tradeApi.post<RatePreviewResult>('/freight/rate-preview', body),
};

export function useRateRules(params: { ruleType?: string; carrierId?: string; active?: boolean } = {}) {
  return useQuery({ queryKey: qk.freightQuotes.rateRules(params), queryFn: () => freightRateApi.listRules(params) });
}

function useRateRuleMutation<TVars>(fn: (vars: TVars) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: qk.freightQuotes.all }) });
}

export function useCreateRateRule() {
  return useRateRuleMutation((body: CreateRateRuleBody) => freightRateApi.createRule(body));
}
export function useUpdateRateRule() {
  return useRateRuleMutation((vars: { id: string; body: Partial<CreateRateRuleBody> }) => freightRateApi.updateRule(vars.id, vars.body));
}
export function useDeleteRateRule() {
  return useRateRuleMutation((id: string) => freightRateApi.removeRule(id));
}
export function useRatePreview() {
  return useMutation({ mutationFn: (body: RatePreviewBody) => freightRateApi.preview(body) });
}

// ── Quote Requests ────────────────────────────────────────────────────────────

export type FreightQuoteStatus = 'draft' | 'quoted' | 'expired' | 'converted';

export interface FreightQuoteItem {
  id: string;
  carrierId: string | null;
  serviceLevel: string | null;
  baseFreight: number;
  fuelSurcharge: number;
  terminalCharge: number;
  handlingCharge: number;
  customsCharge: number;
  insuranceEstimate: number;
  taxEstimate: number;
  totalAmount: number;
  currency: string;
  transitDays: number | null;
  carbonEstimateKg: number | null;
  rankCheapest: number | null;
  rankFastest: number | null;
  rankBest: number | null;
  selected: boolean;
}

export interface FreightComparison {
  carrierId: string | null;
  rank: number;
  priceScore: number;
  transitScore: number;
  reliabilityScore: number;
  capacityScore: number;
  carbonScore: number;
  insuranceScore: number;
  trackingQualityScore: number;
  pickupAvailabilityScore: number;
  deliveryAccuracyScore: number;
  cancellationPolicyScore: number;
  overallScore: number;
}

export interface FreightQuote {
  id: string;
  shipmentId: string | null;
  tradeOperationId: string | null;
  origin: { country?: string; city?: string; postal_code?: string };
  destination: { country?: string; city?: string; postal_code?: string };
  cargo: Record<string, unknown>;
  incoterm: string | null;
  transportMode: TransportMode | null;
  preferredCarrierId: string | null;
  requestedPickup: string | null;
  requestedDelivery: string | null;
  status: FreightQuoteStatus;
  validUntil: string | null;
  engineVersion: string | null;
  items: FreightQuoteItem[];
  comparisons: FreightComparison[];
  errors?: { carrierId: string; carrierCode: string; message: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface QuotePiece {
  quantity: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface CreateQuoteBody {
  shipmentId?: string;
  tradeOperationId?: string;
  origin: { country: string; city?: string; postalCode?: string; line1?: string };
  destination: { country: string; city?: string; postalCode?: string; line1?: string };
  cargoType?: string;
  commodity?: string;
  hsCode?: string;
  hazardous?: boolean;
  containerType?: string;
  pieces: QuotePiece[];
  totalWeightKg?: number;
  incoterm?: string;
  transportMode?: TransportMode;
  preferredCarrierId?: string;
  deliverySpeed?: 'economy' | 'standard' | 'express';
  insuranceRequested?: boolean;
  declaredValue?: number;
  currency?: string;
  expectedPickup?: string;
  expectedDelivery?: string;
}

export const freightQuoteApi = {
  list: (params: { status?: FreightQuoteStatus; shipmentId?: string; page?: number; limit?: number } = {}) =>
    tradeApi.list<FreightQuote>('/freight/quote-requests', params as Record<string, string | number>),
  get: (id: string) => tradeApi.get<FreightQuote>(`/freight/quote-requests/${id}`),
  create: (body: CreateQuoteBody) => tradeApi.post<FreightQuote>('/freight/quote-requests', body),
};

export function useFreightQuotes(params: { status?: FreightQuoteStatus; shipmentId?: string } = {}, opts: { enabled?: boolean; poll?: boolean } = {}) {
  return useQuery({
    queryKey: qk.freightQuotes.list(params),
    queryFn: () => freightQuoteApi.list(params),
    enabled: opts.enabled ?? true,
    refetchInterval: opts.poll ? 30_000 : false,
  });
}

export function useFreightQuote(id: string | undefined) {
  return useQuery({
    queryKey: qk.freightQuotes.detail(id ?? ''),
    queryFn: () => freightQuoteApi.get(id as string),
    enabled: !!id,
  });
}

export function useCreateFreightQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateQuoteBody) => freightQuoteApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.freightQuotes.all }),
  });
}
