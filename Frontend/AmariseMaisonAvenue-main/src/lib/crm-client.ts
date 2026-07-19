/**
 * Amarisé Maison Avenue — CRM client (read-side) over crm-service.
 *
 * Powers the internal /admin dashboards with REAL data from crm-service
 * (NEXT_PUBLIC_CRM_URL, default http://localhost:3063/api/v1). Backend responses use the
 * platform envelope `{ success, data, meta }`; list endpoints return
 * `{ data: { items, total, page, limit, totalPages } }`.
 *
 * AUTH: reuses the SAME in-memory access token as lib/api-client.ts (getAccessToken from
 * lib/auth) — the token is held in memory only (never localStorage/cookie). Each list helper
 * returns just the `items` array and DEGRADES TO `[]` on any error, so a CRM outage can never
 * break an admin page (the caller falls back to the mock store).
 */
'use client';

import { unwrapResponse } from './unwrap';
import { getAccessToken } from './auth';
import type {
  Vendor, Campaign, CustomerSegment, VipClient, Affiliate, Appointment, SupportTicket,
  PrivateInquiry, LeadConversation,
} from './types';

const CRM_URL = process.env.NEXT_PUBLIC_CRM_URL || 'http://localhost:3063/api/v1';

// Same auth-token source as api-client.ts (in-memory, set by lib/auth on login/refresh).
function authHeaders(): HeadersInit {
  const token = getAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function postJson<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${CRM_URL}${path}`, {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return unwrapResponse<T>(await res.json());
  } catch {
    return null;
  }
}

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${CRM_URL}${path}`, {
      headers: authHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return null;
    return unwrapResponse<T>(await res.json());
  } catch {
    return null;
  }
}

interface CrmList<T> {
  items?: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

/**
 * GET a CRM list resource and return ONLY its items array.
 * Any failure (network, non-2xx, error envelope, malformed body) degrades to `[]` so the
 * admin page silently falls back to the mock store — never a thrown error or broken render.
 */
async function listResource<T>(resource: string): Promise<T[]> {
  try {
    const res = await fetch(`${CRM_URL}/crm/${resource}`, {
      headers: authHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return [];
    const body = unwrapResponse<CrmList<T> | T[]>(await res.json());
    if (Array.isArray(body)) return body;
    return body?.items ?? [];
  } catch {
    return [];
  }
}

export function listVendors(): Promise<Vendor[]> {
  return listResource<Vendor>('vendors');
}

export function listCampaigns(): Promise<Campaign[]> {
  return listResource<Campaign>('campaigns');
}

export function listSegments(): Promise<CustomerSegment[]> {
  return listResource<CustomerSegment>('segments');
}

export function listVipClients(): Promise<VipClient[]> {
  return listResource<VipClient>('vip-clients');
}

export function listAffiliates(): Promise<Affiliate[]> {
  return listResource<Affiliate>('affiliates');
}

export function listAppointments(): Promise<Appointment[]> {
  return listResource<Appointment>('appointments');
}

export function listSupportTickets(): Promise<SupportTicket[]> {
  return listResource<SupportTicket>('support-tickets');
}

/**
 * Submit the general contact form as a real support ticket (public-create — see
 * crm-service/routes/v1.js `mountEntity('/crm/support-tickets', ..., { publicCreate: true })`).
 * Was previously a fake `setTimeout` with no captured input and no backend call at all.
 */
export function createSupportTicket(payload: {
  customerName: string;
  customerEmail: string;
  subject: string;
  category?: string;
  message: string;
}): Promise<SupportTicket | null> {
  return postJson<SupportTicket>('/crm/support-tickets', {
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    subject: payload.subject,
    category: payload.category,
    lastMessage: payload.message,
    messages: [
      {
        id: `m-${Date.now()}`,
        sender: 'customer',
        text: payload.message,
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

// ── Private sales inquiries (real crm-service persistence — see crm-service/models/inquiry.js) ──

/** Raise a new private inquiry. Public-create (guests included) — mirrors appointment booking. */
export function createInquiry(
  payload: Omit<PrivateInquiry, 'id' | 'status' | 'leadTier' | 'timestamp'>
): Promise<PrivateInquiry | null> {
  return postJson<PrivateInquiry>('/crm/inquiries', payload);
}

/**
 * PII-safe lookup of a single inquiry by id + the email it was raised under (mirrors
 * order-service's guest order-lookup pattern) — never by id alone, so a leaked/guessed id
 * can't be used to read someone else's inquiry.
 */
export function getMyInquiry(id: string, email: string): Promise<PrivateInquiry | null> {
  return getJson<PrivateInquiry>(`/crm/inquiries/${id}/mine?email=${encodeURIComponent(email)}`);
}

/** Append one message to the inquiry thread (client-side sends). Returns the updated inquiry. */
export function addInquiryMessage(
  id: string,
  sender: 'client' | 'curator',
  text: string
): Promise<PrivateInquiry | null> {
  return postJson<PrivateInquiry>(`/crm/inquiries/${id}/messages`, { sender, text });
}

/** Derive the CuratorChat-shaped conversation view from an inquiry's real messages thread. */
export function toConversation(inquiry: PrivateInquiry & { messages?: LeadConversation['messages'] }): LeadConversation {
  return {
    id: `conv-${inquiry.id}`,
    inquiryId: inquiry.id,
    status: inquiry.status === 'won' ? 'closed' : 'active',
    messages: inquiry.messages ?? [],
  };
}

// ── VIP client (real crm-service persistence — see crm-service/models/vipClient.js) ──

/** The logged-in customer's OWN VIP record, or null if they have none. Auth required — never
 * falls back to any other customer's record. */
export function getMyVipClient(): Promise<VipClient | null> {
  return getJson<VipClient>('/crm/vip-clients/me');
}

/**
 * Debit (negative) or credit (positive) the logged-in customer's OWN wallet + append a ledger
 * entry — server-resolves the row from the auth token, never a client-supplied id, so this can
 * never touch another customer's wallet.
 */
export function adjustMyWallet(deltaAmount: number, note: string): Promise<VipClient | null> {
  return postJson<VipClient>('/crm/vip-clients/me/wallet', { deltaAmount, note });
}

/** Book a real appointment (private viewing, virtual try-on, or live-shopping session). */
export function createAppointment(payload: Partial<Appointment>): Promise<Appointment | null> {
  return postJson<Appointment>('/crm/appointments', payload);
}
