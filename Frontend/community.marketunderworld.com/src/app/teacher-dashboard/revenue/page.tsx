"use client"

import React from 'react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { CreditCard, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Activity, Wallet } from 'lucide-react';
import { STATS } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function TeacherRevenuePage() {
  return (
    <div className="p-10 space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Financial Intelligence</h1>
          <p className="text-text-muted font-medium uppercase tracking-widest text-[10px]">Real-time revenue tracking and payout settlement.</p>
        </div>
        <div className="flex gap-4">
          <AppButton className="bg-brand-green text-black px-8 h-12 font-bold uppercase text-[11px]">
            Withdraw ETH
          </AppButton>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Balance', val: '12.4 ETH', sub: '≈ $38,240', icon: Wallet, color: 'text-brand-green' },
          { label: 'Weekly Revenue', val: '1.24 ETH', sub: '↑ +12% growth', icon: TrendingUp, color: 'text-semantic-info' },
          { label: 'Market Fees', val: '0.24 ETH', sub: 'Platform commission', icon: Activity, color: 'text-text-ghost' },
          { label: 'Pending Settlement', val: '0.42 ETH', sub: 'Clearing in 24h', icon: Clock, color: 'text-semantic-warning' },
        ].map((stat, i) => (
          <ListingCard key={i} variant="stats">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{stat.val}</div>
            <div className="text-[9px] font-bold text-text-ghost uppercase mt-1">{stat.sub}</div>
          </ListingCard>
        ))}
      </div>

      <ListingCard className="p-8 border-brand-border bg-brand-surface">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-8 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-green" /> Transaction Ledger
        </h3>
        <table className="w-full text-left font-mono">
          <thead className="bg-brand-void text-[10px] text-text-muted uppercase tracking-widest">
            <tr>
              <th className="p-4">Transaction ID</th>
              <th className="p-4">Event</th>
              <th className="p-4">Value</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Audit</th>
            </tr>
          </thead>
          <tbody className="text-sm text-white">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-brand-border/50 hover:bg-white/5 transition-colors">
                <td className="p-4 text-brand-green">#TX-8472-0{i}</td>
                <td className="p-4 font-medium">{i % 2 === 0 ? "Session Payout" : "Product Sale"}</td>
                <td className="p-4">0.0{i * 2} ETH</td>
                <td className="p-4"><Badge variant="success">CONFIRMED</Badge></td>
                <td className="p-4 text-right">
                  <button className="text-[9px] font-bold text-text-ghost hover:text-white uppercase">Explorer ↗</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListingCard>
    </div>
  );
}

import { Clock } from 'lucide-react';