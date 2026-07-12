"use client"

import React, { useState, useEffect } from 'react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Truck, Package, Clock, Search, MoreVertical, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SellerOrdersPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Trade Requests</h1>
          <p className="text-text-muted font-medium uppercase tracking-widest text-[10px]">Processing localized fulfillment and escrow releases.</p>
        </div>
        <div className="flex gap-4">
          <Badge variant="live">Auto-Sync: Active</Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Pending Payouts', val: '1.24 ETH', icon: Clock, color: 'text-semantic-warning' },
          { label: 'In Transit', val: '12 Orders', icon: Truck, color: 'text-semantic-info' },
          { label: 'Fulfilled Today', val: '42 Units', icon: CheckCircle2, color: 'text-brand-green' },
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
              placeholder="Search trade identifiers..." 
              className="w-full bg-brand-void border border-brand-border h-11 rounded-lg pl-11 pr-4 text-sm font-mono text-white outline-none focus:border-brand-green transition-all"
            />
          </div>
        </div>

        <table className="w-full text-left font-mono">
          <thead className="bg-brand-void text-[10px] text-text-muted uppercase tracking-widest">
            <tr>
              <th className="p-6">Transaction ID</th>
              <th className="p-6">Buyer Identity</th>
              <th className="p-6">Asset Desc</th>
              <th className="p-6">Escrow Value</th>
              <th className="p-6">Status</th>
              <th className="p-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm text-white divide-y divide-brand-border/50">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="hover:bg-brand-void/30 transition-colors group">
                <td className="p-6 font-bold text-brand-green">#TX-8472-0{i}</td>
                <td className="p-6">USR-NODE-100{i}</td>
                <td className="p-6">High-Grade Iron Ore</td>
                <td className="p-6">12,500 USDT</td>
                <td className="p-6">
                  <Badge variant={i % 2 === 0 ? "success" : "warning"}>
                    {i % 2 === 0 ? "PAID" : "PENDING"}
                  </Badge>
                </td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 text-brand-green hover:bg-brand-green/10 rounded transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                    <button className="p-2 text-semantic-error hover:bg-semantic-error/10 rounded transition-colors"><XCircle className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListingCard>
    </div>
  );
}