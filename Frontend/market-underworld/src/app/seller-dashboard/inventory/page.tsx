"use client"

import React from 'react';
import { MARKETPLACE_PRODUCTS } from '@/data/mockData';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Boxes, Package, RefreshCw, MoreVertical, Search, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SellerInventoryPage() {
  return (
    <div className="p-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Inventory Node</h1>
          <p className="text-text-muted font-medium uppercase tracking-widest text-[10px]">Managing local and global stock levels.</p>
        </div>
        <div className="flex gap-4">
          <AppButton className="bg-brand-green text-black px-8 h-12 font-bold uppercase text-[11px]">
            Sync Stock
          </AppButton>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Units', val: '4,280', icon: Boxes, color: 'text-brand-green' },
          { label: 'Low Stock Alerts', val: '3 Items', icon: AlertCircle, color: 'text-semantic-error' },
          { label: 'Sync Status', val: 'Optimal', icon: RefreshCw, color: 'text-semantic-info' },
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
              placeholder="Search inventory SKU..." 
              className="w-full bg-brand-void border border-brand-border h-11 rounded-lg pl-11 pr-4 text-sm font-mono text-white outline-none focus:border-brand-green transition-all"
            />
          </div>
        </div>

        <table className="w-full text-left font-mono">
          <thead className="bg-brand-void text-[10px] text-text-muted uppercase tracking-widest">
            <tr>
              <th className="p-6">Asset Name</th>
              <th className="p-6">SKU ID</th>
              <th className="p-6">Current Stock</th>
              <th className="p-6">Node Status</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-white divide-y divide-brand-border/50">
            {MARKETPLACE_PRODUCTS.slice(0, 5).map((p) => (
              <tr key={p.id} className="hover:bg-brand-void/30 transition-colors">
                <td className="p-6 font-bold">{p.title}</td>
                <td className="p-6 text-text-ghost">#SKU-{p.id.toUpperCase()}</td>
                <td className="p-6">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{p.stock || 500} Units</span>
                    <Badge variant={Number(p.stock) < 50 ? "warning" : "success"} className="text-[8px]">In Stock</Badge>
                  </div>
                </td>
                <td className="p-6 text-text-muted">{p.region}</td>
                <td className="p-6 text-right">
                  <button className="text-text-ghost hover:text-white"><MoreVertical className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListingCard>
    </div>
  );
}