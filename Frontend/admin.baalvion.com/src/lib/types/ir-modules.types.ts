// IR module types beyond Financial Reports — shareholders, earnings calls, events,
// filings, documents, performance. Field names are snake_case (straight off ir-service)
// and verified against the live ir.* tables + validators/schemas.js.

export type ShareholderType = 'institutional' | 'retail' | 'insider' | 'mutual_fund';
export interface Shareholder {
  id: string;
  name: string;
  type: ShareholderType;
  shares_held: number;
  ownership_pct: number;
  as_of_date: string;
  country: string | null;
  change_from_prev: number;
  change_pct: number;
  created_at: string;
  updated_at: string;
}
export interface ShareholderPayload {
  name: string;
  type: ShareholderType;
  shares_held: number;
  ownership_pct: number;
  as_of_date: string;
  country?: string;
  change_from_prev?: number;
  change_pct?: number;
}

export type EarningsStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';
export interface EarningsCall {
  id: string;
  title: string;
  quarter: number | null;
  year: number;
  scheduled_at: string | null;
  recorded_at: string | null;
  status: EarningsStatus;
  dial_in_info: string | null;
  webcast_url: string | null;
  replay_url: string | null;
  transcript: string | null;
  summary: string | null;
  highlights: string[];
  participants: unknown[];
  created_at: string;
  updated_at: string;
}
export interface EarningsPayload {
  title: string;
  quarter?: number | null;
  year: number;
  scheduled_at?: string;
  status?: EarningsStatus;
  dial_in_info?: string;
  webcast_url?: string;
  replay_url?: string;
  transcript?: string;
  summary?: string;
  highlights?: string[];
}

export type EventType = 'earnings_call' | 'agm' | 'investor_day' | 'roadshow' | 'conference' | 'webinar';
export type EventStatus = 'upcoming' | 'live' | 'completed' | 'cancelled';
export interface IrEvent {
  id: string;
  title: string;
  event_type: EventType;
  scheduled_at: string;
  end_at: string | null;
  location: string | null;
  webcast_url: string | null;
  description: string | null;
  registration_url: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}
export interface EventPayload {
  title: string;
  event_type: EventType;
  scheduled_at: string;
  end_at?: string;
  location?: string;
  webcast_url?: string;
  description?: string;
  registration_url?: string;
  status?: EventStatus;
}

export type FilingType = '10-K' | '10-Q' | '8-K' | 'proxy' | 'prospectus' | 'other';
export type FilingStatus = 'draft' | 'filed' | 'amended' | 'withdrawn';
export interface Filing {
  id: string;
  title: string;
  filing_type: FilingType;
  regulator: string | null;
  filing_date: string | null;
  period_of_report: string | null;
  status: FilingStatus;
  file_url: string | null;
  external_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}
export interface FilingPayload {
  title: string;
  filing_type: FilingType;
  regulator?: string;
  filing_date: string;
  period_of_report?: string;
  status?: FilingStatus;
  file_url?: string;
  external_url?: string;
  description?: string;
}

export type DocumentType = 'presentation' | 'factsheet' | 'prospectus' | 'annual_report' | 'other';
export interface IrDocument {
  id: string;
  title: string;
  document_type: DocumentType;
  description: string | null;
  file_url: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  language: string;
  year: number | null;
  is_public: boolean;
  downloads_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface DocumentPayload {
  title: string;
  document_type: DocumentType;
  description?: string;
  file_url: string;
  file_size_bytes?: number;
  mime_type?: string;
  language?: string;
  year?: number;
  is_public?: boolean;
}

export interface PerformanceSnapshot {
  navHistory: { date: string; nav: number }[];
  metrics: Record<string, number>;
  spvPerformance: unknown[];
  capitalTimeline: unknown[];
  documents: unknown[];
}
export interface PerformancePayload {
  metrics?: Record<string, number>;
  navHistory?: { date: string; nav: number }[];
}

export interface MarketSnapshot {
  id: string;
  symbol: string | null;
  exchange: string | null;
  price: number | null;
  currency: string | null;
  change_pct: number | null;
  market_cap: number | null;
  volume: number | null;
  week52_high: number | null;
  week52_low: number | null;
  pe_ratio: number | null;
  dividend_yield: number | null;
  dividend_per_share: number | null;
  as_of: string | null;
}
export interface MarketPayload {
  symbol?: string;
  exchange?: string;
  price?: number;
  currency?: string;
  change_pct?: number;
  market_cap?: number;
  volume?: number;
  week52_high?: number;
  week52_low?: number;
  pe_ratio?: number;
  dividend_yield?: number;
  dividend_per_share?: number;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export interface InvestorApplication {
  id: string;
  reference: string;
  full_name: string;
  email: string;
  entity?: string | null;
  investor_type?: string | null;
  accredited: boolean;
  commitment?: string | number | null;
  message?: string | null;
  status: ApplicationStatus;
  review_note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export const SHAREHOLDER_TYPES: ShareholderType[] = ['institutional', 'retail', 'insider', 'mutual_fund'];
export const EVENT_TYPES: EventType[] = ['earnings_call', 'agm', 'investor_day', 'roadshow', 'conference', 'webinar'];
export const EVENT_STATUSES: EventStatus[] = ['upcoming', 'live', 'completed', 'cancelled'];
export const FILING_TYPES: FilingType[] = ['10-K', '10-Q', '8-K', 'proxy', 'prospectus', 'other'];
export const FILING_STATUSES: FilingStatus[] = ['draft', 'filed', 'amended', 'withdrawn'];
export const DOCUMENT_TYPES: DocumentType[] = ['presentation', 'factsheet', 'prospectus', 'annual_report', 'other'];
export const EARNINGS_STATUSES: EarningsStatus[] = ['scheduled', 'live', 'completed', 'cancelled'];

export const LABEL = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
