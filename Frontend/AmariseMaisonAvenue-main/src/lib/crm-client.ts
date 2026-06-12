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
import type { Vendor, Campaign, CustomerSegment, VipClient, Affiliate, Appointment, SupportTicket } from './types';

const CRM_URL = process.env.NEXT_PUBLIC_CRM_URL || 'http://localhost:3063/api/v1';

// Same auth-token source as api-client.ts (in-memory, set by lib/auth on login/refresh).
function authHeaders(): HeadersInit {
  const token = getAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
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
