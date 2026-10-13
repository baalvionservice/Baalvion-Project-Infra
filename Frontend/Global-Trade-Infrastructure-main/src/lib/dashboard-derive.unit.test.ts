import { describe, expect, it } from 'vitest';
import {
  activeDealCount, buyerActivity, inTransitCount, openOrderCount, openRequests, receivedByWeek,
  receivedTotal, sellerOpenOrderCount, timeAgo, waitingPaymentCount,
} from './dashboard-derive';

const NOW = Date.UTC(2026, 9, 14, 12, 0, 0); // Wed 14 Oct 2026

describe('counts', () => {
  it('counts orders that are not finished, whatever the capitalisation', () => {
    const orders = [{ status: 'Pending' }, { status: 'DELIVERED' }, { status: 'cancelled' }, { status: 'in_transit' }, {}];
    expect(openOrderCount(orders)).toBe(3); // pending, in_transit, and one with no status
  });
  it('counts payments waiting, and only those', () => {
    expect(waitingPaymentCount([{ status: 'pending' }, { status: 'Processing' }, { status: 'awaiting' }, { status: 'paid' }, { status: 'failed' }])).toBe(3);
  });
  it('counts shipments in transit exactly', () => {
    expect(inTransitCount([{ status: 'in_transit' }, { status: 'IN_TRANSIT' }, { status: 'delivered' }, { status: 'in_transit_delayed' }])).toBe(2);
  });
  it('counts seller orders waiting to be fulfilled and deals not finalised', () => {
    expect(sellerOpenOrderCount([{ status: 'confirmed' }, { status: 'processing' }, { status: 'shipped' }])).toBe(2);
    expect(activeDealCount([{ status: 'negotiating' }, { status: 'finalized' }, { status: 'cancelled' }, { status: 'open' }])).toBe(2);
  });
  it('is zero for empty lists rather than failing', () => {
    expect(openOrderCount([])).toBe(0);
    expect(waitingPaymentCount([])).toBe(0);
    expect(inTransitCount([])).toBe(0);
  });
});

describe('receivedTotal', () => {
  it('adds up only payments that reached a paid state', () => {
    expect(receivedTotal([
      { status: 'settled', amount: 100 }, { status: 'completed', amount: '250.50' }, { status: 'released', amount: 49.5 },
      { status: 'pending', amount: 9999 }, { status: 'failed', amount: 9999 },
    ])).toBe(400);
  });
  it('treats missing or non-numeric amounts as zero, never NaN', () => {
    expect(receivedTotal([{ status: 'settled' }, { status: 'settled', amount: 'abc' }, { status: 'settled', amount: 5 }])).toBe(5);
  });
  it('is zero when nothing has been paid', () => {
    expect(receivedTotal([])).toBe(0);
  });
});

describe('receivedByWeek', () => {
  const at = (iso: string) => ({ status: 'settled', amount: 100, createdAt: iso });

  it('returns nothing (not a flat line) when no payment has been received', () => {
    expect(receivedByWeek([], NOW)).toEqual([]);
    expect(receivedByWeek([{ status: 'pending', amount: 50, createdAt: '2026-10-13' }], NOW)).toEqual([]);
  });
  it('groups paid settlements into Monday-start weeks and fills quiet weeks with zero', () => {
    const rows = receivedByWeek([at('2026-10-12T10:00:00Z'), at('2026-10-14T09:00:00Z'), at('2026-09-30T09:00:00Z')], NOW, 4);
    expect(rows).toHaveLength(4);
    expect(rows[rows.length - 1].week).toBe('2026-10-12');
    expect(rows[rows.length - 1].amount).toBe(200);
    expect(rows.find((r) => r.week === '2026-09-28')?.amount).toBe(100);
    expect(rows.find((r) => r.week === '2026-10-05')?.amount).toBe(0);
  });
  it('puts a Sunday in the week that started the previous Monday', () => {
    const rows = receivedByWeek([at('2026-10-11T23:00:00Z')], NOW, 3);
    expect(rows.find((r) => r.week === '2026-10-05')?.amount).toBe(100);
  });
  it('ignores payments older than the window and payments with no date', () => {
    expect(receivedByWeek([at('2025-01-01T00:00:00Z'), { status: 'settled', amount: 500 }], NOW, 4)).toEqual([]);
  });
});

describe('openRequests', () => {
  it('shows the newest first, with plain names and no invented values', () => {
    const rows = openRequests([
      { id: 1, title: 'Cotton', created_at: '2026-10-01', category: 'Textiles', target_price: 0 },
      { id: 2, product_name: 'Steel', created_at: '2026-10-10', destination_country: 'AE', target_price: '1200' },
    ]);
    expect(rows.map((r) => r.id)).toEqual(['2', '1']);
    expect(rows[0]).toMatchObject({ title: 'Steel', category: 'General', destination: 'AE', targetValue: 1200 });
    expect(rows[1].targetValue).toBeNull(); // 0 means "not set", not "free"
    expect(rows[1].destination).toBeNull();
  });
  it('respects the limit', () => {
    expect(openRequests(Array.from({ length: 10 }, (_, i) => ({ id: i })), 3)).toHaveLength(3);
  });
});

describe('buyerActivity', () => {
  it('merges the four sources, newest first, in plain words', () => {
    const items = buyerActivity({
      rfqs: [{ id: 'r1', title: 'Cotton', createdAt: '2026-10-10T10:00:00Z' }],
      orders: [{ id: 7, status: 'in_transit', createdAt: '2026-10-12T10:00:00Z' }],
      payments: [{ id: 'p1', status: 'pending', createdAt: '2026-10-11T10:00:00Z' }],
      shipments: [{ id: 's1', tracking_number: 'TRK9', status: 'booked', createdAt: '2026-10-09T10:00:00Z' }],
    });
    expect(items.map((i) => i.text)).toEqual([
      'Order 7 is in transit', 'Payment p1 is pending', 'Quote request opened: Cotton', 'Shipment TRK9 is booked',
    ]);
  });
  it('is limited and empty-safe', () => {
    expect(buyerActivity({ rfqs: [], orders: [], payments: [], shipments: [] })).toEqual([]);
    const many = { rfqs: [], payments: [], shipments: [], orders: Array.from({ length: 20 }, (_, i) => ({ id: i, createdAt: 1_700_000_000_000 + i })) };
    expect(buyerActivity(many, 5)).toHaveLength(5);
  });
});

describe('timeAgo', () => {
  it('speaks in plain units', () => {
    expect(timeAgo(NOW - 20_000, NOW)).toBe('just now');
    expect(timeAgo(NOW - 60_000, NOW)).toBe('1 minute ago');
    expect(timeAgo(NOW - 5 * 60_000, NOW)).toBe('5 minutes ago');
    expect(timeAgo(NOW - 3 * 3600_000, NOW)).toBe('3 hours ago');
    expect(timeAgo(NOW - 26 * 3600_000, NOW)).toBe('yesterday');
    expect(timeAgo(NOW - 4 * 86_400_000, NOW)).toBe('4 days ago');
  });
  it('shows a date for older items and nothing for an unknown time', () => {
    expect(timeAgo(NOW - 40 * 86_400_000, NOW)).toMatch(/2026/);
    expect(timeAgo(0, NOW)).toBe('');
  });
});
