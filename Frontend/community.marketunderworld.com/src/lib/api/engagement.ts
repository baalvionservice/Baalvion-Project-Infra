// Monthly lottery and Demand Your DJ. Both are paid from the points wallet; every call goes through the same-origin commerce bridge.
import { MARKET_UNDERWORLD_STORE_ID } from './commerce';

const BASE = '/api/commerce-proxy';
const PUBLIC = `/storefront/${MARKET_UNDERWORLD_STORE_ID}/engagement`;

export interface Draw {
  id: string; title: string; state: string | null; prize: string; entryPoints: number; maxEntriesPerUser: number; winnersCount: number;
  closesAt: string; status: 'draft' | 'open' | 'closed' | 'drawn' | 'cancelled'; drawnAt: string | null; drawSeed?: string;
  entries: number; members: number;
  winners: { ticketNo: number; position: number; memberNumber: number | null; claimed: boolean; entryId?: string }[];
}
export interface Demand {
  id: string; djName: string; genre: string | null; clubName: string; city: string; state: string | null; note: string | null;
  targetPoints: number; status: 'pending' | 'open' | 'confirmed' | 'closed' | 'rejected'; closesAt: string | null;
  decisionNote: string | null; createdAt: string; pledgedPoints: number; pledgers: number; proposedBy?: string;
}
export interface MyEntry { drawId: string; title: string; ticketNo: number; status: string; won: boolean; position: number | null; claimedAt: string | null }
export interface MyPledge { id: string; demandId: string; djName: string; clubName: string; points: number; status: 'held' | 'refunded' | 'applied'; demandStatus: string }

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init, headers: { 'content-type': 'application/json', ...(init.headers || {}) }, credentials: 'include', cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw Object.assign(new Error(body.error?.message || `Request failed (${res.status})`), { status: res.status, code: body.error?.code as string | undefined });
  }
  return body.data as T;
}
const post = <T>(path: string, data?: unknown) => call<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) });

export const listDraws = () => call<{ items: Draw[] }>(`${PUBLIC}/lottery`);
export const listDemands = () => call<{ items: Demand[]; minPledgePoints: number }>(`${PUBLIC}/dj-demands`);
export const myEntries = () => call<{ items: MyEntry[]; balance: number }>('/engagement/lottery/mine');
export const enterDraw = (id: string, count: number) => post<{ tickets: number[]; pointsSpent: number; balance: number }>(`/engagement/lottery/${id}/enter`, { count, confirmAge: true });
export const myDemandActivity = () => call<{ proposals: Demand[]; pledges: MyPledge[]; balance: number }>('/engagement/dj-demands/mine');
export const proposeDemand = (d: { djName: string; genre?: string; clubName: string; city: string; state?: string; note?: string }) => post<Demand>('/engagement/dj-demands', d);
export const pledgeToDemand = (id: string, points: number) => post<Demand>(`/engagement/dj-demands/${id}/pledge`, { points });
export const withdrawPledge = (id: string) => post<{ refunded: number; balance: number }>(`/engagement/dj-demands/${id}/withdraw`);

export const adminApi = {
  draws: () => call<{ items: Draw[] }>('/engagement/admin/lottery'),
  draw: (id: string) => call<Draw>(`/engagement/admin/lottery/${id}`),
  createDraw: (d: { title: string; state?: string; prize: string; entryPoints: number; maxEntriesPerUser: number; winnersCount: number; closesAt: string }) => post<Draw>('/engagement/admin/lottery', d),
  drawAction: (id: string, action: 'open' | 'close' | 'draw' | 'cancel') => post<Draw>(`/engagement/admin/lottery/${id}/${action}`),
  claimed: (entryId: string) => post<{ ok: boolean }>(`/engagement/admin/lottery/entries/${entryId}/claimed`),
  demands: (status?: string) => call<{ items: Demand[] }>(`/engagement/admin/dj-demands${status ? `?status=${status}` : ''}`),
  approve: (id: string, d: { targetPoints: number; closesAt?: string }) => post<Demand>(`/engagement/admin/dj-demands/${id}/approve`, d),
  demandAction: (id: string, action: 'reject' | 'confirm' | 'close', note?: string) => post<Demand>(`/engagement/admin/dj-demands/${id}/${action}`, { note }),
};
