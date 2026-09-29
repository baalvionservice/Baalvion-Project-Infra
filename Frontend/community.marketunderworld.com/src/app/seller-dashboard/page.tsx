"use client"

import React, { useEffect, useState } from 'react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { ShoppingBag, Package, TrendingUp, DollarSign, RefreshCw, ArrowUpRight, Activity } from 'lucide-react';
import { getMerchantStats, getAdminOrders, syncCatalog, type MerchantStats, type AdminGiftCardOrder } from '@/lib/api/giftcards';
import { cn } from '@/lib/utils';

const STATUS_BADGE: Record<string, { variant: 'success' | 'warning' | 'info' | 'default'; label: string }> = {
  fulfilled: { variant: 'success', label: 'Fulfilled' },
  fulfilling: { variant: 'info', label: 'Fulfilling' },
  paid: { variant: 'info', label: 'Paid' },
  pending_payment: { variant: 'warning', label: 'Pending Payment' },
  failed: { variant: 'default', label: 'Failed' },
  refunded: { variant: 'default', label: 'Refunded' },
};

export default function SellerDashboardOverview() {
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminGiftCardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([getMerchantStats(), getAdminOrders()]).then(([s, orders]) => {
      setStats(s);
      setRecentOrders(orders.orders.slice(0, 8));
      setLoading(false);
    });
  };

  useEffect(load, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      await syncCatalog('reloadly');
      setSyncMessage('Catalog sync complete.');
      load();
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const revenue = stats ? (stats.revenueUsdCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '—';

  const statCards = [
    { label: 'Active Brands', val: stats?.activeBrands ?? '—', icon: Package, color: 'text-brand-green' },
    { label: 'Total Orders', val: stats?.totalOrders ?? '—', icon: ShoppingBag, color: 'text-semantic-info' },
    { label: 'Fulfilled', val: stats?.fulfilledOrders ?? '—', icon: TrendingUp, color: 'text-semantic-warning' },
    { label: 'Revenue (Fulfilled)', val: revenue, icon: DollarSign, color: 'text-white' },
  ];

  return (
    <div className="p-10 space-y-12 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white uppercase italic font-display">Merchant <span className="text-brand-green">Command.</span></h1>
          <p className="text-text-muted font-mono text-xs uppercase tracking-widest">Gift Card Store • Reloadly Supplier Node</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <AppButton onClick={handleSync} disabled={syncing} className="h-12 px-8 font-bold font-mono text-[11px] uppercase">
            <RefreshCw className={cn("w-4 h-4 mr-2", syncing && "animate-spin")} /> {syncing ? 'Syncing…' : 'Sync Catalog'}
          </AppButton>
          {syncMessage && <span className="text-[10px] font-mono text-text-muted">{syncMessage}</span>}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <ListingCard key={i} variant="stats">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={cn("w-5 h-5", stat.color)} />
              <ArrowUpRight className="w-4 h-4 text-text-muted" />
            </div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{loading ? '—' : stat.val}</div>
          </ListingCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <ListingCard className="lg:col-span-12 p-8 border-brand-border bg-brand-surface">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
              <Activity className="w-4 h-4" /> Recent Orders
            </h3>
            <Badge variant="info">LIVE DATA</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono">
              <thead className="bg-brand-void text-[10px] text-text-muted uppercase tracking-widest">
                <tr>
                  <th className="p-4 border-b border-brand-border">Order ID</th>
                  <th className="p-4 border-b border-brand-border">Brand</th>
                  <th className="p-4 border-b border-brand-border">Value</th>
                  <th className="p-4 border-b border-brand-border">Status</th>
                  <th className="p-4 border-b border-brand-border">Placed</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr><td colSpan={5} className="p-6 text-center text-text-muted">Loading…</td></tr>
                ) : recentOrders.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-text-muted">No orders yet.</td></tr>
                ) : recentOrders.map((o) => {
                  const badge = STATUS_BADGE[o.status] || { variant: 'default' as const, label: o.status };
                  return (
                    <tr key={o.id} className="hover:bg-brand-void/50 border-b border-brand-border/50 group transition-colors">
                      <td className="p-4 font-bold text-brand-green">#{o.id.slice(0, 8).toUpperCase()}</td>
                      <td className="p-4 text-white font-medium">{o.brandName || '—'}</td>
                      <td className="p-4 text-white font-bold">{o.denominationValue} {o.currencyCode}</td>
                      <td className="p-4"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                      <td className="p-4 text-text-muted">{new Date(o.createdAt).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ListingCard>
      </div>
    </div>
  );
}
