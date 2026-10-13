/**
 * @file dashboard-derive.ts
 * @description Pure functions that turn raw API records into the numbers shown on the buyer and
 * seller dashboards. They never invent data: a figure is either computed from records the server
 * returned, or it is absent. No I/O here, so every rule is unit-tested.
 */

type AnyRecord = Record<string, any>;

const norm = (v: unknown): string => String(v ?? '').trim().toLowerCase();
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const timeOf = (r: AnyRecord): number => {
  const t = new Date(r.createdAt ?? r.created_at ?? r.updatedAt ?? r.updated_at ?? NaN).getTime();
  return Number.isFinite(t) ? t : 0;
};

const FINISHED_ORDER = new Set(['delivered', 'completed', 'closed', 'cancelled', 'canceled', 'rejected']);
const WAITING_PAYMENT = new Set(['pending', 'processing', 'awaiting']);
const PAID = new Set(['settled', 'completed', 'released', 'paid']);
const OPEN_SELLER_ORDER = new Set(['pending', 'confirmed', 'processing']);
const FINISHED_DEAL = new Set(['finalized', 'finalised', 'cancelled', 'canceled']);

export const openOrderCount = (orders: AnyRecord[]): number => orders.filter((o) => !FINISHED_ORDER.has(norm(o.status))).length;
export const waitingPaymentCount = (payments: AnyRecord[]): number => payments.filter((p) => WAITING_PAYMENT.has(norm(p.status))).length;
export const inTransitCount = (shipments: AnyRecord[]): number => shipments.filter((s) => norm(s.status) === 'in_transit').length;
export const sellerOpenOrderCount = (orders: AnyRecord[]): number => orders.filter((o) => OPEN_SELLER_ORDER.has(norm(o.status))).length;
export const activeDealCount = (deals: AnyRecord[]): number => deals.filter((d) => !FINISHED_DEAL.has(norm(d.status))).length;

/** Money the seller has actually received: settlements that reached a paid state. */
export function receivedTotal(settlements: AnyRecord[]): number {
  return settlements.filter((s) => PAID.has(norm(s.status))).reduce((sum, s) => sum + num(s.amount), 0);
}

export interface WeeklyPoint { week: string; label: string; amount: number }

/** Monday 00:00 UTC of the week containing `t`. */
function weekStart(t: number): number {
  const d = new Date(t);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day);
}

/**
 * Money received per week for the last `weeks` weeks, from real paid settlements. Weeks with no
 * payments are zero. Returns an empty list when nothing was received at all, so the page can say
 * so instead of drawing a flat line.
 */
export function receivedByWeek(settlements: AnyRecord[], now: number = Date.now(), weeks = 8): WeeklyPoint[] {
  const paid = settlements.filter((s) => PAID.has(norm(s.status)) && timeOf(s) > 0);
  if (!paid.length) return [];
  const thisWeek = weekStart(now);
  const WEEK = 7 * 24 * 3600 * 1000;
  const buckets = new Map<number, number>();
  for (let i = weeks - 1; i >= 0; i -= 1) buckets.set(thisWeek - i * WEEK, 0);
  for (const s of paid) {
    const k = weekStart(timeOf(s));
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) || 0) + num(s.amount));
  }
  if (![...buckets.values()].some((v) => v > 0)) return [];
  return [...buckets.entries()].map(([k, amount]) => {
    const d = new Date(k);
    return {
      week: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      amount,
    };
  });
}

/** The first `n` open requests, newest first, with plain field names. */
export interface OpenRequest { id: string; title: string; category: string; destination: string | null; targetValue: number | null }
export function openRequests(rfqs: AnyRecord[], n = 6): OpenRequest[] {
  return [...rfqs]
    .sort((a, b) => timeOf(b) - timeOf(a))
    .slice(0, n)
    .map((r) => ({
      id: String(r.id),
      title: String(r.title ?? r.product_name ?? r.productName ?? r.commodity ?? 'Quote request'),
      category: String(r.category ?? r.commodity ?? 'General'),
      destination: r.destination_country ? String(r.destination_country) : null,
      targetValue: num(r.target_price ?? r.targetValue) || null,
    }));
}

export interface ActivityItem { id: string; text: string; at: number }

/**
 * A short "what happened lately" list built from the freshest records the buyer can see.
 * Wording is plain: "Order 12 is confirmed".
 */
export function buyerActivity(
  input: { rfqs: AnyRecord[]; orders: AnyRecord[]; payments: AnyRecord[]; shipments: AnyRecord[] },
  limit = 5,
): ActivityItem[] {
  const say = (s: unknown, fallback: string) => String(s || fallback).replace(/_/g, ' ');
  const items: ActivityItem[] = [
    ...input.rfqs.map((r) => ({ id: `rfq-${r.id}`, at: timeOf(r), text: `Quote request opened: ${r.title || r.product_name || r.commodity || 'new request'}` })),
    ...input.orders.map((o) => ({ id: `ord-${o.id}`, at: timeOf(o), text: `Order ${o.id} is ${say(o.status, 'placed')}` })),
    ...input.payments.map((p) => ({ id: `pay-${p.id}`, at: timeOf(p), text: `Payment ${p.id} is ${say(p.status, 'started')}` })),
    ...input.shipments.map((s) => ({ id: `shp-${s.id}`, at: timeOf(s), text: `Shipment ${s.tracking_number || s.id} is ${say(s.status, 'booked')}` })),
  ];
  return items.sort((a, b) => b.at - a.at).slice(0, limit);
}

/** "5 minutes ago", "yesterday", or a date. Empty string when the time is unknown. */
export function timeAgo(t: number, now: number = Date.now()): string {
  if (!t) return '';
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.round(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 14) return `${d} days ago`;
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
