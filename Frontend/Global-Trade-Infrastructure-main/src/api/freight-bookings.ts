/**
 * @file src/api/freight-bookings.ts
 * @description Freight Management — the existing Freight Marketplace booking engine
 * (carrier abstraction over DHL/FedEx/UPS/Maersk + carrier-to-carrier fallback).
 * Mounted at /v1/freight. Distinct from the new persisted Quote Requests
 * (freight-quotes.ts), which this booking flow can trace back to via `quote_id`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tradeApi } from './client';
import { qk } from './keys';

export type MarketplaceCarrier = 'dhl' | 'fedex' | 'ups' | 'maersk';
export type BookingStatus = 'draft' | 'booking' | 'booked' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled' | 'failed';

export interface MarketplaceDescriptor {
  engine_version: string;
  carriers: { carrier: MarketplaceCarrier; name: string; modes: string[]; reliability: number; default_currency: string }[];
  supported_carriers: string[];
  modes: string[];
  ranking: string[];
  statuses: BookingStatus[];
  terminal_statuses: string[];
  failure_kinds: string[];
}

export interface NormalizedQuote {
  carrier: string;
  service_level: string | null;
  mode: string;
  amount: number;
  currency: string;
  transit_days: number;
  estimated_delivery: string | null;
  valid_until: string | null;
  surcharges: { code: string | null; label: string; amount: number }[];
  reliability: number | null;
  chargeable_weight: number;
}

export interface CompareQuotesResult {
  request: Record<string, unknown>;
  rank: string;
  quotes: NormalizedQuote[];
  cheapest: NormalizedQuote | null;
  fastest: NormalizedQuote | null;
  best: NormalizedQuote | null;
  errors: {
    carrier: string;
    kind: string;
    code: string | null;
    message: string;
    /** The connector's own reasons — where an actionable cause actually lives. */
    messages?: { code?: string; level?: string; text: string }[];
  }[];
  carriers_quoted: string[];
  carriers_failed: string[];
  valid_until: string;
}

export interface FreightBooking {
  id: string;
  status: BookingStatus;
  carrier: string | null;
  service_level: string | null;
  mode: string | null;
  origin: Record<string, unknown>;
  destination: Record<string, unknown>;
  order_id: string | null;
  shipment_id: string | null;
  trade_operation_id: string | null;
  chargeable_weight_kg: number | null;
  amount: number | null;
  currency: string;
  tracking_number: string | null;
  gateway_reference: string | null;
  label_url: string | null;
  estimated_delivery: string | null;
  selected_quote: NormalizedQuote | null;
  quotes: NormalizedQuote[];
  carriers_attempted: string[];
  attempts: number;
  messages: unknown[];
  last_error: string | null;
  failure_kind: string | null;
  engine_version: string;
  booked_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FreightBookingEvent {
  id: string;
  booking_id: string;
  carrier: string | null;
  event_type: string;
  status: string | null;
  attempt: number | null;
  message: string | null;
  detail: Record<string, unknown>;
  created_at: string;
}

export interface ShipmentRequest {
  reference?: string;
  mode?: string;
  incoterm?: string;
  currency?: string;
  declared_value?: number;
  origin: { country: string; city?: string; postal_code?: string; residential?: boolean };
  destination: { country: string; city?: string; postal_code?: string; residential?: boolean };
  pieces: { quantity: number; weight_kg: number; length_cm: number; width_cm: number; height_cm: number }[];
  ready_date?: string;
  /** Free-form context carried through to the booking record (port codes, corridor, cargo). */
  metadata?: Record<string, unknown>;
}

export const freightBookingApi = {
  marketplace: () => tradeApi.get<MarketplaceDescriptor>('/freight/carriers'),
  compareQuotes: (request: ShipmentRequest, rank?: string) => tradeApi.post<CompareQuotesResult>('/freight/quotes', { request, rank }),
  create: (body: { request: ShipmentRequest; preferred_carrier?: MarketplaceCarrier; order_id?: string; shipment_id?: string; idempotency_key?: string }) =>
    tradeApi.post<FreightBooking>('/freight', body),
  list: (params: { status?: BookingStatus; carrier?: string; shipment_id?: string; order_id?: string; page?: number; limit?: number } = {}) =>
    tradeApi.list<FreightBooking>('/freight', params as Record<string, string | number>),
  get: (id: string) => tradeApi.get<FreightBooking>(`/freight/${id}`),
  events: (id: string) => tradeApi.get<FreightBookingEvent[]>(`/freight/${id}/events`),
  updateStatus: (id: string, status: BookingStatus) => tradeApi.post<FreightBooking>(`/freight/${id}/status`, { status }),
  retry: (id: string) => tradeApi.post<FreightBooking>(`/freight/${id}/retry`, {}),
  cancel: (id: string, reason?: string) => tradeApi.post<FreightBooking>(`/freight/${id}/cancel`, { reason }),
};

export function useMarketplace() {
  return useQuery({ queryKey: qk.freightBookings.marketplaceCarriers, queryFn: freightBookingApi.marketplace, staleTime: 60 * 60_000 });
}

export function useCompareQuotes() {
  return useMutation({ mutationFn: (vars: { request: ShipmentRequest; rank?: string }) => freightBookingApi.compareQuotes(vars.request, vars.rank) });
}

export function useFreightBookings(params: { status?: BookingStatus; carrier?: string; shipment_id?: string } = {}, opts: { enabled?: boolean; poll?: boolean } = {}) {
  return useQuery({
    queryKey: qk.freightBookings.list(params),
    queryFn: () => freightBookingApi.list(params),
    enabled: opts.enabled ?? true,
    refetchInterval: opts.poll ? 30_000 : false,
  });
}

export function useFreightBooking(id: string | undefined) {
  return useQuery({
    queryKey: qk.freightBookings.detail(id ?? ''),
    queryFn: () => freightBookingApi.get(id as string),
    enabled: !!id,
  });
}

export function useFreightBookingEvents(id: string | undefined) {
  return useQuery({
    queryKey: qk.freightBookings.events(id ?? ''),
    queryFn: () => freightBookingApi.events(id as string),
    enabled: !!id,
  });
}

function useBookingMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: qk.freightBookings.all }) });
}

export function useCreateFreightBooking() {
  return useBookingMutation((body: { request: ShipmentRequest; preferred_carrier?: MarketplaceCarrier; order_id?: string; shipment_id?: string; idempotency_key?: string }) =>
    freightBookingApi.create(body));
}
export function useRetryFreightBooking() {
  return useBookingMutation((id: string) => freightBookingApi.retry(id));
}
export function useCancelFreightBooking() {
  return useBookingMutation((vars: { id: string; reason?: string }) => freightBookingApi.cancel(vars.id, vars.reason));
}
