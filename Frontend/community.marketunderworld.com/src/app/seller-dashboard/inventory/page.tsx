"use client"

import React, { useEffect, useMemo, useState } from 'react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Boxes, Globe2, RefreshCw, Search, AlertCircle } from 'lucide-react';
import { getAdminCatalog, syncCatalog, type AdminGiftCardBrand } from '@/lib/api/giftcards';
import { cn } from '@/lib/utils';

export default function SellerInventoryPage() {
  const [brands, setBrands] = useState<AdminGiftCardBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [query, setQuery] = useState('');

  const load = () => {
    setLoading(true);
    getAdminCatalog().then((data) => { setBrands(data); setLoading(false); });
  };

  useEffect(load, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncCatalog('reloadly');
      load();
    } finally {
      setSyncing(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q) || b.countryCode.toLowerCase().includes(q));
  }, [brands, query]);

  const activeCount = brands.filter((b) => b.isActive).length;
  const countries = new Set(brands.map((b) => b.countryCode)).size;
  const lastSynced = brands.reduce<string | null>((latest, b) => {
    if (!b.lastSyncedAt) return latest;
    if (!latest || b.lastSyncedAt > latest) return b.lastSyncedAt;
    return latest;
  }, null);

  return (
    <div className="p-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Catalog Inventory</h1>
          <p className="text-text-muted font-medium uppercase tracking-widest text-[10px]">Real gift-card catalog synced from Reloadly.</p>
        </div>
        <div className="flex gap-4">
          <AppButton onClick={handleSync} disabled={syncing} className="bg-brand-green text-black px-8 h-12 font-bold uppercase text-[11px]">
            <RefreshCw className={cn("w-4 h-4 mr-2", syncing && "animate-spin")} /> {syncing ? 'Syncing…' : 'Sync Catalog'}
          </AppButton>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active Brands', val: loading ? '—' : `${activeCount} / ${brands.length}`, icon: Boxes, color: 'text-brand-green' },
          { label: 'Countries Covered', val: loading ? '—' : countries, icon: Globe2, color: 'text-semantic-info' },
          { label: 'Last Synced', val: loading ? '—' : (lastSynced ? new Date(lastSynced).toLocaleString() : 'Never'), icon: AlertCircle, color: 'text-semantic-warning' },
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
        <div className="p-6 border-b border-brand-border bg-brand-void/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-ghost" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brand or country code..."
              className="w-full bg-brand-void border border-brand-border h-11 rounded-lg pl-11 pr-4 text-sm font-mono text-white outline-none focus:border-brand-green transition-all"
            />
          </div>
        </div>

        <table className="w-full text-left font-mono">
          <thead className="bg-brand-void text-[10px] text-text-muted uppercase tracking-widest">
            <tr>
              <th className="p-6">Brand</th>
              <th className="p-6">Country</th>
              <th className="p-6">Denomination</th>
              <th className="p-6">Supplier</th>
              <th className="p-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm text-white divide-y divide-brand-border/50">
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-text-muted">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-text-muted">No brands match your search.</td></tr>
            ) : filtered.map((b) => (
              <tr key={b.slug} className="hover:bg-brand-void/30 transition-colors">
                <td className="p-6 font-bold">{b.name}</td>
                <td className="p-6 text-text-ghost">{b.countryCode} · {b.currencyCode}</td>
                <td className="p-6 text-text-muted">
                  {b.denominationType === 'FIXED'
                    ? (b.fixedDenominations || []).join(', ')
                    : `${b.minDenomination}–${b.maxDenomination}`}
                </td>
                <td className="p-6 text-text-muted capitalize">{b.supplier}</td>
                <td className="p-6 text-right">
                  <Badge variant={b.isActive ? 'success' : 'default'} className="text-[8px]">{b.isActive ? 'Active' : 'Inactive'}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListingCard>
    </div>
  );
}
