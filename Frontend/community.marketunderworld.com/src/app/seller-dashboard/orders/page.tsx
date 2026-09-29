"use client"

import React, { useEffect, useMemo, useState } from 'react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { Truck, Clock, Search, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAdminOrders, type AdminGiftCardOrder, type OrderStatus } from '@/lib/api/giftcards';

const STATUS_FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending Payment', value: 'pending_payment' },
  { label: 'Paid', value: 'paid' },
  { label: 'Fulfilling', value: 'fulfilling' },
  { label: 'Fulfilled', value: 'fulfilled' },
  { label: 'Failed', value: 'failed' },
  { label: 'Refunded', value: 'refunded' },
];

const STATUS_BADGE: Record<string, { variant: 'success' | 'warning' | 'info' | 'default'; label: string }> = {
  fulfilled: { variant: 'success', label: 'Fulfilled' },
  fulfilling: { variant: 'info', label: 'Fulfilling' },
  paid: { variant: 'info', label: 'Paid' },
  pending_payment: { variant: 'warning', label: 'Pending Payment' },
  failed: { variant: 'default', label: 'Failed' },
  refunded: { variant: 'default', label: 'Refunded' },
};

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<AdminGiftCardOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    getAdminOrders(statusFilter === 'all' ? undefined : statusFilter).then((data) => {
      setOrders(data.orders);
      setTotal(data.total);
      setLoading(false);
    });
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => o.id.toLowerCase().includes(q) || (o.brandName || '').toLowerCase().includes(q) || o.userId.toLowerCase().includes(q));
  }, [orders, query]);

  const pending = orders.filter((o) => ['pending_payment', 'paid'].includes(o.status)).length;
  const fulfilling = orders.filter((o) => o.status === 'fulfilling').length;
  const failed = orders.filter((o) => o.status === 'failed').length;

  return (
    <div className="p-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Orders</h1>
          <p className="text-text-muted font-medium uppercase tracking-widest text-[10px]">Real gift-card orders and supplier fulfillment status.</p>
        </div>
        <div className="flex gap-4">
          <Badge variant="live">{total} Total</Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Awaiting Payment/Fulfillment', val: pending, icon: Clock, color: 'text-semantic-warning' },
          { label: 'Fulfilling Now', val: fulfilling, icon: Truck, color: 'text-semantic-info' },
          { label: 'Failed (needs review)', val: failed, icon: AlertTriangle, color: 'text-semantic-error' },
        ].map((stat, i) => (
          <ListingCard key={i} variant="stats">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{loading ? '—' : stat.val}</div>
          </ListingCard>
        ))}
      </div>

      <ListingCard className="p-0 overflow-hidden border-brand-border bg-brand-surface">
        <div className="p-6 border-b border-brand-border bg-brand-void/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-ghost" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order ID, brand, or user..."
              className="w-full bg-brand-void border border-brand-border h-11 rounded-lg pl-11 pr-4 text-sm font-mono text-white outline-none focus:border-brand-green transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  "px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                  statusFilter === f.value
                    ? "bg-brand-green border-brand-green text-black"
                    : "bg-brand-void border-brand-border text-text-muted hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full text-left font-mono">
          <thead className="bg-brand-void text-[10px] text-text-muted uppercase tracking-widest">
            <tr>
              <th className="p-6">Order ID</th>
              <th className="p-6">Buyer</th>
              <th className="p-6">Brand</th>
              <th className="p-6">Value</th>
              <th className="p-6">Status</th>
              <th className="p-6">Placed</th>
            </tr>
          </thead>
          <tbody className="text-sm text-white divide-y divide-brand-border/50">
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center text-text-muted">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-text-muted">No orders match.</td></tr>
            ) : filtered.map((o) => {
              const badge = STATUS_BADGE[o.status] || { variant: 'default' as const, label: o.status };
              return (
                <tr key={o.id} className="hover:bg-brand-void/30 transition-colors group">
                  <td className="p-6 font-bold text-brand-green">#{o.id.slice(0, 8).toUpperCase()}</td>
                  <td className="p-6 text-text-muted">{o.userId.slice(0, 8)}…</td>
                  <td className="p-6">{o.brandName || '—'}</td>
                  <td className="p-6 font-bold">{o.denominationValue} {o.currencyCode}</td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      {o.status === 'failed' && o.fulfillmentError && (
                        <span className="text-[10px] text-semantic-error truncate max-w-[160px]" title={o.fulfillmentError}>{o.fulfillmentError}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-6 text-text-muted">{new Date(o.createdAt).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ListingCard>
    </div>
  );
}
