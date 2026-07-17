"use client"

import React, { useState, useEffect } from 'react';
import { STUDENT_PROFILE, RECENT_TRANSACTIONS, CRYPTO_ASSETS } from '@/lib/mock-student-data';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Wallet, Plus, ArrowUpRight, TrendingUp, Clock, ShieldCheck, Copy, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StudentWalletPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-10 space-y-12 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white uppercase italic font-display">Wallet <span className="text-brand-green">Protocol.</span></h1>
          <p className="text-text-muted font-mono text-xs uppercase tracking-widest">Secure Node Settlement • Verified Balance</p>
        </div>
        <div className="flex gap-4">
          <AppButton className="h-12 px-8 font-bold font-mono text-[11px] uppercase">
            <Plus className="w-4 h-4 mr-2" /> Deposit Asset
          </AppButton>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <NexusCard className="p-10 border-white/10 bg-gradient-to-br from-[#1e1e2d] to-[#111118] relative overflow-hidden ring-1 ring-white/5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px] rounded-full" />
            
            <div className="relative z-10 space-y-10">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-4">Master Balance</div>
                <div className="flex items-baseline gap-4">
                  <span className="text-6xl font-bold text-white tracking-tighter">{STUDENT_PROFILE.walletBalance.eth} ETH</span>
                  <span className="text-2xl font-bold text-gray-500">≈ ${STUDENT_PROFILE.walletBalance.usd}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {CRYPTO_ASSETS.slice(0, 3).map((coin) => (
                  <div key={coin.id} className="p-4 bg-black/40 rounded-2xl border border-white/5 group hover:border-brand-green transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-xs" style={{ color: coin.color }}>{coin.symbol}</div>
                      <div className="text-[10px] font-bold text-emerald-500">+{coin.change24h}%</div>
                    </div>
                    <div className="font-bold text-lg">{coin.balance} {coin.symbol}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">${coin.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 p-4 bg-brand-green/5 border border-brand-green/20 rounded-2xl">
                <ShieldCheck className="w-5 h-5 text-brand-green" />
                <div className="text-[10px] font-bold text-brand-green uppercase tracking-widest">Secure Tunnel Active • Transaction Layer Isolated</div>
              </div>
            </div>
          </NexusCard>

          <ListingCard className="p-0 overflow-hidden border-brand-border bg-brand-surface">
            <div className="p-6 border-b border-brand-border bg-brand-void/50 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                <Clock className="w-4 h-4" /> Settlement History
              </h3>
              <Badge variant="info">SYNCED</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono">
                <thead className="bg-brand-void/80 text-[10px] text-text-muted uppercase tracking-widest">
                  <tr>
                    <th className="p-6">Transaction ID</th>
                    <th className="p-6">Asset</th>
                    <th className="p-6">Amount</th>
                    <th className="p-6">Status</th>
                    <th className="p-6 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-brand-border/50">
                  {RECENT_TRANSACTIONS.map((tx) => (
                    <tr key={tx.id} className="hover:bg-brand-void/30 transition-colors">
                      <td className="p-6 font-bold text-white">{tx.hash}</td>
                      <td className="p-6 text-text-muted">{tx.currency}</td>
                      <td className={cn(
                        "p-6 font-bold",
                        tx.amount.startsWith('+') ? "text-brand-green" : "text-semantic-error"
                      )}>{tx.amount}</td>
                      <td className="p-6">
                        <Badge variant="success">CONFIRMED</Badge>
                      </td>
                      <td className="p-6 text-right">
                        <button className="text-text-ghost hover:text-white transition-colors"><ArrowUpRight className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ListingCard>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <ListingCard className="p-8 border-brand-border bg-brand-surface space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-brand-green" /> Receive Protocol
              </h3>
              <div className="p-6 bg-white rounded-2xl flex items-center justify-center">
                <div className="w-48 h-48 bg-gray-100 border-4 border-dashed border-gray-200 flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">MOCK_QR</div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Node Address (ETH)</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-brand-void border border-brand-border p-4 rounded font-mono text-[10px] text-gray-400 break-all leading-relaxed">
                    0x71C7656EC7ab88b098defB751B7401B5f6d8976F
                  </div>
                  <button className="px-4 rounded bg-brand-green text-black hover:bg-brand-green/90 transition-all"><Copy className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </ListingCard>

          <ListingCard className="p-8 border-brand-green/20 bg-brand-green/5 space-y-6">
            <div className="flex items-center gap-3 text-brand-green">
              <TrendingUp className="w-6 h-6" />
              <h4 className="font-bold uppercase tracking-widest text-sm">Reward Yield</h4>
            </div>
            <p className="text-[10px] text-text-muted leading-relaxed font-mono uppercase">
              Your regional trade volume qualifies you for a 0.005 ETH incentive payout. Confirm identity to claim.
            </p>
            <AppButton className="w-full h-10 font-mono text-[9px] uppercase">Authorize Reward Claim</AppButton>
          </ListingCard>
        </div>
      </div>
    </div>
  );
}

import { NexusCard } from '@/components/ui/nexus-card';
