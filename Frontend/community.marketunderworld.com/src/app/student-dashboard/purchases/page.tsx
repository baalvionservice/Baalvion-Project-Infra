"use client"

import React, { useState, useEffect } from 'react';
import { MARKETPLACE_ORDERS } from '@/lib/mock-student-data';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Search, ShoppingBag, Truck, Package, MoreVertical, CreditCard, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StudentPurchasesPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Trade History</h1>
          <p className="text-text-muted font-medium">Review your marketplace acquisitions and node settlements.</p>
        </div>
        <div className="flex gap-4">
          <AppButton className="bg-brand-green text-black px-8 h-12 font-bold uppercase text-[11px] tracking-widest">
            Export History (CSV)
          </AppButton>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Orders', val: '12', icon: ShoppingBag, color: 'text-brand-green' },
          { label: 'In Transit', val: '2', icon: Truck, color: 'text-semantic-info' },
          { label: 'Total Spent', val: '$2,447', icon: CreditCard, color: 'text-semantic-warning' },
          { label: 'Pending Payout', val: '0.005 ETH', icon: Package, color: 'text-white' },
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
              placeholder="Search order IDs, items..." 
              className="w-full bg-brand-void border border-brand-border h-11 rounded-lg pl-11 pr-4 text-sm font-mono text-white outline-none focus:border-brand-green transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono">
            <thead className="bg-brand-void/80 text-[10px] text-text-muted uppercase tracking-widest">
              <tr>
                <th className="p-6">Order Identity</th>
                <th className="p-6">Item Description</th>
                <th className="p-6">Merchant Node</th>
                <th className="p-6">Trade Value</th>
                <th className="p-6">Protocol Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-brand-border/50">
              {MARKETPLACE_ORDERS.map((order) => (
                <tr key={order.id} className="hover:bg-brand-void/30 transition-colors group">
                  <td className="p-6">
                    <div className="font-bold text-white">#{order.id.toUpperCase()}</div>
                    <div className="text-[10px] text-text-muted">{order.date}</div>
                  </td>
                  <td className="p-6">
                    <div className="text-white font-bold">{order.item}</div>
                    <div className="text-[10px] text-text-ghost">{order.category}</div>
                  </td>
                  <td className="p-6 text-text-muted">{order.store}</td>
                  <td className="p-6 text-white font-bold">{order.amount}</td>
                  <td className="p-6">
                    <Badge variant={order.status === 'Preparing' ? 'warning' : 'success'}>
                      {order.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-text-ghost hover:text-white transition-colors" title="Track"><Truck className="w-4 h-4" /></button>
                      <button className="p-2 text-text-ghost hover:text-white transition-colors"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ListingCard>
    </div>
  );
}
