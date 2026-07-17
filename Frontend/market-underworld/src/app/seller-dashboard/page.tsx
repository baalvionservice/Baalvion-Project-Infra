"use client"

import React from 'react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { ShoppingBag, Package, TrendingUp, DollarSign, Globe, Plus, ArrowUpRight, Activity } from 'lucide-react';
import { MARKETPLACE_PRODUCTS } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function SellerDashboardOverview() {
  const sellerProducts = MARKETPLACE_PRODUCTS.filter(p => p.sellerVerified);

  return (
    <div className="p-10 space-y-12 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white uppercase italic font-display">Merchant <span className="text-brand-green">Command.</span></h1>
          <p className="text-text-muted font-mono text-xs uppercase tracking-widest">Operator Node: Global Logistics • Verified Status</p>
        </div>
        <div className="flex gap-4">
          <AppButton className="h-12 px-8 font-bold font-mono text-[11px] uppercase">
            <Plus className="w-4 h-4 mr-2" /> Add Inventory
          </AppButton>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Listings', val: sellerProducts.length, icon: Package, color: 'text-brand-green' },
          { label: 'Total Orders', val: '1,247', icon: ShoppingBag, color: 'text-semantic-info' },
          { label: 'Platform Share', val: '4.2%', icon: Globe, color: 'text-semantic-warning' },
          { label: 'Merchant Level', val: 'Gold', icon: Activity, color: 'text-white' },
        ].map((stat, i) => (
          <ListingCard key={i} variant="stats">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={cn("w-5 h-5", stat.color)} />
              <ArrowUpRight className="w-4 h-4 text-text-muted" />
            </div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{stat.val}</div>
          </ListingCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <ListingCard className="lg:col-span-12 p-8 border-brand-border bg-brand-surface">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">Managed Inventory Node</h3>
            <Badge variant="info">GLOBAL SYNC ACTIVE</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono">
              <thead className="bg-brand-void text-[10px] text-text-muted uppercase tracking-widest">
                <tr>
                  <th className="p-4 border-b border-brand-border">Asset ID</th>
                  <th className="p-4 border-b border-brand-border">Description</th>
                  <th className="p-4 border-b border-brand-border">Node Origin</th>
                  <th className="p-4 border-b border-brand-border">Price (USDT)</th>
                  <th className="p-4 border-b border-brand-border">Rating</th>
                  <th className="p-4 border-b border-brand-border text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {sellerProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-void/50 border-b border-brand-border/50 group transition-colors">
                    <td className="p-4 font-bold text-brand-green">#{p.id.toUpperCase()}</td>
                    <td className="p-4 text-white font-medium">{p.title}</td>
                    <td className="p-4 text-text-muted">{p.region}</td>
                    <td className="p-4 text-white font-bold">{p.price}</td>
                    <td className="p-4 text-semantic-warning">★ {p.rating}</td>
                    <td className="p-4 text-right">
                      <button className="text-text-ghost hover:text-white transition-colors uppercase text-[9px] font-bold">Manage Asset</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ListingCard>
      </div>
    </div>
  );
}
