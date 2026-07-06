/**
 * @file src/api/freight-carriers.ts
 * @description Freight Management — Carrier Directory: the dynamic carrier registry
 * (any carrier, no hardcoded provider list) + nested service/region coverage + the
 * periodic carrier performance aggregate. Distinct from the legacy `/carriers`
 * read-only shim and the marketplace descriptor at `/freight/carriers`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tradeApi } from './client';
import { qk } from './keys';

export type CarrierStatus = 'active' | 'suspended' | 'inactive';
export type CarrierAvailability = 'active' | 'limited' | 'inactive';
export type TransportMode = 'ocean' | 'air' | 'rail' | 'road' | 'express' | 'courier' | 'multimodal';

export interface CarrierService {
  id: string;
  serviceType: string;
  transportMode: TransportMode;
  transitTimeDays: number | null;
  baseFee: number | null;
  ratePerKg: number | null;
  active: boolean;
}

export interface CarrierRegion {
  id: string;
  regionType: 'country' | 'lane' | 'port_pair';
  originCode: string | null;
  destinationCode: string | null;
  active: boolean;
}

export interface Carrier {
  id: string;
  code: string;
  name: string;
  logoUrl: string | null;
  country: string | null;
  connectorKey: 'dhl' | 'fedex' | 'ups' | 'maersk' | null;
  credentialEnvPrefix: string | null;
  services: CarrierService[];
  coverage: Record<string, unknown>;
  fleet: Record<string, unknown>;
  modes: TransportMode[];
  rating: number | null;
  reliabilityScore: number;
  insurance: { provider?: string; coverage_amount?: number; currency?: string; valid_until?: string };
  certifications: string[];
  trackingApiSupported: boolean;
  bookingApiSupported: boolean;
  pricingApiSupported: boolean;
  availabilityStatus: CarrierAvailability;
  operatingRegions: string[];
  supportContact: { name?: string; email?: string; phone?: string };
  documents: unknown[];
  status: CarrierStatus;
  performanceScore: number | null;
  carrierServices: CarrierService[];
  carrierRegions: CarrierRegion[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCarrierBody {
  code: string;
  name: string;
  logoUrl?: string;
  country?: string;
  connectorKey?: 'dhl' | 'fedex' | 'ups' | 'maersk';
  credentialEnvPrefix?: string;
  modes?: TransportMode[];
  rating?: number;
  reliabilityScore?: number;
  insurance?: Record<string, unknown>;
  certifications?: string[];
  trackingApiSupported?: boolean;
  bookingApiSupported?: boolean;
  pricingApiSupported?: boolean;
  availabilityStatus?: CarrierAvailability;
  operatingRegions?: string[];
  supportContact?: Record<string, unknown>;
  status?: CarrierStatus;
}

export interface CarrierPerformanceSnapshot {
  id: string;
  carrierId: string;
  periodStart: string;
  periodEnd: string;
  bookingsCount: number;
  onTimePct: number | null;
  avgTransitDays: number | null;
  etaAccuracyPct: number | null;
  damageIncidentRate: number | null;
  cancellationRate: number | null;
  avgRating: number | null;
  computedScore: number | null;
  createdAt: string;
}

export interface CarrierListParams {
  status?: CarrierStatus;
  availabilityStatus?: CarrierAvailability;
  country?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export const freightCarrierApi = {
  list: (params: CarrierListParams = {}) => tradeApi.list<Carrier>('/freight/carrier-directory', params),
  get: (id: string) => tradeApi.get<Carrier>(`/freight/carrier-directory/${id}`),
  create: (body: CreateCarrierBody) => tradeApi.post<Carrier>('/freight/carrier-directory', body),
  update: (id: string, body: Partial<CreateCarrierBody>) => tradeApi.patch<Carrier>(`/freight/carrier-directory/${id}`, body),
  remove: (id: string) => tradeApi.delete<{ id: string; deleted: boolean }>(`/freight/carrier-directory/${id}`),
  addService: (id: string, body: Partial<CarrierService> & { serviceType: string; transportMode: TransportMode }) =>
    tradeApi.post<CarrierService>(`/freight/carrier-directory/${id}/services`, body),
  addRegion: (id: string, body: Partial<CarrierRegion> & { regionType: string }) =>
    tradeApi.post<CarrierRegion>(`/freight/carrier-directory/${id}/regions`, body),
  performanceList: (params: { carrierId?: string; page?: number; limit?: number } = {}) =>
    tradeApi.list<CarrierPerformanceSnapshot>('/freight/carrier-performance', params),
  performanceLatest: (carrierId: string) =>
    tradeApi.get<CarrierPerformanceSnapshot>(`/freight/carrier-performance/${carrierId}/latest`),
  refreshPerformance: (periodDays?: number) =>
    tradeApi.post<{ processed: number }>('/freight/carrier-performance/refresh', { period_days: periodDays }),
};

export function useCarriers(params: CarrierListParams = {}, opts: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: qk.freightCarriers.list(params),
    queryFn: () => freightCarrierApi.list(params),
    enabled: opts.enabled ?? true,
  });
}

export function useCarrier(id: string | undefined) {
  return useQuery({
    queryKey: qk.freightCarriers.detail(id ?? ''),
    queryFn: () => freightCarrierApi.get(id as string),
    enabled: !!id,
  });
}

export function useCarrierPerformanceLatest(carrierId: string | undefined) {
  return useQuery({
    queryKey: qk.freightCarriers.performance(carrierId ?? ''),
    queryFn: () => freightCarrierApi.performanceLatest(carrierId as string),
    enabled: !!carrierId,
    retry: false,
  });
}

export function useCarrierPerformanceList(params: { carrierId?: string } = {}) {
  return useQuery({
    queryKey: qk.freightCarriers.performanceList(params),
    queryFn: () => freightCarrierApi.performanceList(params),
  });
}

function useCarrierMutation<TVars>(fn: (vars: TVars) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: qk.freightCarriers.all }) });
}

export function useCreateCarrier() {
  return useCarrierMutation((body: CreateCarrierBody) => freightCarrierApi.create(body));
}
export function useUpdateCarrier() {
  return useCarrierMutation((vars: { id: string; body: Partial<CreateCarrierBody> }) => freightCarrierApi.update(vars.id, vars.body));
}
export function useDeleteCarrier() {
  return useCarrierMutation((id: string) => freightCarrierApi.remove(id));
}
export function useAddCarrierService() {
  return useCarrierMutation((vars: { id: string; body: Partial<CarrierService> & { serviceType: string; transportMode: TransportMode } }) =>
    freightCarrierApi.addService(vars.id, vars.body));
}
export function useAddCarrierRegion() {
  return useCarrierMutation((vars: { id: string; body: Partial<CarrierRegion> & { regionType: string } }) =>
    freightCarrierApi.addRegion(vars.id, vars.body));
}
export function useRefreshCarrierPerformance() {
  return useCarrierMutation((periodDays: number | undefined) => freightCarrierApi.refreshPerformance(periodDays));
}
