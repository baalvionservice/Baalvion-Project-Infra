/**
 * @file services/auction-service.ts
 * @description Browser client for the real orchestration Auction engine
 * (`/api/auctions/*` — proxy bidding, anti-snipe, reserve-gated close; see
 * `src/server/auction/*`). Calls go through `fetchLocalApi`, which mints and
 * attaches the signed identity envelope these routes require.
 */
import { fetchLocalApi } from '@/lib/local-api-client';

export type AuctionStatus = 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDED' | 'SETTLED' | 'FAILED' | 'CANCELLED';
export type AuctionType = 'ENGLISH' | 'SEALED' | 'DUTCH';
export type AuctionBidStatus = 'ACCEPTED' | 'WINNING' | 'OUTBID' | 'WON' | 'LOST' | 'REJECTED' | 'RETRACTED';

export interface Auction {
  id: string;
  organizationId: string;
  reference: string | null;
  type: AuctionType;
  status: AuctionStatus;
  title: string;
  lotRef: string | null;
  currency: string;
  startPrice: string;
  reservePrice: string | null;
  bidIncrement: string;
  buyNowPrice: string | null;
  currentPrice: string;
  leaderActorId: string | null;
  bidCount: number;
  startsAt: string;
  endsAt: string;
  originalEndsAt: string;
  winnerActorId: string | null;
  winningAmount: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuctionBid {
  id: string;
  auctionId: string;
  bidderActorId: string;
  amount: string;
  status: AuctionBidStatus;
  isAutoBid: boolean;
  sequence: number;
  placedAt: string;
}

export interface AuctionEvent {
  id: string;
  auctionId: string;
  sequence: number;
  type: string;
  actorId: string;
  amount: string | null;
  priceBefore: string | null;
  priceAfter: string | null;
  createdAt: string;
}

export interface CreateAuctionInput {
  title: string;
  currency: string;
  startPrice: string | number;
  reservePrice?: string | number;
  bidIncrement?: string | number;
  startsAt: string;
  endsAt: string;
  antiSnipeSeconds?: number;
  autoOpen?: boolean;
}

interface Envelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

async function unwrap<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || !body || body.success === false) {
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return body.data as T;
}

export const auctionService = {
  async list(params: { status?: AuctionStatus } = {}): Promise<{ items: Auction[]; total: number }> {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    const res = await fetchLocalApi(`/api/auctions${qs.toString() ? `?${qs}` : ''}`);
    return unwrap(res);
  },

  async get(id: string): Promise<Auction> {
    const res = await fetchLocalApi(`/api/auctions/${id}`);
    return unwrap(res);
  },

  async listBids(id: string): Promise<{ items: AuctionBid[]; total: number }> {
    const res = await fetchLocalApi(`/api/auctions/${id}/bids`);
    return unwrap(res);
  },

  async listEvents(id: string): Promise<{ items: AuctionEvent[]; total: number }> {
    const res = await fetchLocalApi(`/api/auctions/${id}/events`);
    return unwrap(res);
  },

  async create(input: CreateAuctionInput): Promise<Auction> {
    const res = await fetchLocalApi('/api/auctions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return unwrap(res);
  },

  async placeBid(id: string, amount: string | number, maxProxyAmount?: string | number): Promise<{ auction: Auction; bid: AuctionBid }> {
    const res = await fetchLocalApi(`/api/auctions/${id}/bids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, maxProxyAmount }),
    });
    return unwrap(res);
  },

  async transition(id: string, action: 'open' | 'close' | 'settle' | 'cancel', reason?: string): Promise<Auction> {
    const res = await fetchLocalApi(`/api/auctions/${id}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason }),
    });
    return unwrap(res);
  },
};
