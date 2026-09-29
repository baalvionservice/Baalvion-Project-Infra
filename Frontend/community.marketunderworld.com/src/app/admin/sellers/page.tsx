"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Search, ShieldCheck, Globe, ClipboardCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { listAdminStores, listSellerApplications, type CommerceStoreAdmin } from '@/lib/api/commerce-admin';

const STATUS_VARIANT: Record<CommerceStoreAdmin['status'], 'success' | 'warning' | 'default'> = {
  active: 'success',
  maintenance: 'warning',
  inactive: 'default',
};

export default function SellerMarketplacePage() {
  const [stores, setStores] = useState<CommerceStoreAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [countries, setCountries] = useState(0);
  const [pendingApplications, setPendingApplications] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = (opts: { search?: string } = {}) => {
    setLoading(true);
    setError(null);
    listAdminStores({ limit: 100, search: opts.search })
      .then((res) => {
        setStores(res.items);
        setTotal(res.pagination.total);
        setCountries(new Set(res.items.map((s) => s.countryCode)).size);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load stores'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    listSellerApplications({ status: 'pending', limit: 1 }).then((res) => setPendingApplications(res.pagination.total)).catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    load({ search });
  };

  return (
    <div className="p-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Seller Marketplace</h1>
          <p className="text-text-muted font-medium">Global merchant registry — real stores from commerce-service.</p>
        </div>
        <Link href="/admin/seller-applications">
          <AppButton className="bg-brand-green text-black px-8 h-12 font-bold uppercase text-[11px] tracking-widest gap-2">
            <ClipboardCheck className="w-4 h-4" /> Pending Applications ({pendingApplications})
          </AppButton>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Stores', val: total.toLocaleString(), icon: ShieldCheck, color: 'text-brand-green' },
          { label: 'Countries Represented', val: countries.toLocaleString(), icon: Globe, color: 'text-semantic-info' },
          { label: 'Pending Applications', val: pendingApplications.toLocaleString(), icon: ClipboardCheck, color: 'text-semantic-warning' },
        ].map((stat, i) => (
          <ListingCard key={i} variant="stats">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{stat.val}</div>
          </ListingCard>
        ))}
      </div>

      <ListingCard className="p-0 overflow-hidden border-brand-border bg-brand-surface">
        <div className="p-6 border-b border-brand-border bg-brand-void/50">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-ghost" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search store name..."
              className="w-full bg-brand-void border border-brand-border h-11 rounded-lg pl-11 pr-4 text-sm font-mono text-white outline-none focus:border-brand-green transition-all"
            />
          </form>
        </div>

        {error ? (
          <div className="p-16 text-center text-semantic-error font-medium">{error}</div>
        ) : loading ? (
          <div className="p-16 flex items-center justify-center gap-3 text-text-muted">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading stores…
          </div>
        ) : stores.length === 0 ? (
          <div className="p-16 text-center text-text-muted font-medium">No stores match this search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono">
              <thead className="bg-brand-void/80 text-[10px] text-text-muted uppercase tracking-widest">
                <tr>
                  <th className="p-6">Store</th>
                  <th className="p-6">Code</th>
                  <th className="p-6">Country</th>
                  <th className="p-6">Currency</th>
                  <th className="p-6">Status</th>
                  <th className="p-6">Created</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-brand-border/50">
                {stores.map((store) => (
                  <tr key={store.id} className="hover:bg-brand-void/30 transition-colors group">
                    <td className="p-6">
                      <div className="font-bold text-white group-hover:text-brand-green transition-colors">{store.name}</div>
                    </td>
                    <td className="p-6 text-text-muted">{store.code}</td>
                    <td className="p-6 text-white">{store.countryCode}</td>
                    <td className="p-6 text-text-muted">{store.currencyCode}</td>
                    <td className="p-6"><Badge variant={STATUS_VARIANT[store.status]}>{store.status}</Badge></td>
                    <td className="p-6 text-text-muted">{new Date(store.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ListingCard>
    </div>
  );
}
